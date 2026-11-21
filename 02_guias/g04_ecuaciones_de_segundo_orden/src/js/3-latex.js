/* =====================================================================
   3 · TRADUCTOR A LaTeX
   ---------------------------------------------------------------------
   Convierte los números exactos del motor en texto LaTeX que KaTeX
   dibuja como en un libro:  "\frac{\sqrt{3}}{2}"  →  √3⁄2
   Cuida los detalles de escritura a mano:  no escribir "1y''",
   no escribir "+ -3",  escribir  e^{-x}  en lugar de  e^{-1x}, etc.
   ===================================================================== */

const TeX = {

  /** Fracción → LaTeX.   3 → "3",  -1/2 → "-\frac{1}{2}" */
  frac(f) {
    const neg = f.signo() < 0, a = f.abs();
    const cuerpo = a.esEntero() ? `${a.n}` : `\\frac{${a.n}}{${a.d}}`;
    return (neg ? '-' : '') + cuerpo;
  },

  /** Igual que frac pero entre paréntesis si es negativa o fracción: para sustituir en fórmulas. */
  par(f) {
    return (f.signo() < 0 || !f.esEntero()) ? `\\left(${TeX.frac(f)}\\right)` : TeX.frac(f);
  },

  /** q·√s  (q fracción, s entero) →  "\frac{\sqrt{3}}{2}",  "2\sqrt{5}",  "-\sqrt{2}" */
  radical(q, s) {
    if (s === 1n) return TeX.frac(q);
    const neg = q.signo() < 0, a = q.abs();
    const k = a.n === 1n ? '' : `${a.n}`;
    const num = `${k}\\sqrt{${s}}`;
    return (neg ? '-' : '') + (a.d === 1n ? num : `\\frac{${num}}{${a.d}}`);
  },

  /**
   * Número p + q√s.
   * modo 'junto':    \frac{3+\sqrt{5}}{2}      (una sola fracción, como en el pizarrón)
   * modo 'separado': \frac{3}{2}+\frac{\sqrt{5}}{2}
   */
  cuad(c, modo = 'junto') {
    if (c.esRacional()) return TeX.frac(c.p);
    if (c.p.esCero()) return TeX.radical(c.q, c.s);
    if (modo === 'separado' || (c.p.esEntero() && c.q.esEntero())) {
      const r = TeX.radical(c.q.abs(), c.s);
      return `${TeX.frac(c.p)} ${c.q.signo() < 0 ? '-' : '+'} ${r}`;
    }
    // común denominador
    const D = c.p.d * c.q.d / mcd(c.p.d, c.q.d);
    const P = c.p.n * (D / c.p.d), Q = c.q.n * (D / c.q.d);
    const absQ = Q < 0n ? -Q : Q;
    const r = `${absQ === 1n ? '' : absQ}\\sqrt{${c.s}}`;
    return `\\frac{${P} ${Q < 0n ? '-' : '+'} ${r}}{${D}}`;
  },

  /** ¿El número ocupa más de un término? (entonces lleva paréntesis al multiplicar) */
  esCompuesto(c) { return !c.esRacional() && !c.p.esCero(); },

  /**
   * Coeficiente k pegado a una variable:  k·x
   *  1 → "x",  -1 → "-x",  2 → "2x",  1/2 → "\frac{1}{2}x",  √2 → "\sqrt{2}\,x"
   */
  porVariable(c, v = 'x') {
    if (c.esCero()) return '0';
    if (c.esRacional()) {
      if (c.p.esUno()) return v;
      if (c.p.neg().esUno()) return `-${v}`;
      return `${TeX.frac(c.p)}${v}`;
    }
    if (TeX.esCompuesto(c)) return `\\left(${TeX.cuad(c)}\\right)${v}`;
    return `${TeX.radical(c.q, c.s)}\\,${v}`;
  },

  /** e^{m x}.  Si m = 0 devuelve "1". */
  exp(m) {
    if (m.esCero()) return '1';
    return `e^{${TeX.porVariable(m)}}`;
  },

  /** cos βx / sen βx  (en LaTeX \sin; mostramos "sen" como en México) */
  trig(nombre, beta) {
    const op = nombre === 'cos' ? '\\cos' : '\\operatorname{sen}';
    return `${op} ${TeX.porVariable(beta)}`;
  },

  /** Polinomio  a·t₂ + b·t₁ + c·t₀  con los signos bien puestos. */
  polinomio(coefs, terminos) {
    let out = '';
    coefs.forEach((k, i) => {
      if (k.esCero()) return;
      const t = terminos[i];
      const neg = k.signo() < 0, a = k.abs();
      const num = (a.esUno() && t) ? '' : TeX.frac(a);
      const pieza = `${num}${t}`;
      if (out === '') out = (neg ? '-' : '') + pieza;
      else out += ` ${neg ? '-' : '+'} ${pieza}`;
    });
    return out || '0';
  },

  ecuacion(sol)       { return `${TeX.polinomio([sol.a, sol.b, sol.c], ["y''", "y'", 'y'])} = 0`; },
  caracteristica(sol) { return `${TeX.polinomio([sol.a, sol.b, sol.c], ['m^2', 'm', ''])} = 0`; },

  /** Funciones y₁, y₂ ya sustituidas (y la plantilla general de cada caso). */
  soluciones(sol) {
    if (sol.caso === 'reales') {
      return {
        plantilla: ['e^{m_1x}', 'e^{m_2x}'],
        y: [TeX.exp(sol.m1), TeX.exp(sol.m2)],
      };
    }
    if (sol.caso === 'repetida') {
      const e = TeX.exp(sol.m1);
      return {
        plantilla: ['e^{mx}', 'x\\,e^{mx}'],
        y: [e, e === '1' ? 'x' : `x${e}`],
      };
    }
    const e = TeX.exp(sol.alfa);
    const pre = e === '1' ? '' : e;
    return {
      plantilla: ['e^{\\alpha x}\\cos\\beta x', 'e^{\\alpha x}\\operatorname{sen}\\beta x'],
      intermedio: sol.alfa.esCero()
        ? [`e^{0x}${TeX.trig('cos', sol.beta)}`, `e^{0x}${TeX.trig('sen', sol.beta)}`]
        : null,
      y: [`${pre}${TeX.trig('cos', sol.beta)}`, `${pre}${TeX.trig('sen', sol.beta)}`],
    };
  },

  /**
   * Término  k·f(x)  para armar combinaciones lineales.
   * Devuelve { signo: '+'|'-', cuerpo } o null si k = 0.
   */
  termino(k, f) {
    if (k.esCero()) return null;
    const esUno = f === '1';
    if (TeX.esCompuesto(k)) return { signo: '+', cuerpo: esUno ? TeX.cuad(k) : `\\left(${TeX.cuad(k)}\\right)${f}` };
    const val = k.esRacional() ? k.p : k.q;
    const neg = val.signo() < 0;
    const absK = k.esRacional() ? new Cuad(k.p.abs()) : new Cuad(0, k.q.abs(), k.s);
    let num;
    if (absK.esRacional() && absK.p.esUno()) num = esUno ? '1' : '';
    else num = absK.esRacional() ? TeX.frac(absK.p) : TeX.radical(absK.q, absK.s) + (esUno ? '' : '\\,');
    return { signo: neg ? '-' : '+', cuerpo: esUno ? num : `${num}${f}` };
  },

  /** Une términos:  [{signo, cuerpo}, …]  →  "a - b + c" */
  unir(terms) {
    const t = terms.filter(Boolean);
    if (!t.length) return '0';
    return t.map((x, i) => (i === 0 ? (x.signo === '-' ? '-' : '') : ` ${x.signo} `) + x.cuerpo).join('');
  },

  /** c₁y₁ + c₂y₂  con símbolos c₁, c₂ */
  general(sol) {
    const { y } = TeX.soluciones(sol);
    const t = (ci, f) => (f === '1' ? ci : `${ci}${f}`);
    return `${t('c_1', y[0])} + ${t('c_2', y[1])}`;
  },

  /** Forma factorizada equivalente (cuando la hay) */
  generalFactorizada(sol) {
    if (sol.caso === 'repetida') {
      const e = TeX.exp(sol.m1);
      return e === '1' ? null : `${e}\\left(c_1 + c_2x\\right)`;
    }
    if (sol.caso === 'complejas') {
      const e = TeX.exp(sol.alfa);
      if (e === '1') return null;
      return `${e}\\left(c_1${TeX.trig('cos', sol.beta)} + c_2${TeX.trig('sen', sol.beta)}\\right)`;
    }
    return null;
  },

  /** Factor  (q·m − p) */
  factor({ q, p }) {
    const coefM = q === 1n ? 'm' : `${q}m`;
    if (p === 0n) return { tex: coefM, solo: true };
    return { tex: `\\left(${coefM} ${p < 0n ? '+' : '-'} ${p < 0n ? -p : p}\\right)`, solo: false };
  },

  factorizacion(fz) {
    if (!fz) return null;
    const A = TeX.factor(fz.f1), Bf = TeX.factor(fz.f2);
    let k = '';
    if (fz.k.neg().esUno()) k = '-';
    else if (!fz.k.esUno()) k = TeX.frac(fz.k);
    if (A.tex === Bf.tex) return `${k}${A.solo ? 'm^2' : A.tex + '^2'} = 0`;
    const [x, y] = Bf.solo ? [Bf, A] : [A, Bf];           // la "m" sola va primero
    return `${k}${x.tex}${y.tex} = 0`;
  },

  /** Wronskiano simplificado W(y₁, y₂) */
  wronskiano(sol) {
    const mult = (k, e) => {                           // k·e^{…}
      if (e === '1') return k;
      if (k === '1') return e;
      return `${k}\\,${e}`;
    };
    if (sol.caso === 'reales') {
      // W = (m₂ − m₁)·e^{(m₁+m₂)x}   con   m₂ − m₁ = 2B√s ,  m₁ + m₂ = 2h
      const dif = TeX.radical(new Fraccion(2).multiplicar(sol.B), sol.s);
      const suma = new Cuad(new Fraccion(2).multiplicar(sol.h));
      return {
        formula: '(m_2 - m_1)\\,e^{(m_1+m_2)x}',
        valor: mult(dif, TeX.exp(suma)),
      };
    }
    if (sol.caso === 'repetida') {
      return { formula: 'e^{2mx}', valor: TeX.exp(new Cuad(new Fraccion(2).multiplicar(sol.h))) };
    }
    return {
      formula: '\\beta\\,e^{2\\alpha x}',
      valor: mult(TeX.cuad(sol.beta), TeX.exp(new Cuad(new Fraccion(2).multiplicar(sol.h)))),
    };
  },
};
