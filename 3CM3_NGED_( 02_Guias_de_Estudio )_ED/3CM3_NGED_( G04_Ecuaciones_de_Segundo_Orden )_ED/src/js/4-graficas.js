/* =====================================================================
   4 · GRÁFICAS
   ---------------------------------------------------------------------
   · planoRaices(sol): dibuja m₁ y m₂ en el plano complejo (SVG).
   · Grafica: dibuja y₁, y₂ y y_c = c₁y₁ + c₂y₂ en un <canvas>.
   Los colores se leen de las variables CSS, así respetan el tema.
   ===================================================================== */

/** Paso "bonito" para marcas de ejes: 1, 2, 5, 10, 20, 50… */
function pasoBonito(rango, marcas = 5) {
  const crudo = rango / marcas;
  const pot = 10 ** Math.floor(Math.log10(crudo));
  const r = crudo / pot;
  return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * pot;
}

function formatoEje(v, paso) {
  if (Math.abs(v) < paso / 1e6) return '0';
  const dec = Math.max(0, -Math.floor(Math.log10(paso)));     // 0.5 → 1 decimal, 2 → 0
  return v.toFixed(Math.min(dec, 4)).replace('-', '−');
}

function planoRaices(sol) {
  const pts = sol.caso === 'complejas'
    ? [{ x: sol.alfa.valor(), y: sol.beta.valor(), n: '1' }, { x: sol.alfa.valor(), y: -sol.beta.valor(), n: '2' }]
    : [{ x: sol.m1.valor(), y: 0, n: '1' }, { x: sol.m2.valor(), y: 0, n: '2' }];
  const L = Math.max(1.2, ...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) * 1.5;
  const T = 240, c = T / 2, k = (T / 2 - 14) / L;
  const X = (x) => c + x * k, Y = (y) => c - y * k;
  const paso = pasoBonito(L, 2);
  let g = '';
  for (let v = -Math.floor(L / paso) * paso; v <= L + 1e-9; v += paso) {
    if (Math.abs(v) < 1e-9) continue;
    g += `<line x1="${X(v)}" y1="8" x2="${X(v)}" y2="${T - 8}" class="pr-grid"/>`;
    g += `<line x1="8" y1="${Y(v)}" x2="${T - 8}" y2="${Y(v)}" class="pr-grid"/>`;
  }
  let dots = '';
  const repetida = sol.caso === 'repetida';
  pts.forEach((p, i) => {
    if (repetida && i === 1) return;
    const lado = sol.caso === 'complejas' ? (p.y > 0 ? -14 : 25) : (i === 0 ? 25 : -14);
    const etiqueta = repetida ? 'm₁ = m₂' : `m${p.n === '1' ? '₁' : '₂'}`;
    dots += `<g class="pr-pt" style="--d:${i * 90}ms">
      ${repetida ? `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="11" class="pr-ring"/>` : ''}
      <circle cx="${X(p.x)}" cy="${Y(p.y)}" r="6" class="pr-dot"/>
      <text x="${X(p.x)}" y="${Y(p.y) + lado}" text-anchor="middle" class="pr-lab">${etiqueta}</text>
    </g>`;
  });
  planoRaices.paso = formatoEje(paso, paso);     // se muestra en el pie: "cada cuadro = …"
  return `<svg viewBox="0 0 ${T} ${T}" role="img" aria-label="Raíces en el plano complejo">
    ${g}
    <line x1="6" y1="${c}" x2="${T - 6}" y2="${c}" class="pr-eje"/>
    <line x1="${c}" y1="6" x2="${c}" y2="${T - 6}" class="pr-eje"/>
    <text x="${T - 8}" y="${c + 18}" text-anchor="end" class="pr-axis">Re</text>
    <text x="${c + 8}" y="16" class="pr-axis">Im</text>
    ${dots}
  </svg>`;
}

