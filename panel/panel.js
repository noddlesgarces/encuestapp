/* ============================================================
   CONFIGURACIÓN — debe ser igual a la de app.js (misma base)
   ============================================================ */

const SUPABASE_URL = "https://htkacsnbxfakfnjjjzqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a2Fjc25ieGZha2ZuampqenFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDkxODAsImV4cCI6MjEwMDMyNTE4MH0.Pr03QHq4raQ06a_qUxrxR7ew2uQFx_vvP8Kr03ALOa0";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: "implicit" },
});

/* ============================================================
   ELEMENTOS
   ============================================================ */

const els = {
  loginView: document.getElementById("loginView"),
  surveysView: document.getElementById("surveysView"),
  questionsView: document.getElementById("questionsView"),
  dashboardView: document.getElementById("dashboardView"),

  emailInput: document.getElementById("emailInput"),
  btnSendLink: document.getElementById("btnSendLink"),
  loginMsg: document.getElementById("loginMsg"),
  btnLogout: document.getElementById("btnLogout"),

  newSurveyTitle: document.getElementById("newSurveyTitle"),
  newSurveySlug: document.getElementById("newSurveySlug"),
  newSurveyLogo: document.getElementById("newSurveyLogo"),
  newSurveyBanner: document.getElementById("newSurveyBanner"),
  newSurveyColor: document.getElementById("newSurveyColor"),
  newSurveyIdent: document.getElementById("newSurveyIdent"),
  btnCreateSurvey: document.getElementById("btnCreateSurvey"),
  createSurveyMsg: document.getElementById("createSurveyMsg"),
  surveysList: document.getElementById("surveysList"),

  questionsSurveyTitle: document.getElementById("questionsSurveyTitle"),
  btnBackToSurveys1: document.getElementById("btnBackToSurveys1"),
  newQCategoria: document.getElementById("newQCategoria"),
  categoriasList: document.getElementById("categoriasList"),
  newQTexto: document.getElementById("newQTexto"),
  newQTipo: document.getElementById("newQTipo"),
  opcionesWrap: document.getElementById("opcionesWrap"),
  newQOptions: document.getElementById("newQOptions"),
  btnAddOption: document.getElementById("btnAddOption"),
  newQOtro: document.getElementById("newQOtro"),
  newQAvanzado: document.getElementById("newQAvanzado"),
  btnAddQuestion: document.getElementById("btnAddQuestion"),
  addQuestionMsg: document.getElementById("addQuestionMsg"),
  questionsList: document.getElementById("questionsList"),

  dashboardSurveyTitle: document.getElementById("dashboardSurveyTitle"),
  btnBackToSurveys2: document.getElementById("btnBackToSurveys2"),
  tabButtons: document.querySelectorAll(".tab-btn"),
  tabTabla: document.getElementById("tabTabla"),
  tabGraficos: document.getElementById("tabGraficos"),
  tableStatus: document.getElementById("tableStatus"),
  table: document.getElementById("responsesTable"),
  btnExport: document.getElementById("btnExport"),
  chartsContainer: document.getElementById("chartsContainer"),
};

let currentEncuestaId = null;
let currentEncuestaTitulo = "";

/* ============================================================
   LOGIN
   ============================================================ */

els.btnSendLink.addEventListener("click", async () => {
  const email = els.emailInput.value.trim();
  if (!email) return;

  els.btnSendLink.disabled = true;
  els.btnSendLink.textContent = "Enviando...";
  setMsg(els.loginMsg, "", "");

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href,
      shouldCreateUser: false,
    },
  });

  els.btnSendLink.disabled = false;
  els.btnSendLink.textContent = "Enviar link de acceso";

  if (error) {
    console.error(error);
    setMsg(els.loginMsg, `Error: ${error.message} (código: ${error.status || error.code || "?"})`, "error");
  } else {
    setMsg(els.loginMsg, "Listo, revisa tu correo y toca el link para entrar.", "success");
  }
});

function setMsg(el, text, kind) {
  el.textContent = text;
  el.className = "hint-text" + (kind ? ` ${kind}` : "");
}

els.btnLogout.addEventListener("click", async () => {
  await client.auth.signOut();
  showLogin();
});

/* ============================================================
   NAVEGACIÓN ENTRE VISTAS
   ============================================================ */

function hideAllViews() {
  els.loginView.style.display = "none";
  els.surveysView.style.display = "none";
  els.questionsView.style.display = "none";
  els.dashboardView.style.display = "none";
}

function showLogin() {
  hideAllViews();
  els.loginView.style.display = "block";
}

