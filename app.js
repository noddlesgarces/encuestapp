/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const SUPABASE_URL = "https://htkacsnbxfakfnjjjzqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a2Fjc25ieGZha2ZuampqenFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDkxODAsImV4cCI6MjEwMDMyNTE4MH0.Pr03QHq4raQ06a_qUxrxR7ew2uQFx_vvP8Kr03ALOa0";

const RESPUESTAS_ENDPOINT = `${SUPABASE_URL}/rest/v1/respuestas`;

// id de la encuesta a mostrar, viene de la URL: index.html?e=<uuid>
const params = new URLSearchParams(window.location.search);
const ENCUESTA_ID = params.get("e");

const STORAGE_QUEUE_KEY = "encuesta_pendientes";

/* ============================================================
   ESTADO
   ============================================================ */

let encuesta = null;
let preguntas = []; // [{id, categoria, texto, opciones, orden}]
let categorias = []; // nombres de categoría en orden de aparición
let answers = {}; // { [pregunta_id]: opcion_elegida }
let openCategoria = null; // qué categoría está desplegada

const els = {
  main: document.getElementById("mainContent"),
  eyebrow: document.getElementById("surveyEyebrow"),
  title: document.getElementById("surveyTitle"),
  subtitle: document.getElementById("surveySubtitle"),
  form: document.getElementById("surveyForm"),
  categories: document.getElementById("categoriesContainer"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  btnSubmit: document.getElementById("btnSubmit"),
  done: document.getElementById("doneScreen"),
  btnRestart: document.getElementById("btnRestart"),
  statusBar: document.getElementById("statusBar"),
  statusText: document.getElementById("statusText"),
  pendingBadge: document.getElementById("pendingBadge"),
  btnSync: document.getElementById("btnSync"),
  errorScreen: document.getElementById("errorScreen"),
};

/* ============================================================
   CARGA DE LA ENCUESTA
   ============================================================ */

async function fetchJson(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error("No se pudo cargar la encuesta");
  return res.json();
}

async function init() {
  if (!ENCUESTA_ID) {
    showError("Este link no incluye una encuesta. Pide el link correcto a quien te lo compartió.");
    return;
  }

  try {
    const [encuestas, preguntasData] = await Promise.all([
      fetchJson(`encuestas?id=eq.${ENCUESTA_ID}&select=*`),
      fetchJson(`preguntas?encuesta_id=eq.${ENCUESTA_ID}&select=*&order=orden.asc`),
    ]);

    if (!encuestas.length) {
      showError("No encontramos esta encuesta. Puede que haya sido eliminada.");
      return;
    }

    encuesta = encuestas[0];
    preguntas = preguntasData;

    if (!preguntas.length) {
      showError("Esta encuesta todavía no tiene preguntas.");
      return;
    }

    categorias = [];
    preguntas.forEach((p) => {
      const cat = p.categoria || "General";
      if (!categorias.includes(cat)) categorias.push(cat);
    });
    openCategoria = categorias[0];

    els.eyebrow.textContent = "Encuesta";
    els.title.textContent = encuesta.titulo;
    els.subtitle.textContent = encuesta.descripcion || "";
    els.subtitle.style.display = encuesta.descripcion ? "block" : "none";

    els.errorScreen.style.display = "none";
    els.main.style.display = "block";
    renderCategories();
  } catch (err) {
    console.error(err);
    showError("No se pudo cargar la encuesta. Revisa tu conexión e intenta de nuevo.");
  }
}

function showError(msg) {
  els.errorScreen.querySelector("p").textContent = msg;
  els.errorScreen.style.display = "block";
}

/* ============================================================
   RENDER — acordeón por categoría
   ============================================================ */

function preguntasDe(categoria) {
  return preguntas.filter((p) => (p.categoria || "General") === categoria);
}

function renderCategories() {
  els.categories.innerHTML = categorias.map((cat) => {
    const qs = preguntasDe(cat);
    const respondidas = qs.filter((q) => answers[q.id]).length;
    const isOpen = openCategoria === cat;

    return `
      <div class="cat-section ${isOpen ? "open" : ""}" data-cat="${escapeAttr(cat)}">
        <button type="button" class="cat-header">
          <span class="cat-name">${escapeHtml(cat)}</span>
          <span class="cat-meta">
            <span class="cat-count">${respondidas}/${qs.length}</span>
            <svg class="cat-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
        <div class="cat-body">
          ${qs.map((q) => renderQuestion(q)).join("")}
        </div>
      </div>
    `;
  }).join("");

  els.categories.querySelectorAll(".cat-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.closest(".cat-section");
      const cat = section.dataset.cat;
      openCategoria = openCategoria === cat ? null : cat;
      renderCategories();
    });
  });

  els.categories.querySelectorAll("input[type=radio]").forEach((input) => {
    input.addEventListener("change", () => {
      answers[input.name] = input.value;
      updateProgress();
      // re-render solo para actualizar el estado visual, manteniendo la categoría abierta
      renderCategories();
    });
  });

  updateProgress();
}

