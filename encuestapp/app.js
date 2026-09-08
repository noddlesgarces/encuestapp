/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const SUPABASE_URL = "https://htkacsnbxfakfnjjjzqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a2Fjc25ieGFrZm5qampqenFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDkxODAsImV4cCI6MjEwMDMyNTE4MH0.Pr03QHq4raQ06a_qUxrxR7ew2uQFx_vvP8Kr03ALOa0";

const RESPUESTAS_ENDPOINT = `${SUPABASE_URL}/rest/v1/respuestas`;

// id de la encuesta a mostrar, viene de la URL: index.html?e=<uuid>
const params = new URLSearchParams(window.location.search);
const ENCUESTA_ID = params.get("e");

const STORAGE_QUEUE_KEY = "encuesta_pendientes";

/* ============================================================
   ESTADO
   ============================================================ */

let encuesta = null;
let preguntas = []; // [{id, categoria, texto, opciones, tipo, mostrar_si, salta_a, opciones_por, matriz_filas, ...}]
let categorias = []; // nombres de categoría en orden de aparición
let answers = {}; // { [pregunta_id]: valor } — el "valor" depende del tipo
let openCategoria = null; // qué categoría está desplegada
let identificacion = { nombre: "", correo: "" };
let encuestaTerminadaPorSalto = false; // true si una respuesta llevó a "FIN"

const els = {
  main: document.getElementById("mainContent"),
  eyebrow: document.getElementById("surveyEyebrow"),
  title: document.getElementById("surveyTitle"),
  subtitle: document.getElementById("surveySubtitle"),
  brandBlock: document.getElementById("brandBlock"),
  idBlock: document.getElementById("idBlock"),
  form: document.getElementById("surveyForm"),
  categories: document.getElementById("categoriesContainer"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  btnSubmit: document.getElementById("btnSubmit"),
  done: document.getElementById("doneScreen"),
  endScreen: document.getElementById("endScreen"),
  btnRestart: document.getElementById("btnRestart"),
  btnRestart2: document.getElementById("btnRestart2"),
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

    applyBranding();

    els.eyebrow.textContent = "Encuesta";
    els.title.textContent = encuesta.titulo;
    els.subtitle.textContent = encuesta.descripcion || "";
    els.subtitle.style.display = encuesta.descripcion ? "block" : "none";

    renderIdentificacion();

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
   IDENTIDAD VISUAL (logo, banner, color de marca)
   ============================================================ */

function applyBranding() {
  if (encuesta.color_primario) {
    document.documentElement.style.setProperty("--accent", encuesta.color_primario);
    document.documentElement.style.setProperty("--accent-dim", shade(encuesta.color_primario, -0.35));
    document.documentElement.style.setProperty("--accent-fg", contrastColor(encuesta.color_primario));
  }

  if (encuesta.banner_url || encuesta.logo_url) {
    els.brandBlock.style.display = "block";
    els.brandBlock.innerHTML = `
      ${encuesta.banner_url ? `<img src="${escapeAttr(encuesta.banner_url)}" alt="" class="brand-banner">` : ""}
      ${encuesta.logo_url ? `<img src="${escapeAttr(encuesta.logo_url)}" alt="" class="brand-logo">` : ""}
    `;
  }
}

function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amount < 0 ? -c : 255 - c) * Math.abs(amount))));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

function contrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#14171C" : "#FFFFFF";
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/* ============================================================
   IDENTIFICACIÓN OPCIONAL (nombre / correo) — antes del consentimiento
   ============================================================ */

