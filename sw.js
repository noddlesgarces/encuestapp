// Nombre de la caché — súbelo (v2, v3...) cada vez que cambies estos archivos
// para forzar que los dispositivos ya instalados bajen la versión nueva.
const CACHE_NAME = "encuesta-cache-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
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

  // Solo aplicamos cache-first a peticiones GET del mismo origen
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
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
