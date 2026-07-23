/* ============================================================
   CONFIGURACIÓN — esto es lo que tienes que editar tú
   ============================================================ */

// Datos de tu proyecto Supabase (Settings → API en el dashboard).
// La "anon key" es pública a propósito — Supabase la protege con las
// políticas de seguridad (RLS) que dejamos en supabase-setup.sql, que
// solo permiten INSERTAR, no leer ni borrar.
const SUPABASE_URL = "https://htkacsnbxfakfnjjjzqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a2Fjc25ieGZha2ZuampqenFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDkxODAsImV4cCI6MjEwMDMyNTE4MH0.Pr03QHq4raQ06a_qUxrxR7ew2uQFx_vvP8Kr03ALOa0";

const API_ENDPOINT = `${SUPABASE_URL}/rest/v1/respuestas`;

// Las 6 preguntas — placeholders. Cambia "placeholder" y "options" por el
// texto real cuando lo tengas. El "id" no lo toques (se usa para guardar).
const QUESTIONS = [
  { id: "q1", placeholder: "Escribe aquí la pregunta 1", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"] },
  { id: "q2", placeholder: "Escribe aquí la pregunta 2", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"] },
  { id: "q3", placeholder: "Escribe aquí la pregunta 3", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"] },
  { id: "q4", placeholder: "Escribe aquí la pregunta 4", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"] },
  { id: "q5", placeholder: "Escribe aquí la pregunta 5", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"] },
  { id: "q6", placeholder: "Escribe aquí la pregunta 6", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"] },
];

/* ============================================================
   ESTADO
   ============================================================ */

const STORAGE_QUEUE_KEY = "encuesta_pendientes";
let currentIndex = 0;
let answers = {};

const els = {
  card: document.getElementById("questionCard"),
  progress: document.getElementById("progressTrack"),
  btnBack: document.getElementById("btnBack"),
  btnNext: document.getElementById("btnNext"),
  form: document.getElementById("surveyForm"),
  done: document.getElementById("doneScreen"),
  btnRestart: document.getElementById("btnRestart"),
  statusBar: document.getElementById("statusBar"),
  statusText: document.getElementById("statusText"),
  pendingBadge: document.getElementById("pendingBadge"),
  btnSync: document.getElementById("btnSync"),
};

/* ============================================================
   RENDER
   ============================================================ */

function renderProgress() {
  els.progress.innerHTML = "";
  QUESTIONS.forEach((_, i) => {
    const seg = document.createElement("div");
    seg.className = "seg";
    if (i < currentIndex) seg.classList.add("done");
    if (i === currentIndex) seg.classList.add("current");
    els.progress.appendChild(seg);
  });
}

function renderQuestion() {
  const q = QUESTIONS[currentIndex];
  els.card.innerHTML = `
    <p class="q-index">Pregunta ${currentIndex + 1} de ${QUESTIONS.length}</p>
    <p class="q-title" data-placeholder="${q.placeholder}"></p>
    <div class="options">
      ${q.options.map((opt, i) => `
        <label class="option ${answers[q.id] === opt ? "selected" : ""}">
          <input type="radio" name="${q.id}" value="${opt}" ${answers[q.id] === opt ? "checked" : ""}>
          <span>${opt}</span>
        </label>
      `).join("")}
    </div>
  `;

  els.card.querySelectorAll(`input[name="${q.id}"]`).forEach((input) => {
    input.addEventListener("change", () => {
      answers[q.id] = input.value;
      els.card.querySelectorAll(".option").forEach((opt) => opt.classList.remove("selected"));
      input.closest(".option").classList.add("selected");
      els.btnNext.disabled = false;
    });
  });

  els.btnBack.style.visibility = currentIndex === 0 ? "hidden" : "visible";
  els.btnNext.textContent = currentIndex === QUESTIONS.length - 1 ? "Terminar" : "Siguiente";
  els.btnNext.disabled = !answers[q.id];

  renderProgress();
}

function showDone() {
  els.form.style.display = "none";
  els.done.style.display = "block";
}

function restart() {
  currentIndex = 0;
  answers = {};
  els.form.style.display = "block";
  els.done.style.display = "none";
  renderQuestion();
}

/* ============================================================
   NAVEGACIÓN
   ============================================================ */

els.btnNext.addEventListener("click", () => {
  if (currentIndex < QUESTIONS.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    saveResponseLocally(answers);
    showDone();
  }
});

els.btnBack.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

els.btnRestart.addEventListener("click", restart);

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
    respuestas: data,
    creado_en: new Date().toISOString(),
  });
  setQueue(queue);
  updatePendingBadge();
  // Si ya hay internet, intenta enviar altiro
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
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Respuesta no OK");
    } catch (err) {
      // Si falla (sin internet real, endpoint caído, etc), se queda en la cola
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

/* ============================================================
   ESTADO DE CONEXIÓN
   ============================================================ */

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
renderQuestion();