function renderIdentificacion() {
  const partes = [];

  if (encuesta.texto_consentimiento) {
    partes.push(`<div class="card id-card"><p class="hint-text" style="color:var(--ink); line-height:1.5;">${escapeHtml(encuesta.texto_consentimiento)}</p></div>`);
  }

  if (encuesta.mostrar_identificacion) {
    partes.push(`
      <div class="card id-card">
        <p class="id-hint">Estos datos son opcionales.</p>
        <label class="field-label">Nombre</label>
        <input type="text" class="text-input" id="idNombre" placeholder="Tu nombre">
        <label class="field-label" style="margin-top:12px;">Correo electrónico</label>
        <input type="email" class="text-input" id="idCorreo" placeholder="tu@correo.cl">
      </div>
    `);
  }

  if (!partes.length) {
    els.idBlock.style.display = "none";
    return;
  }

  els.idBlock.style.display = "block";
  els.idBlock.innerHTML = partes.join("");

  const idNombre = document.getElementById("idNombre");
  const idCorreo = document.getElementById("idCorreo");
  if (idNombre) idNombre.addEventListener("input", (e) => { identificacion.nombre = e.target.value; });
  if (idCorreo) idCorreo.addEventListener("input", (e) => { identificacion.correo = e.target.value; });
}

/* ============================================================
   LÓGICA CONDICIONAL — visibilidad, cascadas y saltos
   ============================================================ */

function findPregunta(id) {
  return preguntas.find((p) => p.id === id);
}

// Resuelve el texto de la respuesta de una pregunta (para evaluar condiciones)
function answerText(q) {
  if (!q) return undefined;
  if (q.tipo === "multiple") {
    const idxs = answers[q.id] || [];
    const opts = getOptionsFor(q);
    return idxs.map((i) => opts[Number(i)]).filter(Boolean);
  }
  const idx = answers[q.id];
  if (idx === undefined) return undefined;
  const opts = getOptionsFor(q);
  return opts[Number(idx)];
}

// Opciones reales de una pregunta, resolviendo cascada (opciones_por) si aplica
function getOptionsFor(q) {
  if (q.opciones_por && q.opciones_por.pregunta_id) {
    const padre = findPregunta(q.opciones_por.pregunta_id);
    const valorPadre = answerText(padre);
    const rama = valorPadre !== undefined ? q.opciones_por.mapa[valorPadre] : undefined;
    if (rama === "__texto__" || rama === undefined) return [];
    return rama;
  }
  return Array.isArray(q.opciones) ? q.opciones : [];
}

// true si, según la cascada, esta pregunta debe mostrarse como texto libre en vez de opciones
function esCascadaTexto(q) {
  if (!q.opciones_por || !q.opciones_por.pregunta_id) return false;
  const padre = findPregunta(q.opciones_por.pregunta_id);
  const valorPadre = answerText(padre);
  const rama = valorPadre !== undefined ? q.opciones_por.mapa[valorPadre] : undefined;
  return rama === "__texto__";
}

// Categorías que deben saltarse según respuestas ya dadas, y si la encuesta debe terminar antes
function computeSkip() {
  const skipped = new Set();
  let endNow = false;

  preguntas.forEach((q) => {
    if (!q.salta_a) return;
    const val = answerText(q);
    if (val === undefined) return;
    const valores = Array.isArray(val) ? val : [val];
    const disparado = valores.some((v) => q.salta_a.valores.includes(v));
    if (!disparado) return;

    const fromIdx = categorias.indexOf(q.categoria);
    if (q.salta_a.destino_categoria === "FIN") {
      for (let i = fromIdx + 1; i < categorias.length; i++) skipped.add(categorias[i]);
      endNow = true;
    } else {
      const toIdx = categorias.indexOf(q.salta_a.destino_categoria);
      if (toIdx > fromIdx) {
        for (let i = fromIdx + 1; i < toIdx; i++) skipped.add(categorias[i]);
      }
    }
  });

  return { skipped, endNow };
}

function isVisible(q, skipped) {
  if (skipped.has(q.categoria)) return false;
  if (q.mostrar_si && q.mostrar_si.pregunta_id) {
    const padre = findPregunta(q.mostrar_si.pregunta_id);
    const val = answerText(padre);
    if (val === undefined) return false;
    const valores = Array.isArray(val) ? val : [val];
    if (!valores.some((v) => q.mostrar_si.valores.includes(v))) return false;
  }
  return true;
}