function renderQuestion(q) {
  const opciones = Array.isArray(q.opciones) ? q.opciones : [];
  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <div class="options">
        ${opciones.map((opt) => `
          <label class="option ${answers[q.id] === opt ? "selected" : ""}">
            <input type="radio" name="${q.id}" value="${escapeAttr(opt)}" ${answers[q.id] === opt ? "checked" : ""}>
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function updateProgress() {
  const total = preguntas.length;
  const respondidas = preguntas.filter((q) => answers[q.id]).length;
  els.progressText.textContent = `${respondidas} de ${total} respondidas`;
  els.progressFill.style.width = `${total ? (respondidas / total) * 100 : 0}%`;
  els.btnSubmit.disabled = respondidas < total;
}

/* ============================================================
   ENVÍO
   ============================================================ */

els.btnSubmit.addEventListener("click", () => {
  saveResponseLocally(answers);
  showDone();
});

function showDone() {
  els.form.style.display = "none";
  els.done.style.display = "block";
}

els.btnRestart.addEventListener("click", () => {
  answers = {};
  openCategoria = categorias[0];
  els.form.style.display = "block";
  els.done.style.display = "none";
  renderCategories();
});

/* ============================================================
   GUARDADO LOCAL (funciona sin internet)
   ============================================================ */

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function setQueue(queue) {
  localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
}

function saveResponseLocally(data) {
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID(),
    encuesta_id: ENCUESTA_ID,
    respuestas: data,
    creado_en: new Date().toISOString(),
  });
  setQueue(queue);
  updatePendingBadge();
  if (navigator.onLine) trySync();
}

/* ============================================================
   SINCRONIZACIÓN (cuando vuelve la conexión)
   ============================================================ */

async function trySync() {
  const queue = getQueue();
  if (queue.length === 0) return;

  const stillPending = [];

  for (const item of queue) {
    try {
      const res = await fetch(RESPUESTAS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Respuesta no OK");
    } catch (err) {
      stillPending.push(item);
    }
  }

  setQueue(stillPending);
  updatePendingBadge();
}

function updatePendingBadge() {
  const n = getQueue().length;
  if (n > 0) {
    els.pendingBadge.style.display = "inline";
    els.pendingBadge.textContent = `${n} sin enviar`;
    els.btnSync.style.display = "block";
    els.btnSync.disabled = false;
    els.btnSync.textContent = "Enviar respuestas pendientes";
  } else {
    els.pendingBadge.style.display = "none";
    els.btnSync.style.display = "none";
  }
}

function updateConnectionStatus() {
  if (navigator.onLine) {
    els.statusBar.classList.add("online");
    els.statusText.innerHTML = "Conectado — <strong>enviando pendientes</strong>";
    trySync();
  } else {
    els.statusBar.classList.remove("online");
    els.statusText.innerHTML = "Sin conexión — <strong>tus respuestas se guardan igual</strong>";
  }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

els.btnSync.addEventListener("click", async () => {
  const before = getQueue().length;
  els.btnSync.disabled = true;
  els.btnSync.textContent = "Enviando...";

  await trySync();

  const after = getQueue().length;

  if (after === 0) {
    els.btnSync.textContent = "¡Enviado!";
    setTimeout(updatePendingBadge, 1200);
  } else if (after < before) {
    els.btnSync.textContent = `Enviadas ${before - after}, faltan ${after}`;
    els.btnSync.disabled = false;
  } else {
    els.btnSync.textContent = "Sin conexión, intenta de nuevo";
    els.btnSync.disabled = false;
  }
});

/* ============================================================
   HELPERS
   ============================================================ */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

/* ============================================================
   INIT
   ============================================================ */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.error("Error registrando service worker:", err);
    });
  });
}

updateConnectionStatus();
updatePendingBadge();
init();