function showSurveys() {
  hideAllViews();
  els.surveysView.style.display = "block";
  loadSurveys();
}

function showQuestions(encuestaId, titulo) {
  currentEncuestaId = encuestaId;
  currentEncuestaTitulo = titulo;
  hideAllViews();
  els.questionsView.style.display = "block";
  els.questionsSurveyTitle.textContent = titulo;
  resetOptionInputs();
  els.newQTipo.value = "opcion_unica";
  els.newQOtro.value = "";
  els.newQAvanzado.value = "";
  updateOpcionesVisibility();
  loadQuestions();
}

function showDashboard(encuestaId, titulo) {
  currentEncuestaId = encuestaId;
  currentEncuestaTitulo = titulo;
  hideAllViews();
  els.dashboardView.style.display = "block";
  els.dashboardSurveyTitle.textContent = titulo;
  loadResponses();
}

els.btnBackToSurveys1.addEventListener("click", showSurveys);
els.btnBackToSurveys2.addEventListener("click", showSurveys);

/* ============================================================
   LISTA DE ENCUESTAS
   ============================================================ */

els.btnCreateSurvey.addEventListener("click", async () => {
  const titulo = els.newSurveyTitle.value.trim();
  if (!titulo) return;

  els.btnCreateSurvey.disabled = true;
  const { error } = await client.from("encuestas").insert({
    titulo,
    slug: els.newSurveySlug.value.trim() || null,
    logo_url: els.newSurveyLogo.value.trim() || null,
    banner_url: els.newSurveyBanner.value.trim() || null,
    color_primario: els.newSurveyColor.value.trim() || null,
    mostrar_identificacion: els.newSurveyIdent.checked,
  });
  els.btnCreateSurvey.disabled = false;

  if (error) {
    setMsg(els.createSurveyMsg, "No se pudo crear: " + error.message, "error");
    return;
  }

  els.newSurveyTitle.value = "";
  els.newSurveySlug.value = "";
  els.newSurveyLogo.value = "";
  els.newSurveyBanner.value = "";
  els.newSurveyColor.value = "";
  els.newSurveyIdent.checked = false;
  setMsg(els.createSurveyMsg, "", "");
  loadSurveys();
});

async function loadSurveys() {
  els.surveysList.innerHTML = '<p class="hint-text">Cargando...</p>';

  const { data: encuestas, error } = await client
    .from("encuestas")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    els.surveysList.innerHTML = `<p class="hint-text error">No se pudieron cargar las encuestas: ${error.message}</p>`;
    return;
  }

  if (!encuestas.length) {
    els.surveysList.innerHTML = '<p class="empty-state">Todavía no has creado ninguna encuesta.</p>';
    return;
  }

  // cuenta preguntas y respuestas por encuesta
  const ids = encuestas.map((e) => e.id);
  const [{ data: preguntas }, { data: respuestas }] = await Promise.all([
    client.from("preguntas").select("id, encuesta_id").in("encuesta_id", ids),
    client.from("respuestas").select("id, encuesta_id").in("encuesta_id", ids),
  ]);

  const countBy = (rows) => {
    const map = {};
    (rows || []).forEach((r) => { map[r.encuesta_id] = (map[r.encuesta_id] || 0) + 1; });
    return map;
  };
  const qCounts = countBy(preguntas);
  const rCounts = countBy(respuestas);

  els.surveysList.innerHTML = encuestas.map((e) => `
    <div class="card survey-item">
      <div class="survey-item-info">
        <h3>${escapeHtml(e.titulo)}</h3>
        <p class="hint-text" style="margin-top:4px;">
          ${qCounts[e.id] || 0} pregunta${qCounts[e.id] === 1 ? "" : "s"} ·
          ${rCounts[e.id] || 0} respuesta${rCounts[e.id] === 1 ? "" : "s"}
        </p>
      </div>
      <div class="survey-item-actions">
        <button type="button" class="btn-export" data-action="preguntas" data-id="${e.id}" data-titulo="${escapeAttr(e.titulo)}">Preguntas</button>
        <button type="button" class="btn-export" data-action="resultados" data-id="${e.id}" data-titulo="${escapeAttr(e.titulo)}">Resultados</button>
        <button type="button" class="btn-export" data-action="link" data-id="${e.id}">Copiar link</button>
        <button type="button" class="btn-export btn-danger" data-action="borrar" data-id="${e.id}">Eliminar</button>
      </div>
    </div>
  `).join("");

  els.surveysList.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleSurveyAction(btn));
  });
}

