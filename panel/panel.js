/* ============================================================
   CONFIGURACIÓN — debe ser igual a la de app.js (misma base)
   ============================================================ */

const SUPABASE_URL = "https://htkacsnbxfakfnjjjzqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a2Fjc25ieGZha2ZuampqenFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDkxODAsImV4cCI6MjEwMDMyNTE4MH0.Pr03QHq4raQ06a_qUxrxR7ew2uQFx_vvP8Kr03ALOa0";

// Nombres bonitos para cada pregunta en la tabla/gráficos del panel.
// IMPORTANTE: cuando cambies las preguntas reales en app.js, actualiza
// esto también para que el panel muestre el mismo texto.
const QUESTION_LABELS = {
  q1: "Pregunta 1",
  q2: "Pregunta 2",
  q3: "Pregunta 3",
  q4: "Pregunta 4",
  q5: "Pregunta 5",
  q6: "Pregunta 6",
};

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   ELEMENTOS
   ============================================================ */

const els = {
  loginView: document.getElementById("loginView"),
  dashboardView: document.getElementById("dashboardView"),
  emailInput: document.getElementById("emailInput"),
  btnSendLink: document.getElementById("btnSendLink"),
  loginMsg: document.getElementById("loginMsg"),
  btnLogout: document.getElementById("btnLogout"),
  tabButtons: document.querySelectorAll(".tab-btn"),
  tabTabla: document.getElementById("tabTabla"),
  tabGraficos: document.getElementById("tabGraficos"),
  tableStatus: document.getElementById("tableStatus"),
  table: document.getElementById("responsesTable"),
  btnExport: document.getElementById("btnExport"),
  chartsContainer: document.getElementById("chartsContainer"),
};

/* ============================================================
   LOGIN
   ============================================================ */

els.btnSendLink.addEventListener("click", async () => {
  const email = els.emailInput.value.trim();
  if (!email) return;

  els.btnSendLink.disabled = true;
  els.btnSendLink.textContent = "Enviando...";
  setMsg("", "");

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.href,
      shouldCreateUser: false, // nunca crea cuentas nuevas — solo entra gente ya invitada
    },
  });

  els.btnSendLink.disabled = false;
  els.btnSendLink.textContent = "Enviar link de acceso";

  if (error) {
    setMsg("No se pudo enviar el link. Si tu correo no está autorizado, pide acceso.", "error");
  } else {
    setMsg("Listo, revisa tu correo y toca el link para entrar.", "success");
  }
});

function setMsg(text, kind) {
  els.loginMsg.textContent = text;
  els.loginMsg.className = "hint-text" + (kind ? ` ${kind}` : "");
}

els.btnLogout.addEventListener("click", async () => {
  await client.auth.signOut();
  showLogin();
});

/* ============================================================
   VISTAS
   ============================================================ */

function showLogin() {
  els.loginView.style.display = "block";
  els.dashboardView.style.display = "none";
}

function showDashboard() {
  els.loginView.style.display = "none";
  els.dashboardView.style.display = "block";
  loadData();
}

/* ============================================================
   TABS
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

/* ============================================================
   DATOS
   ============================================================ */

let cachedRows = [];

async function loadData() {
  els.tableStatus.textContent = "Cargando...";
  const { data, error } = await client
    .from("respuestas")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    els.tableStatus.textContent = "No se pudieron cargar los datos: " + error.message;
    return;
  }

  cachedRows = data || [];

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

const OPTION_COLORS = {
  "Opción 1": "#7DD3C0",
  "Opción 2": "#E8A96B",
  "Opción 3": "#8AA9E8",
  "Opción 4": "#D98AD9",
};
const FALLBACK_COLORS = ["#7DD3C0", "#E8A96B", "#8AA9E8", "#D98AD9", "#E8D06B", "#E88A8A"];

function colorFor(value) {
  if (OPTION_COLORS[value]) return OPTION_COLORS[value];
  // color estable para cualquier otro texto, según su contenido
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function renderTable(rows) {
  const qKeys = Object.keys(QUESTION_LABELS);

  const thead = `
    <thead>
      <tr>
        <th>Fecha</th>
        ${qKeys.map((k, i) => `<th title="${QUESTION_LABELS[k]}">P${i + 1}</th>`).join("")}
      </tr>
    </thead>
  `;

  const tbody = `
    <tbody>
      ${rows.map((row) => `
        <tr>
          <td>${formatDate(row.creado_en)}</td>
          ${qKeys.map((k) => {
            const val = row.respuestas?.[k];
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
  const qKeys = Object.keys(QUESTION_LABELS);

  qKeys.forEach((qKey) => {
    const counts = {};
    rows.forEach((row) => {
      const val = row.respuestas?.[qKey];
      if (val === undefined || val === null) return;
      counts[val] = (counts[val] || 0) + 1;
    });

    const card = document.createElement("div");
    card.className = "chart-card";
    card.innerHTML = `<h3>${QUESTION_LABELS[qKey]}</h3><div class="chart-box"><canvas></canvas></div>`;
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

  const qKeys = Object.keys(QUESTION_LABELS);
  const header = ["Fecha", ...qKeys.map((k) => QUESTION_LABELS[k])];

  const csvRows = cachedRows.map((row) => {
    const fecha = row.creado_en ? new Date(row.creado_en).toISOString() : "";
    const respuestas = qKeys.map((k) => csvEscape(row.respuestas?.[k] ?? ""));
    return [csvEscape(fecha), ...respuestas].join(",");
  });

  const csv = [header.map(csvEscape).join(","), ...csvRows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `respuestas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

function csvEscape(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/* ============================================================
   HELPERS
   ============================================================ */

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
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   INIT — revisa si ya hay sesión activa (o si venimos de un magic link)
   ============================================================ */

client.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
});

client.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
});