function isAnswered(q) {
  if (q.tipo === "multiple") {
    const arr = answers[q.id];
    if (!arr || !arr.length) return false;
    return !otroFalta(q, answerText(q));
  }
  if (q.tipo === "matriz") {
    const filas = q.matriz_filas || [];
    return filas.every((_, i) => answers[`${q.id}::${i}`] !== undefined);
  }
  if (q.tipo === "texto" || q.tipo === "texto_largo" || q.tipo === "fecha") {
    return !!(answers[q.id] && String(answers[q.id]).trim());
  }
  // opcion_unica / escala
  const idx = answers[q.id];
  if (idx === undefined) return false;
  return !otroFalta(q, answerText(q));
}

function otroTriggers(q) {
  if (!q.otro_trigger) return [];
  return Array.isArray(q.otro_trigger) ? q.otro_trigger : [q.otro_trigger];
}

function disparaOtro(q, valorSeleccionado) {
  const triggers = otroTriggers(q);
  if (!triggers.length) return false;
  const valores = Array.isArray(valorSeleccionado) ? valorSeleccionado : [valorSeleccionado];
  return valores.some((v) => triggers.includes(v));
}

function otroFalta(q, valorSeleccionado) {
  if (!disparaOtro(q, valorSeleccionado)) return false;
  const detalle = answers[`${q.id}::otro`];
  return !(detalle && detalle.trim());
}

/* ============================================================
   RENDER — acordeón por categoría
   ============================================================ */

function preguntasDe(categoria, visibles) {
  return preguntas.filter((p) => (p.categoria || "General") === categoria && visibles.has(p.id));
}

