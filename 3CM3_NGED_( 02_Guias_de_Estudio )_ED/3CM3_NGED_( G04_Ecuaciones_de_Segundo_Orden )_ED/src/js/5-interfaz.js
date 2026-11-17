/* =====================================================================
   5 · INTERFAZ
   ---------------------------------------------------------------------
   Flujo:  leer a, b, c  →  Motor.resolver  →  armar los pasos en LaTeX
           →  dibujar (KaTeX + gráfica)  →  guardar en la URL (#a=1&b=-3…)
   Cada vez que el usuario escribe, todo se recalcula al instante.
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const OPCIONES_KATEX = {
  throwOnError: false,
  strict: false,
  trust: (ctx) => ctx.command === '\\htmlClass',
};

/* ---------- utilidades de LaTeX en el DOM ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Bloque matemático (display). `alt` = versión en varias líneas para pantallas angostas. */
function M(tex, alt = '', clase = '') {
  return `<div class="mat ${clase}" data-tex="${esc(tex)}"${alt ? ` data-alt="${esc(alt)}"` : ''}></div>`;
}
/** Matemática en línea, dentro de un texto. */
function m(tex) { return `<span class="mi" data-tex="${esc(tex)}"></span>`; }
/** Resaltado (color de plumón) */
const hl = (t) => `\\htmlClass{hl}{${t}}`;

/**
 * Cadena de igualdades  lhs = r₁ = r₂ = …
 * Devuelve la versión en una línea y la versión "aligned" (una igualdad por renglón).
 */
function cadena(lhs, rs) {
  const r = rs.filter((x, i) => x && rs.indexOf(x) === i);
  const linea = `${lhs} = ${r.join(' = ')}`;
  const alt = r.length > 1 ? `\\begin{aligned} ${lhs} &= ${r.join(' \\\\ &= ')} \\end{aligned}` : '';
  return [linea, alt];
}

function desborda(el) { return el.scrollWidth > el.clientWidth + 1; }

/** Dibuja un bloque y, si no cabe, prueba la versión multilínea y luego reduce un poco la letra. */
function ajustar(el) {
  el.style.fontSize = '';
  katex.render(el.dataset.tex, el, { ...OPCIONES_KATEX, displayMode: true });
  if (!el.clientWidth) return;                         // oculto (p. ej. dentro de <details> cerrado)
  if (el.dataset.alt && desborda(el)) katex.render(el.dataset.alt, el, { ...OPCIONES_KATEX, displayMode: true });
  let f = 1;
  while (desborda(el) && f > 0.74) { f -= 0.06; el.style.fontSize = `${f.toFixed(2)}em`; }
  el.classList.toggle('desliza', desborda(el));       // último recurso: deslizar dentro del bloque
}

function renderizar(raiz) {
  $$('.mi', raiz).forEach((el) => katex.render(el.dataset.tex, el, { ...OPCIONES_KATEX, displayMode: false }));
  $$('.mat', raiz).forEach(ajustar);
}

/* ---------- círculo "a plumón" para los números de paso ---------- */
const CIRCULO = `<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M30 5.5C43 6 51.5 15.5 50.5 29 49.5 42 39.5 51 26.5 50.5 13.5 50 4.8 40.5 5.5 27.5 6.2 15 15.8 5.8 29.5 7.2"/></svg>`;

function paso(n, titulo, sub, cuerpo, extraClase = '') {
  return `<section class="paso ${extraClase}" style="--i:${n}">
    <div class="paso-num">${CIRCULO}<span>${n}</span></div>
    <div class="paso-cuerpo">
      <header><h3>${titulo}</h3>${sub ? `<p class="paso-sub">${sub}</p>` : ''}</header>
      ${cuerpo}
    </div>
  </section>`;
}

const NOMBRE_CASO = {
  reales: 'Raíces reales distintas',
  repetida: 'Raíz real repetida',
  complejas: 'Raíces complejas conjugadas',
};

function chipsCaso(caso) {
  const c = [
    ['reales', '\\Delta > 0', 'reales distintas'],
    ['repetida', '\\Delta = 0', 'repetida'],
    ['complejas', '\\Delta < 0', 'complejas'],
  ];
  return `<div class="casos" role="list">${c.map(([k, t, d]) =>
    `<span role="listitem" class="caso ${k === caso ? 'activo' : ''}">${m(t)}<small>${d}</small></span>`).join('')}</div>`;
}