async function handleSurveyAction(btn) {
  const { action, id, titulo } = btn.dataset;

  if (action === "preguntas") return showQuestions(id, titulo);
  if (action === "resultados") return showDashboard(id, titulo);

  if (action === "link") {
    const link = `${window.location.origin}/?e=${id}`;
    try {
      await navigator.clipboard.writeText(link);
      btn.textContent = "¡Copiado!";
      setTimeout(() => { btn.textContent = "Copiar link"; }, 1500);
    } catch {
      prompt("Copia el link:", link);
    }
    return;
  }

  if (action === "borrar") {
    if (!confirm("¿Eliminar esta encuesta? Se borran también sus preguntas y respuestas.")) return;
    const { error } = await client.from("encuestas").delete().eq("id", id);
    if (error) {
      alert("No se pudo eliminar: " + error.message);
      return;
    }
    loadSurveys();
  }
}

/* ============================================================
   EDITOR DE PREGUNTAS
   ============================================================ */

function resetOptionInputs() {
  els.newQOptions.innerHTML = "";
  addOptionInput();
  addOptionInput();
}

const TIPOS_SIN_OPCIONES = ["texto", "texto_largo", "fecha", "escala"];

function updateOpcionesVisibility() {
  els.opcionesWrap.style.display = TIPOS_SIN_OPCIONES.includes(els.newQTipo.value) ? "none" : "block";
}

els.newQTipo.addEventListener("change", updateOpcionesVisibility);

function addOptionInput(value = "") {
  const row = document.createElement("div");
  row.className = "q-option-row";
  row.innerHTML = `
    <input type="text" class="text-input opt-input" placeholder="Texto de la opción" value="${escapeAttr(value)}">
    <button type="button" class="btn-remove-opt" title="Quitar opción">×</button>
  `;
  row.querySelector(".btn-remove-opt").addEventListener("click", () => {
    if (els.newQOptions.children.length > 2) row.remove();
  });
  els.newQOptions.appendChild(row);
}

els.btnAddOption.addEventListener("click", () => addOptionInput());

els.btnAddQuestion.addEventListener("click", async () => {
  const categoria = els.newQCategoria.value.trim() || "General";
  const texto = els.newQTexto.value.trim();
  const tipo = els.newQTipo.value;
  const necesitaOpciones = !TIPOS_SIN_OPCIONES.includes(tipo);
  const opciones = necesitaOpciones
    ? Array.from(els.newQOptions.querySelectorAll(".opt-input")).map((i) => i.value.trim()).filter(Boolean)
    : [];

  if (!texto) {
    setMsg(els.addQuestionMsg, "Escribe el texto de la pregunta.", "error");
    return;
  }
  if (necesitaOpciones && opciones.length < 2) {
    setMsg(els.addQuestionMsg, "Agrega al menos 2 opciones.", "error");
    return;
  }

  let avanzado = {};
  const avanzadoRaw = els.newQAvanzado.value.trim();
  if (avanzadoRaw) {
    try {
      avanzado = JSON.parse(avanzadoRaw);
    } catch {
      setMsg(els.addQuestionMsg, "El JSON de lógica avanzada no es válido.", "error");
      return;
    }
  }

  if (tipo === "matriz" && (!avanzado.matriz_filas || !avanzado.matriz_filas.length)) {
    setMsg(els.addQuestionMsg, 'Para tipo "matriz", incluye "matriz_filas" en la lógica avanzada.', "error");
    return;
  }

  els.btnAddQuestion.disabled = true;

  const { data: existentes } = await client
    .from("preguntas")
    .select("orden")
    .eq("encuesta_id", currentEncuestaId)
    .order("orden", { ascending: false })
    .limit(1);

  const siguienteOrden = existentes && existentes.length ? existentes[0].orden + 1 : 0;

  const { error } = await client.from("preguntas").insert({
    encuesta_id: currentEncuestaId,
    categoria,
    texto,
    tipo,
    opciones,
    orden: siguienteOrden,
    otro_trigger: els.newQOtro.value.trim() || null,
    mostrar_si: avanzado.mostrar_si || null,
    salta_a: avanzado.salta_a || null,
    opciones_por: avanzado.opciones_por || null,
    matriz_filas: avanzado.matriz_filas || null,
    escala_min: avanzado.escala_min ?? null,
    escala_max: avanzado.escala_max ?? null,
    escala_min_label: avanzado.escala_min_label || null,
    escala_max_label: avanzado.escala_max_label || null,
    requerida: avanzado.requerida !== undefined ? avanzado.requerida : true,
  });

  els.btnAddQuestion.disabled = false;

  if (error) {
    setMsg(els.addQuestionMsg, "No se pudo agregar: " + error.message, "error");
    return;
  }

  els.newQTexto.value = "";
  els.newQOtro.value = "";
  els.newQAvanzado.value = "";
  resetOptionInputs();
  setMsg(els.addQuestionMsg, "", "");
  loadQuestions();
});