function renderCategories() {
  const { skipped, endNow } = computeSkip();

  if (endNow) {
    encuestaTerminadaPorSalto = true;
    showEndScreen();
    return;
  }
  encuestaTerminadaPorSalto = false;
  els.endScreen.style.display = "none";
  els.form.style.display = "block";

  const visiblesSet = new Set(preguntas.filter((p) => isVisible(p, skipped)).map((p) => p.id));
  const catsVisibles = categorias.filter((c) => !skipped.has(c) && preguntasDe(c, visiblesSet).length);

  els.categories.innerHTML = catsVisibles.map((cat) => {
    const qs = preguntasDe(cat, visiblesSet);
    const respondidas = qs.filter((q) => isAnswered(q)).length;
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

  wireQuestionInputs();
  updateProgress(visiblesSet);
}

function renderQuestion(q) {
  switch (q.tipo) {
    case "multiple": return renderMultiple(q);
    case "texto": return renderTexto(q, "text");
    case "texto_largo": return renderTextoLargo(q);
    case "fecha": return renderTexto(q, "date");
    case "escala": return renderEscala(q);
    case "matriz": return renderMatriz(q);
    default: return renderOpcionUnica(q);
  }
}

function renderOtroInput(q, mostrar) {
  if (!q.otro_trigger) return "";
  const val = answers[`${q.id}::otro`] || "";
  return `
    <div class="otro-field" style="${mostrar ? "" : "display:none;"}" data-otro-de="${q.id}">
      <input type="text" class="text-input otro-input" data-otro-input="${q.id}"
        placeholder="¿Cuál?" value="${escapeAttr(val)}">
    </div>
  `;
}

function renderOpcionUnica(q) {
  const opciones = getOptionsFor(q);
  const seleccion = answers[q.id];
  const textoSel = seleccion !== undefined ? opciones[Number(seleccion)] : undefined;
  const mostrarOtro = disparaOtro(q, textoSel);

  if (esCascadaTexto(q)) return renderTexto(q, "text");
  if (!opciones.length) {
    return `<div class="q-block"><p class="q-title">${escapeHtml(q.texto)}</p><p class="hint-text">Responde la pregunta anterior primero.</p></div>`;
  }

  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <div class="options">
        ${opciones.map((opt, idx) => `
          <label class="option ${seleccion === String(idx) ? "selected" : ""}">
            <input type="radio" name="${q.id}" value="${idx}" ${seleccion === String(idx) ? "checked" : ""}>
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join("")}
      </div>
      ${renderOtroInput(q, mostrarOtro)}
    </div>
  `;
}

function renderMultiple(q) {
  const opciones = getOptionsFor(q);
  const seleccion = answers[q.id] || [];
  const textosSel = seleccion.map((i) => opciones[Number(i)]);
  const mostrarOtro = disparaOtro(q, textosSel);

  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <p class="hint-text" style="margin:-8px 0 12px;">Puedes elegir más de una opción.</p>
      <div class="options">
        ${opciones.map((opt, idx) => `
          <label class="option ${seleccion.includes(String(idx)) ? "selected" : ""}">
            <input type="checkbox" name="${q.id}" value="${idx}" ${seleccion.includes(String(idx)) ? "checked" : ""}>
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join("")}
      </div>
      ${renderOtroInput(q, mostrarOtro)}
    </div>
  `;
}

function renderTexto(q, htmlType) {
  const val = answers[q.id] || "";
  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <input type="${htmlType}" class="text-input" data-texto-de="${q.id}" value="${escapeAttr(val)}"
        ${htmlType === "date" ? "" : 'placeholder="Escribe tu respuesta"'}>
    </div>
  `;
}

function renderTextoLargo(q) {
  const val = answers[q.id] || "";
  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <textarea class="text-input textarea-input" data-texto-de="${q.id}" placeholder="Escribe tu respuesta" rows="4">${escapeHtml(val)}</textarea>
    </div>
  `;
}

function renderEscala(q) {
  const min = q.escala_min ?? 1;
  const max = q.escala_max ?? 5;
  const pasos = [];
  for (let i = min; i <= max; i++) pasos.push(String(i));
  const seleccion = answers[q.id];

  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <div class="escala-row">
        ${pasos.map((n, idx) => `
          <label class="escala-opt ${seleccion === String(idx) ? "selected" : ""}">
            <input type="radio" name="${q.id}" value="${idx}" ${seleccion === String(idx) ? "checked" : ""}>
            <span>${n}</span>
          </label>
        `).join("")}
      </div>
      ${q.escala_min_label || q.escala_max_label ? `
        <div class="escala-labels">
          <span>${escapeHtml(q.escala_min_label || "")}</span>
          <span>${escapeHtml(q.escala_max_label || "")}</span>
        </div>
      ` : ""}
    </div>
  `;
}

function renderMatriz(q) {
  const filas = q.matriz_filas || [];
  const columnas = getOptionsFor(q);
  return `
    <div class="q-block">
      <p class="q-title">${escapeHtml(q.texto)}</p>
      <div class="matriz-wrap">
        <table class="matriz-table">
          <thead>
            <tr>
              <th></th>
              ${columnas.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${filas.map((fila, fi) => `
              <tr>
                <td class="matriz-fila-label">${escapeHtml(fila)}</td>
                ${columnas.map((_, ci) => `
                  <td>
                    <input type="radio" name="${q.id}::${fi}" value="${ci}"
                      ${answers[`${q.id}::${fi}`] === String(ci) ? "checked" : ""}>
                  </td>
                `).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function wireQuestionInputs() {
  els.categories.querySelectorAll("input[type=radio]").forEach((input) => {
    input.addEventListener("change", () => {
      answers[input.name] = input.value;
      renderCategories();
    });
  });

  els.categories.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => {
      const qid = input.name;
      const arr = new Set(answers[qid] || []);
      if (input.checked) arr.add(input.value); else arr.delete(input.value);
      answers[qid] = Array.from(arr);
      renderCategories();
    });
  });

  els.categories.querySelectorAll("[data-texto-de]").forEach((input) => {
    input.addEventListener("input", () => {
      answers[input.dataset.textoDe] = input.value;
    });
    input.addEventListener("blur", () => updateProgress());
  });

  els.categories.querySelectorAll("[data-otro-input]").forEach((input) => {
    input.addEventListener("input", () => {
      answers[`${input.dataset.otroInput}::otro`] = input.value;
    });
    input.addEventListener("blur", () => updateProgress());
  });
}

function updateProgress(visiblesSet) {
  const visibles = visiblesSet || (() => {
    const { skipped } = computeSkip();
    return new Set(preguntas.filter((p) => isVisible(p, skipped)).map((p) => p.id));
  })();
  const requeridas = preguntas.filter((q) => visibles.has(q.id) && q.requerida !== false);
  const total = requeridas.length;
  const respondidas = requeridas.filter((q) => isAnswered(q)).length;
  els.progressText.textContent = `${respondidas} de ${total} respondidas`;
  els.progressFill.style.width = `${total ? (respondidas / total) * 100 : 0}%`;
  els.btnSubmit.disabled = respondidas < total;
}

/* ============================================================
   PANTALLA DE TÉRMINO ANTICIPADO (ej. no acepta el consentimiento)
   ============================================================ */

function showEndScreen() {
  els.form.style.display = "none";
  els.done.style.display = "none";
  els.endScreen.style.display = "block";
  // Igual guardamos localmente lo que se alcanzó a responder (ej. el rechazo del consentimiento)
  saveResponseLocally(buildRespuestasParaEnviar());
}

/* ============================================================
   ENVÍO
   ============================================================ */

function buildRespuestasParaEnviar() {
  const resultado = {};

  preguntas.forEach((q) => {
    if (q.tipo === "matriz") {
      const filas = q.matriz_filas || [];
      const columnas = getOptionsFor(q);
      const val = {};
      filas.forEach((fila, fi) => {
        const idx = answers[`${q.id}::${fi}`];
        if (idx !== undefined) val[fila] = columnas[Number(idx)];
      });
      if (Object.keys(val).length) resultado[q.id] = val;
      return;
    }

    if (q.tipo === "multiple") {
      const idxs = answers[q.id];
      if (!idxs || !idxs.length) return;
      const opciones = getOptionsFor(q);
      let vals = idxs.map((i) => opciones[Number(i)]);
      const otro = answers[`${q.id}::otro`];
      const triggers = otroTriggers(q);
      if (triggers.length && otro) {
        vals = vals.map((v) => (triggers.includes(v) ? `${v}: ${otro}` : v));
      }
      resultado[q.id] = vals;
      return;
    }

    if (q.tipo === "texto" || q.tipo === "texto_largo" || q.tipo === "fecha") {
      const val = answers[q.id];
      if (val !== undefined && String(val).trim()) resultado[q.id] = val;
      return;
    }

    // opcion_unica / escala
    const idx = answers[q.id];
    if (idx === undefined) return;
    const opciones = getOptionsFor(q);
    let val = opciones[Number(idx)];
    const otro = answers[`${q.id}::otro`];
    if (otroTriggers(q).includes(val) && otro) val = `${val}: ${otro}`;
    resultado[q.id] = val;
  });

  return resultado;
}

els.btnSubmit.addEventListener("click", () => {
  const payload = buildRespuestasParaEnviar();
  saveResponseLocally(payload);
  showDone();
});

function showDone() {
  els.form.style.display = "none";
  els.done.style.display = "block";
}

function resetSurvey() {
  answers = {};
  identificacion = { nombre: "", correo: "" };
  openCategoria = categorias[0];
  encuestaTerminadaPorSalto = false;
  renderIdentificacion();
  els.done.style.display = "none";
  els.endScreen.style.display = "none";
  els.form.style.display = "block";
  renderCategories();
}

els.btnRestart.addEventListener("click", resetSurvey);
els.btnRestart2.addEventListener("click", resetSurvey);

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
  const payload = { ...data };
  if (encuesta.mostrar_identificacion && (identificacion.nombre || identificacion.correo)) {
    payload.__identificacion = { ...identificacion };
  }
  queue.push({
    id: crypto.randomUUID(),
    encuesta_id: ENCUESTA_ID,
    respuestas: payload,
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