/* =====================================================================
   Construcción de los pasos (lo que el maestro escribe en el pizarrón)
   ===================================================================== */
function construirPasos(sol, pvi) {
  const { a, b, c, delta } = sol;
  const so = TeX.soluciones(sol);
  let html = '';

  /* ① ECUACIÓN CARACTERÍSTICA -------------------------------------- */
  const car = TeX.caracteristica(sol);
  const [d1, d1alt] = cadena('y', ['e^{mx}']);
  html += paso(1, 'Ecuación característica',
    `Proponemos ${m('y = e^{mx}')} y sustituimos en ${m(TeX.ecuacion(sol))}.`,
    `<details class="porque">
       <summary>¿De dónde sale?</summary>
       <div class="porque-cuerpo">
         ${M(`${d1},\\quad y' = me^{mx},\\quad y'' = m^2e^{mx}`,
             `\\begin{aligned} ${d1alt || d1} \\\\ y' &= me^{mx} \\\\ y'' &= m^2e^{mx} \\end{aligned}`)}
         ${M(`${TeX.polinomio([a, b, c], ['m^2e^{mx}', 'me^{mx}', 'e^{mx}'])} = 0`,
             `\\begin{aligned} &${TeX.polinomio([a, b, c], ['m^2e^{mx}', 'me^{mx}', 'e^{mx}'])} \\\\ &\\quad = 0 \\end{aligned}`)}
         ${M(`e^{mx}\\left(${TeX.polinomio([a, b, c], ['m^2', 'm', ''])}\\right) = 0`)}
         <p class="nota">como ${m('e^{mx} \\neq 0')} nunca, lo que debe valer cero es el paréntesis</p>
       </div>
     </details>
     <div class="resultado">${M(hl(car))}</div>`);

  /* ② RAÍCES -------------------------------------------------------- */
  const menosB = TeX.frac(b.neg()), dosA = TeX.frac(sol.dosA);
  const radAbs = TeX.radical(sol.raizDelta.coef, sol.s);          // √|Δ| simplificada
  const [lD, lDalt] = cadena('\\Delta', [
    'b^2 - 4ac',
    `${TeX.par(b)}^2 - 4(${TeX.frac(a)})(${TeX.frac(c)})`,
    hl(TeX.frac(delta)),
  ]);

  let raizTxt;                                // lo que va después de ±
  if (delta.signo() > 0) raizTxt = radAbs;
  else if (delta.signo() < 0) raizTxt = `${radAbs === '1' ? '' : radAbs}\\,i`;
  const numerador = (centro, r) => {
    if (!r) return centro;
    return centro === '0' ? `\\pm ${r}` : `${centro} \\pm ${r}`;
  };
  const sustituida = `\\frac{-${TeX.par(b)} \\pm \\sqrt{${TeX.frac(delta)}}}{2(${TeX.frac(a)})}`;
  const simplificada = `\\frac{${numerador(menosB, raizTxt)}}{${dosA}}`;
  let final;
  const Btex = TeX.radical(sol.B, sol.s);
  if (sol.caso === 'repetida') final = TeX.frac(sol.h);
  else {
    const r = sol.caso === 'complejas' ? `${Btex === '1' ? '' : Btex}\\,i` : Btex;
    final = numerador(TeX.frac(sol.h), r);
  }
  const [lF, lFalt] = cadena('m_{1,2}', ['\\frac{-b \\pm \\sqrt{\\Delta}}{2a}', sustituida, simplificada, final]);

  let resultadoRaices;
  if (sol.caso === 'reales') {
    resultadoRaices = M(`${hl(`m_1 = ${TeX.cuad(sol.m1)}`)}, \\qquad ${hl(`m_2 = ${TeX.cuad(sol.m2)}`)}`,
      `\\begin{gathered} ${hl(`m_1 = ${TeX.cuad(sol.m1)}`)} \\\\ ${hl(`m_2 = ${TeX.cuad(sol.m2)}`)} \\end{gathered}`);
  } else if (sol.caso === 'repetida') {
    resultadoRaices = M(hl(`m_1 = m_2 = ${TeX.cuad(sol.m1)}`));
  } else {
    resultadoRaices = M(`m = \\alpha \\pm \\beta i \\;\\Rightarrow\\; ${hl(`\\alpha = ${TeX.cuad(sol.alfa)}`)}, \\quad ${hl(`\\beta = ${TeX.cuad(sol.beta)}`)}`,
      `\\begin{gathered} m = \\alpha \\pm \\beta i \\\\ ${hl(`\\alpha = ${TeX.cuad(sol.alfa)}`)}, \\quad ${hl(`\\beta = ${TeX.cuad(sol.beta)}`)} \\end{gathered}`);
  }

  const factor = TeX.factorizacion(Motor.factorizar(sol));
  const notaImag = sol.caso === 'complejas'
    ? `<p class="nota">${m(`\\sqrt{${TeX.frac(delta)}} = \\sqrt{(-1)(${TeX.frac(delta.neg())})} = ${radAbs === '1' ? '' : radAbs}\\,i`)}</p>` : '';

  html += paso(2, 'Raíces <span class="m-sym">m₁, m₂</span>',
    `El discriminante decide el tipo de raíces: <strong>${NOMBRE_CASO[sol.caso].toLowerCase()}</strong>.`,
    `<div class="split">
       <div class="split-mat">
         <p class="etq">Discriminante</p>
         ${M(lD, lDalt)}
         ${chipsCaso(sol.caso)}
         <p class="etq">Fórmula general</p>
         ${M(lF, lFalt)}
         ${notaImag}
         ${factor ? `<p class="etq">O factorizando</p>${M(factor)}` : ''}
         <div class="resultado">${resultadoRaices}</div>
       </div>
       <figure class="plano">
         ${planoRaices(sol)}
         <figcaption>Raíces en el plano complejo · cada cuadro = ${planoRaices.paso.replace('−', '-')}</figcaption>
       </figure>
     </div>`);

  /* ③ SOLUCIONES LINEALMENTE INDEPENDIENTES ------------------------- */
  const filas = [0, 1].map((i) => {
    const pasos = [so.plantilla[i]];
    if (so.intermedio) pasos.push(so.intermedio[i]);
    pasos.push(hl(so.y[i]));
    return cadena(`y_${i + 1}`, pasos);
  });
  const W = TeX.wronskiano(sol);
  const [lW, lWalt] = cadena('W(y_1, y_2)', [
    '\\begin{vmatrix} y_1 & y_2 \\\\ y_1\' & y_2\' \\end{vmatrix}',
    W.formula,
    `${W.valor} \\neq 0`,
  ]);
  const regla = {
    reales: `Con ${m('m_1 \\neq m_2')} cada raíz da su propia exponencial ${m('e^{m_ix}')}.`,
    repetida: `Con una sola raíz, la segunda solución se obtiene multiplicando por ${m('x')}.`,
    complejas: `Con ${m('m = \\alpha \\pm \\beta i')} usamos Euler: ${m('e^{\\alpha x}\\cos\\beta x')} y ${m('e^{\\alpha x}\\operatorname{sen}\\beta x')}.`,
  }[sol.caso];
  html += paso(3, 'Soluciones <span class="m-sym">y₁, y₂</span>', regla,
    `<div class="resultado">${M(filas[0][0], filas[0][1])}${M(filas[1][0], filas[1][1])}</div>
     <p class="etq">¿Son linealmente independientes? Wronskiano</p>
     ${M(lW, lWalt)}
     <p class="nota ok">${m('W \\neq 0')} ⇒ ${m('y_1')} y ${m('y_2')} son l.i. — forman un conjunto fundamental</p>`);

  /* ④ SOLUCIÓN GENERAL ---------------------------------------------- */
  const gen = TeX.general(sol);
  const fact = TeX.generalFactorizada(sol);
  const genAlt = `\\begin{aligned} y_c &= ${gen.replace(' + ', ' \\\\ &\\quad + ')} \\end{aligned}`;
  const verif = sol.residuo < 1e-9;
  html += paso(4, 'Solución general <span class="m-sym">y<sub>c</sub></span>',
    `Combinación lineal de las soluciones: ${m('y_c = c_1y_1 + c_2y_2')}.`,
    `<div class="resultado final">
       ${M(`y_c = ${gen}`, genAlt)}
     </div>
     ${fact ? `<p class="etq">Forma equivalente</p>${M(`y_c = ${fact}`, `\\begin{aligned} y_c &= ${fact} \\end{aligned}`)}` : ''}
     <p class="verificado ${verif ? '' : 'mal'}">
       <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>
       <span>${verif
         ? `Comprobado: al sustituir ${m('y_1')} y ${m('y_2')} en la ecuación, el residuo relativo es ${m(formatoCientifico(sol.residuo))}.`
         : 'La comprobación numérica no salió exacta; revisa los coeficientes.'}</span>
     </p>`, 'paso-final');

  /* ⑤ PROBLEMA DE VALOR INICIAL (opcional) -------------------------- */
  if (pvi) {
    const { c1, c2 } = Motor.resolverPVI(sol, pvi.y0, pvi.v0);
    const C = (k) => new Cuad(k);
    let fila1, fila2;
    if (sol.caso === 'reales') {
      fila1 = TeX.unir([TeX.termino(C(1), 'c_1'), TeX.termino(C(1), 'c_2')]);
      fila2 = TeX.unir([TeX.termino(sol.m1, 'c_1'), TeX.termino(sol.m2, 'c_2')]);
    } else if (sol.caso === 'repetida') {
      fila1 = 'c_1';
      fila2 = TeX.unir([TeX.termino(sol.m1, 'c_1'), TeX.termino(C(1), 'c_2')]);
    } else {
      fila1 = 'c_1';
      fila2 = TeX.unir([TeX.termino(sol.alfa, 'c_1'), TeX.termino(sol.beta, 'c_2')]);
    }
    const sistema = `\\begin{cases} y(0) = ${fila1} = ${TeX.frac(pvi.y0)} \\\\ y'(0) = ${fila2} = ${TeX.frac(pvi.v0)} \\end{cases}`;
    const sistemaAlt = `\\begin{cases} ${fila1} = ${TeX.frac(pvi.y0)} \\\\ ${fila2} = ${TeX.frac(pvi.v0)} \\end{cases}`;
    const part = TeX.unir([TeX.termino(c1, so.y[0]), TeX.termino(c2, so.y[1])]);
    const t1 = TeX.termino(c1, so.y[0]), t2 = TeX.termino(c2, so.y[1]);
    const partAlt = (t1 && t2)
      ? `\\begin{aligned} y &= ${TeX.unir([t1])} \\\\ &\\quad ${t2.signo} ${t2.cuerpo} \\end{aligned}` : '';
    html += paso(5, 'Condiciones iniciales',
      `Con ${m(`y(0) = ${TeX.frac(pvi.y0)}`)} y ${m(`y'(0) = ${TeX.frac(pvi.v0)}`)}: evaluamos en ${m('x = 0')} (${m('e^0 = 1')}, ${m('\\cos 0 = 1')}, ${m('\\operatorname{sen} 0 = 0')}).`,
      `${M(sistema, sistemaAlt)}
       ${M(`${hl(`c_1 = ${TeX.cuad(c1)}`)}, \\qquad ${hl(`c_2 = ${TeX.cuad(c2)}`)}`,
           `\\begin{gathered} ${hl(`c_1 = ${TeX.cuad(c1)}`)} \\\\ ${hl(`c_2 = ${TeX.cuad(c2)}`)} \\end{gathered}`)}
       <div class="resultado final">${M(`y = ${part}`, partAlt)}</div>
       ${part === '0' ? '<p class="nota">con estas condiciones sólo queda la solución trivial</p>' : ''}`,
      'paso-final');
    return { html, c: [c1.valor(), c2.valor()] };
  }
  return { html, c: null };
}