let cachedQuestions = [];

async function loadQuestions() {
  els.questionsList.innerHTML = '<p class="hint-text">Cargando...</p>';

  const { data, error } = await client
    .from("preguntas")
    .select("*")
    .eq("encuesta_id", currentEncuestaId)
    .order("orden", { ascending: true });

  if (error) {
    els.questionsList.innerHTML = `<p class="hint-text error">No se pudieron cargar las preguntas: ${error.message}</p>`;
    return;
  }

  cachedQuestions = data || [];

  // autocompletar categorías ya usadas
  const categoriasUnicas = [...new Set(cachedQuestions.map((q) => q.categoria))];
  els.categoriasList.innerHTML = categoriasUnicas.map((c) => `<option value="${escapeAttr(c)}">`).join("");

  if (!cachedQuestions.length) {
    els.questionsList.innerHTML = '<p class="empty-state">Todavía no hay preguntas. Agrega la primera arriba.</p>';
    return;
  }

  // agrupar por categoría, en orden de aparición
  const categorias = [];
  cachedQuestions.forEach((q) => { if (!categorias.includes(q.categoria)) categorias.push(q.categoria); });

  els.questionsList.innerHTML = categorias.map((cat) => {
    const qs = cachedQuestions.filter((q) => q.categoria === cat);
    return `
      <div class="q-category-group">
        <h3 class="q-category-title">${escapeHtml(cat)}</h3>
        ${qs.map((q, i) => `
          <div class="card q-admin-item">
            <div class="q-admin-info">
              <p class="q-admin-texto">${escapeHtml(q.texto)}</p>
              <p class="hint-text" style="margin-top:6px;">
                ${escapeHtml(q.tipo || "opcion_unica")}${(q.opciones && q.opciones.length) ? " · " + q.opciones.map(escapeHtml).join(" · ") : ""}
              </p>
              <p class="hint-text" style="margin-top:4px; opacity:0.6; font-size:11px;" title="Usa este id en 'mostrar_si' u 'opciones_por' de otra pregunta">id: ${q.id}</p>
            </div>
            <div class="q-admin-actions">
              <button type="button" class="btn-export" data-move="up" data-id="${q.id}" ${i === 0 ? "disabled" : ""}>↑</button>
              <button type="button" class="btn-export" data-move="down" data-id="${q.id}" ${i === qs.length - 1 ? "disabled" : ""}>↓</button>
              <button type="button" class="btn-export btn-danger" data-delete="${q.id}">Eliminar</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");

  els.questionsList.querySelectorAll("button[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteQuestion(btn.dataset.delete));
  });
  els.questionsList.querySelectorAll("button[data-move]").forEach((btn) => {
    btn.addEventListener("click", () => moveQuestion(btn.dataset.id, btn.dataset.move));
  });
}

async function deleteQuestion(id) {
  if (!confirm("¿Eliminar esta pregunta?")) return;
  const { error } = await client.from("preguntas").delete().eq("id", id);
  if (error) {
    alert("No se pudo eliminar: " + error.message);
    return;
  }
  loadQuestions();
}

async function moveQuestion(id, direction) {
  const index = cachedQuestions.findIndex((q) => q.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= cachedQuestions.length) return;

  const a = cachedQuestions[index];
  const b = cachedQuestions[swapIndex];

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    client.from("preguntas").update({ orden: b.orden }).eq("id", a.id),
    client.from("preguntas").update({ orden: a.orden }).eq("id", b.id),
  ]);
  const error = errorA || errorB;

  if (error) {
    alert("No se pudo reordenar: " + error.message);
    return;
  }
  loadQuestions();
}

/* ============================================================
   DASHBOARD DE RESPUESTAS
   ============================================================ */

els.tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    els.tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    els.tabTabla.style.display = tab === "tabla" ? "block" : "none";
    els.tabGraficos.style.display = tab === "graficos" ? "block" : "none";
  });
});

let cachedRows = [];
let questionLabels = {}; // { pregunta_id: texto }

