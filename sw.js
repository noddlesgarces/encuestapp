// Nombre de la caché — súbelo (v2, v3...) cada vez que cambies estos archivos
// para forzar que los dispositivos ya instalados bajen la versión nueva.
const CACHE_NAME = "encuesta-cache-v7";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./assets/logo-anova.png",
  "./assets/banner-anova.png"
];

// Instala y guarda todo el "app shell" en caché para que cargue sin internet
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Limpia cachés viejas cuando se activa una versión nueva
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: cache-first para el app shell, con fallback a red para lo demás
// (por ejemplo, el endpoint donde se sincronizan las respuestas, que NO se cachea)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // El panel de admin NUNCA se cachea: siempre debe cargar la versión más nueva.
  // Todo lo demás (el formulario público) sigue con cache-first para funcionar offline.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/panel/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Guarda en caché cualquier recurso nuevo del mismo origen
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      }).catch(() => cached);
    })
  );
});