function formatoCientifico(v) {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(v));
  const mant = (v / 10 ** e).toFixed(1);
  return `${mant} \\times 10^{${e}}`;
}

/* =====================================================================
   Estado, lectura de campos y ciclo principal
   ===================================================================== */
const App = {
  sol: null,
  pviC: null,

  leerCampos() {
    const campos = { a: $('#in-a'), b: $('#in-b'), c: $('#in-c') };
    if ($('#pvi-on').checked) Object.assign(campos, { y0: $('#in-y0'), v0: $('#in-v0') });
    const valores = {}, errores = [];
    for (const [k, el] of Object.entries(campos)) {
      const txt = el.value.trim();
      const v = txt === '' ? new Fraccion(0) : leerNumero(txt);
      el.closest('.campo').classList.toggle('error', !v);
      if (!v) errores.push(k);
      valores[k] = v;
    }
    return { valores, errores };
  },

  actualizar() {
    const { valores, errores } = App.leerCampos();
    const aviso = $('#aviso');
    const nombres = { a: 'a', b: 'b', c: 'c', y0: "y(0)", v0: "y'(0)" };
    if (errores.length) {
      aviso.innerHTML = `Revisa ${errores.map((e) => `<b>${nombres[e]}</b>`).join(', ')}: escribe un número como <code>-3</code>, <code>1/2</code> o <code>0.25</code>.`;
      aviso.hidden = false;
      return;
    }
    if (valores.a.esCero()) {
      $('#in-a').closest('.campo').classList.add('error');
      aviso.innerHTML = `Si ${m('a = 0')} desaparece ${m("y''")} y la ecuación deja de ser de orden 2.`;
      renderizar(aviso);
      aviso.hidden = false;
      return;
    }
    aviso.hidden = true;

    const sol = Motor.resolver(valores.a, valores.b, valores.c);
    App.sol = sol;
    const pvi = $('#pvi-on').checked ? { y0: valores.y0, v0: valores.v0 } : null;
    const { html, c } = construirPasos(sol, pvi);

    const contenedor = $('#pasos');
    const firma = `${TeX.ecuacion(sol)}|${pvi ? TeX.frac(pvi.y0) + ',' + TeX.frac(pvi.v0) : ''}`;
    const cambio = contenedor.dataset.firma !== firma;
    contenedor.dataset.firma = firma;
    contenedor.innerHTML = html;
    renderizar(contenedor);
    if (cambio) {
      contenedor.classList.remove('entrando'); void contenedor.offsetWidth; contenedor.classList.add('entrando');
    }

    // Resumen del panel lateral
    $('#ecu-limpia').dataset.tex = TeX.ecuacion(sol);
    $('#res-caso').textContent = NOMBRE_CASO[sol.caso];
    $('#res-caso').dataset.caso = sol.caso;
    $('#res-yc').dataset.tex = `y_c = ${TeX.general(sol)}`;
    $('#res-yc').dataset.alt = `\\begin{aligned} y_c &= ${TeX.general(sol).replace(' + ', ' \\\\ &\\quad + ')} \\end{aligned}`;
    renderizar($('#panel'));

    // Gráfica
    const veniaDePVI = App.pviC !== null;
    App.pviC = c;
    if (c) App.ponerConstantes(c[0], c[1], { y0: pvi.y0.valor(), v0: pvi.v0.valor() });
    else if (veniaDePVI) App.ponerConstantes(1, 1, null);              // vuelve a c₁ = c₂ = 1
    else App.ponerConstantes(+$('#sl-c1').value, +$('#sl-c2').value, null);
    $('#leyenda-yc').dataset.tex = c ? 'y' : 'y_c';
    renderizar($('#leyenda'));

    App.guardarURL(valores);
  },

  ponerConstantes(c1, c2, pvi) {
    [['#sl-c1', c1], ['#sl-c2', c2]].forEach(([s, v]) => {
      const el = $(s);
      const lim = Math.max(5, Math.ceil(Math.abs(v) + 1));
      el.min = -lim; el.max = lim; el.value = v;
      $(`${s}-out`).textContent = Number(v.toFixed(3)).toString().replace('-', '−');
    });
    Grafica.estado = { ...(Grafica.estado || {}), sol: App.sol, c1, c2, pvi };
    $('#btn-volver-pvi').hidden = !(App.pviC && !pvi);
    $('#graf-titulo').textContent = pvi ? 'Solución particular del PVI' : 'Familia de soluciones';
    App.dibujar();
  },

  dibujar() {
    Grafica.dibujar($('#lienzo'));
    const l = Grafica.estado && Grafica.estado.lectura;
    $('#lectura').innerHTML = l
      ? `<span>x = ${l.x.toFixed(3).replace('-', '−')}</span><span>${Grafica.estado.pvi ? 'y' : 'y<sub>c</sub>'} = ${isFinite(l.y) ? l.y.toPrecision(5).replace('-', '−') : '—'}</span>`
      : '<span class="tenue">Pasa el cursor o el dedo sobre la gráfica</span>';
  },

  guardarURL(v) {
    const p = new URLSearchParams({ a: $('#in-a').value, b: $('#in-b').value, c: $('#in-c').value });
    if ($('#pvi-on').checked) { p.set('y0', $('#in-y0').value); p.set('v0', $('#in-v0').value); }
    // Sólo cuando la página se abre directamente (archivo o sitio propio), no dentro de un marco
    if (window.top !== window.self) return;
    try { history.replaceState(null, '', `#${p.toString()}`); } catch (e) { /* sin historial */ }
  },

  leerURL() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (!p.has('a')) return;
    ['a', 'b', 'c'].forEach((k) => { if (p.has(k)) $(`#in-${k}`).value = p.get(k); });
    if (p.has('y0') || p.has('v0')) {
      $('#pvi-on').checked = true;
      $('#in-y0').value = p.get('y0') || '0';
      $('#in-v0').value = p.get('v0') || '0';
    }
  },

  sincronizarPVI() {
    const on = $('#pvi-on').checked;
    $('#pvi-campos').hidden = !on;
    $('#pvi-on').setAttribute('aria-expanded', String(on));
  },

  /** El cuadrito crece con el número, como cuando escribes más grande en el pizarrón. */
  anchoCampo(el) {
    const n = Math.max(1, el.value.length);
    el.style.width = `${Math.min(7, Math.max(1.9, n * 0.62 + 1.1))}em`;
  },

  tema(nuevo) {
    const raiz = document.documentElement;
    if (nuevo) { raiz.dataset.theme = nuevo; try { localStorage.setItem('edo-tema', nuevo); } catch (e) {} }
    const oscuro = raiz.dataset.theme
      ? raiz.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    $('#tema-txt').textContent = oscuro ? 'Pizarrón' : 'Pintarrón';
    $('#btn-tema').setAttribute('aria-pressed', String(oscuro));
    requestAnimationFrame(App.dibujar);
  },

  iniciar() {
    try { const t = localStorage.getItem('edo-tema'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
    App.leerURL();
    App.sincronizarPVI();

    // Términos fijos de la ecuación (y'', y', y) y textos estáticos
    renderizar(document.body);

    // Campos: recalcular al escribir, flechas ↑↓ suman/restan 1
    let espera;
    $$('.campo input').forEach((el) => {
      App.anchoCampo(el);
      el.addEventListener('input', () => {
        App.anchoCampo(el);
        clearTimeout(espera); espera = setTimeout(App.actualizar, 140);
      });
      el.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
        const v = leerNumero(el.value || '0');
        if (!v) return;
        ev.preventDefault();
        const nv = v.sumar(new Fraccion(ev.key === 'ArrowUp' ? 1 : -1));
        el.value = nv.esEntero() ? `${nv.n}` : `${nv.n}/${nv.d}`;
        App.anchoCampo(el); App.actualizar();
      });
      el.addEventListener('focus', () => el.select());
    });

    // Al abrir "¿De dónde sale?" se ajustan las fórmulas que estaban ocultas
    document.addEventListener('toggle', (ev) => {
      if (ev.target.matches && ev.target.matches('details')) $$('.mat', ev.target).forEach(ajustar);
    }, true);

    $('#pvi-on').addEventListener('change', () => { App.sincronizarPVI(); App.actualizar(); });
    $('#btn-tema').addEventListener('click', () => {
      const oscuro = $('#btn-tema').getAttribute('aria-pressed') === 'true';
      App.tema(oscuro ? 'light' : 'dark');
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => App.tema());

    // Deslizadores c₁, c₂
    ['#sl-c1', '#sl-c2'].forEach((s) => $(s).addEventListener('input', () =>
      App.ponerConstantes(+$('#sl-c1').value, +$('#sl-c2').value, null)));
    $('#btn-volver-pvi').addEventListener('click', App.actualizar);

    // Lectura con cursor / dedo
    const lienzo = $('#lienzo');
    const mover = (ev) => {
      const r = lienzo.getBoundingClientRect();
      if (Grafica.estado) Grafica.estado.cursorPx = ev.clientX - r.left;
      App.dibujar();
    };
    lienzo.addEventListener('pointermove', mover);
    lienzo.addEventListener('pointerdown', mover);
    lienzo.addEventListener('pointerleave', () => { if (Grafica.estado) Grafica.estado.cursorPx = null; App.dibujar(); });

    // Reajustar fórmulas y gráfica cuando cambia el ancho
    let anchoPrevio = 0, rAF;
    new ResizeObserver(() => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const w = document.documentElement.clientWidth;
        if (w !== anchoPrevio) { anchoPrevio = w; $$('.mat').forEach(ajustar); }
        App.dibujar();
      });
    }).observe(document.body);

    App.tema();
    App.actualizar();
  },
};

document.addEventListener('DOMContentLoaded', App.iniciar);