const Grafica = {
  estado: null,          // { sol, c1, c2, pvi, cursorX }

  colores() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    return { tinta: v('--ink'), tenue: v('--ink-3'), linea: v('--grid'), eje: v('--ink-2'),
             y1: v('--c-y1'), y2: v('--c-y2'), yc: v('--c-yc'), fondo: v('--surface') };
  },

  /** Intervalo en x pensado para que se vea el comportamiento típico de cada caso. */
  ventana(sol) {
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    let W;
    if (sol.caso === 'complejas') {
      const T = (2 * Math.PI) / sol.beta.valor();
      W = clamp(1.25 * T, 2, 12);
      const al = Math.abs(sol.alfa.valor());
      if (al > 0) W = Math.min(W, Math.max(2.5, 3 / al));
    } else {
      const R = Math.max(Math.abs(sol.m1.valor()), Math.abs(sol.m2.valor()), 0.4);
      W = clamp(3 / R, 1.5, 6);
    }
    return [-0.5 * W, 1.5 * W];
  },

  dibujar(canvas) {
    const st = Grafica.estado;
    if (!st) return;
    const { sol, c1, c2 } = st;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const col = Grafica.colores();
    const [F1, F2] = sol.funciones;
    const yc = (x) => c1 * F1.f(x) + c2 * F2.f(x);

    // --- rango en x y muestreo
    const [x0, x1] = Grafica.ventana(sol);
    const N = 480, xs = [];
    for (let i = 0; i <= N; i++) xs.push(x0 + ((x1 - x0) * i) / N);
    const series = [
      { f: F1.f, color: col.y1, ancho: 1.6, guion: [5, 5] },
      { f: F2.f, color: col.y2, ancho: 1.6, guion: [5, 5] },
      { f: yc, color: col.yc, ancho: 2.8, guion: [] },
    ];

    // --- rango en y robusto (cuantiles) para que una exponencial no aplaste todo
    const vals = [];
    series.forEach((s) => xs.forEach((x) => { const v = s.f(x); if (isFinite(v)) vals.push(v); }));
    vals.sort((a, b) => a - b);
    const q = (p) => vals[Math.min(vals.length - 1, Math.max(0, Math.floor(p * (vals.length - 1))))];
    let y0 = Math.min(q(0.04), 0), y1 = Math.max(q(0.96), 0);
    if (st.pvi) { y0 = Math.min(y0, st.pvi.y0); y1 = Math.max(y1, st.pvi.y0); }
    if (y1 - y0 < 1e-6) { y0 -= 1; y1 += 1; }
    const pad = (y1 - y0) * 0.14; y0 -= pad; y1 += pad;

    // --- márgenes y transformaciones
    const m = { l: 44, r: 14, t: 14, b: 28 };
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (w - m.l - m.r);
    const Y = (y) => m.t + ((y1 - y) / (y1 - y0)) * (h - m.t - m.b);
    const invX = (px) => x0 + ((px - m.l) / (w - m.l - m.r)) * (x1 - x0);

    // --- cuadrícula y ejes
    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.lineWidth = 1;
    const px = pasoBonito(x1 - x0, Math.max(3, Math.round(w / 90)));
    const py = pasoBonito(y1 - y0, Math.max(3, Math.round(h / 60)));
    ctx.strokeStyle = col.linea; ctx.fillStyle = col.tenue;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = Math.ceil(x0 / px) * px; v <= x1 + 1e-9; v += px) {
      ctx.beginPath(); ctx.moveTo(X(v), m.t); ctx.lineTo(X(v), h - m.b); ctx.stroke();
      ctx.fillText(formatoEje(v, px), X(v), h - m.b + 7);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = Math.ceil(y0 / py) * py; v <= y1 + 1e-9; v += py) {
      ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(w - m.r, Y(v)); ctx.stroke();
      ctx.fillText(formatoEje(v, py), m.l - 7, Y(v));
    }
    ctx.strokeStyle = col.eje; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(m.l, Y(0)); ctx.lineTo(w - m.r, Y(0)); ctx.stroke();
    if (x0 <= 0 && x1 >= 0) { ctx.beginPath(); ctx.moveTo(X(0), m.t); ctx.lineTo(X(0), h - m.b); ctx.stroke(); }

    // --- curvas (recortadas al área de dibujo)
    ctx.save();
    ctx.beginPath(); ctx.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b); ctx.clip();
    const lim = (y1 - y0) * 20;
    series.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.ancho; ctx.setLineDash(s.guion);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      let dentro = false;
      xs.forEach((x) => {
        let v = s.f(x);
        if (!isFinite(v)) { dentro = false; return; }
        v = Math.max(y0 - lim, Math.min(y1 + lim, v));
        if (!dentro) { ctx.moveTo(X(x), Y(v)); dentro = true; } else ctx.lineTo(X(x), Y(v));
      });
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // --- condición inicial: punto (0, y0) y recta tangente de pendiente y'(0)
    if (st.pvi) {
      const { y0: p0, v0 } = st.pvi, d = (x1 - x0) * 0.09;
      ctx.strokeStyle = col.yc; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(X(-d), Y(p0 - v0 * d)); ctx.lineTo(X(d), Y(p0 + v0 * d)); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col.fondo; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(X(0), Y(p0), 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }

    // --- cursor (lectura de valores)
    if (st.cursorPx != null) {
      const cx = Math.max(m.l, Math.min(w - m.r, st.cursorPx));
      const x = invX(cx), v = yc(x);
      ctx.strokeStyle = col.tenue; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(cx, m.t); ctx.lineTo(cx, h - m.b); ctx.stroke(); ctx.setLineDash([]);
      if (isFinite(v) && v >= y0 && v <= y1) {
        ctx.fillStyle = col.yc;
        ctx.beginPath(); ctx.arc(cx, Y(v), 4.5, 0, 2 * Math.PI); ctx.fill();
      }
      st.lectura = { x, y: v };
    } else st.lectura = null;
    ctx.restore();
  },
};