async function loadResponses() {
  els.tableStatus.textContent = "Cargando...";

  const [{ data: preguntas, error: errP }, { data: rows, error: errR }] = await Promise.all([
    client.from("preguntas").select("id, texto").eq("encuesta_id", currentEncuestaId).order("orden", { ascending: true }),
    client.from("respuestas").select("*").eq("encuesta_id", currentEncuestaId).order("creado_en", { ascending: false }),
  ]);

  if (errP || errR) {
    els.tableStatus.textContent = "No se pudieron cargar los datos: " + (errP || errR).message;
    return;
  }

  questionLabels = {};
  (preguntas || []).forEach((p) => { questionLabels[p.id] = p.texto; });

  cachedRows = rows || [];

  if (cachedRows.length === 0) {
    els.tableStatus.textContent = "Todavía no hay respuestas.";
    els.table.innerHTML = "";
    els.chartsContainer.innerHTML = '<p class="empty-state">Todavía no hay respuestas.</p>';
    return;
  }

  els.tableStatus.textContent = `${cachedRows.length} respuesta${cachedRows.length === 1 ? "" : "s"}`;
  renderTable(cachedRows);
  renderCharts(cachedRows);
}

const OPTION_COLORS_FALLBACK = ["#7DD3C0", "#E8A96B", "#8AA9E8", "#D98AD9", "#E8D06B", "#E88A8A"];

function colorFor(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return OPTION_COLORS_FALLBACK[Math.abs(hash) % OPTION_COLORS_FALLBACK.length];
}

function renderTable(rows) {
  const qIds = Object.keys(questionLabels);

  const thead = `
    <thead>
      <tr>
        <th>Fecha</th>
        ${qIds.map((id, i) => `<th title="${escapeAttr(questionLabels[id])}">P${i + 1}</th>`).join("")}
      </tr>
    </thead>
  `;

  const tbody = `
    <tbody>
      ${rows.map((row) => `
        <tr>
          <td>${formatDate(row.creado_en)}</td>
          ${qIds.map((id) => {
            const val = row.respuestas?.[id];
            if (val === undefined || val === null) return "<td>—</td>";
            const safe = escapeHtml(val);
            return `<td><span class="opt-badge"><span class="opt-dot" style="background:${colorFor(val)}"></span>${safe}</span></td>`;
          }).join("")}
        </tr>
      `).join("")}
    </tbody>
  `;

  els.table.innerHTML = thead + tbody;
}

function renderCharts(rows) {
  els.chartsContainer.innerHTML = "";
  const qIds = Object.keys(questionLabels);

  qIds.forEach((qId) => {
    const counts = {};
    rows.forEach((row) => {
      const val = row.respuestas?.[qId];
      if (val === undefined || val === null) return;
      counts[val] = (counts[val] || 0) + 1;
    });

    const card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<h3>${escapeHtml(questionLabels[qId])}</h3><div class="chart-box"><canvas></canvas></div>`;
    els.chartsContainer.appendChild(card);

    const canvas = card.querySelector("canvas");
    const labels = Object.keys(counts);
    const values = Object.values(counts);

    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: "#7DD3C0",
          borderRadius: 5,
          maxBarThickness: 28,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#9AA1AC", font: { size: 11 } }, grid: { display: false } },
          y: {
            ticks: { color: "#9AA1AC", stepSize: 1, precision: 0, font: { size: 11 } },
            grid: { color: "#2A2F38" },
            beginAtZero: true,
          },
        },
      },
    });
  });
}

/* ============================================================
   EXPORTAR CSV
   ============================================================ */

els.btnExport.addEventListener("click", () => {
  if (cachedRows.length === 0) return;

  const qIds = Object.keys(questionLabels);
  const header = ["Fecha", ...qIds.map((id) => questionLabels[id])];

  const rows = cachedRows.map((row) => {
    const fecha = row.creado_en ? formatDateForCsv(row.creado_en) : "";
    const respuestas = qIds.map((id) => row.respuestas?.[id] ?? "");
    return [fecha, ...respuestas];
  });

  const worksheetData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Ancho de cada columna según su contenido más largo, con un mínimo y un máximo razonable
  ws["!cols"] = header.map((_, colIndex) => {
    const maxLen = worksheetData.reduce((max, r) => {
      const val = r[colIndex] != null ? String(r[colIndex]) : "";
      return Math.max(max, val.length);
    }, 0);
    return { wch: Math.min(Math.max(maxLen + 2, 14), 45) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Respuestas");

  const nombreArchivo = `${currentEncuestaTitulo || "respuestas"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
});

/* ============================================================
   HELPERS
   ============================================================ */

function formatDateForCsv(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

/* ============================================================
   INIT — revisa si ya hay sesión activa (o si venimos de un magic link)
   ============================================================ */

client.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showSurveys();
  } else {
    showLogin();
  }
});

client.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    showSurveys();
  } else {
    showLogin();
  }
});git