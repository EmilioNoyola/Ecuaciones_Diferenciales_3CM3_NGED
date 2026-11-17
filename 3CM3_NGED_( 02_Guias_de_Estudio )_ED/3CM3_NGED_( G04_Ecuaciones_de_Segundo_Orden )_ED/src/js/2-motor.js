/* =====================================================================
   2 · MOTOR: EL MÉTODO DEL PIZARRÓN
   ---------------------------------------------------------------------
   Para  a·y'' + b·y' + c·y = 0  proponemos  y = e^{mx}.  Al sustituir:

        e^{mx}(a m² + b m + c) = 0   y como  e^{mx} ≠ 0
        ⇒  a m² + b m + c = 0          ← ecuación característica

   Sus raíces salen con la fórmula general  m = (−b ± √Δ) / 2a,
   donde  Δ = b² − 4ac  (discriminante).  El signo de Δ decide TODO:

        Δ > 0  →  raíces reales distintas  m₁ ≠ m₂
                  y₁ = e^{m₁x},          y₂ = e^{m₂x}
        Δ = 0  →  raíz real repetida  m
                  y₁ = e^{mx},           y₂ = x·e^{mx}
        Δ < 0  →  raíces complejas  α ± βi
                  y₁ = e^{αx}cos βx,     y₂ = e^{αx}sen βx

   Y al final:   y_c = c₁y₁ + c₂y₂
   ===================================================================== */

const Motor = {

  /** Resuelve a·y'' + b·y' + c·y = 0.  a, b, c son Fraccion. */
  resolver(a, b, c) {
    if (a.esCero()) throw new Error('a = 0: la ecuación ya no es de orden 2');

    // ① Discriminante  Δ = b² − 4ac
    const delta = b.multiplicar(b).restar(new Fraccion(4).multiplicar(a).multiplicar(c));

    // Centro de las raíces   h = −b / 2a   (es α en el caso complejo)
    const dosA = new Fraccion(2).multiplicar(a);
    const h = b.neg().dividir(dosA);

    // Mitad de la separación   B·√s = √|Δ| / |2a|
    const { coef, s } = raizDe(delta.abs());
    const B = coef.dividir(dosA.abs());

    let caso, m1, m2, alfa, beta;
    if (delta.signo() > 0) {
      caso = 'reales';
      m1 = new Cuad(h, B.neg(), s);    // la menor
      m2 = new Cuad(h, B, s);          // la mayor
    } else if (delta.esCero()) {
      caso = 'repetida';
      m1 = m2 = new Cuad(h);
    } else {
      caso = 'complejas';
      alfa = new Cuad(h);
      beta = new Cuad(0, B, s);        // β > 0
    }

    const sol = { a, b, c, delta, dosA, h, B, s, raizDelta: { coef, s }, caso, m1, m2, alfa, beta };
    sol.funciones = Motor.funcionesNumericas(sol);
    sol.residuo = Motor.verificar(sol);
    return sol;
  },

  /**
   * Versiones numéricas de y₁, y₂ y sus derivadas.
   * Se usan para dibujar la gráfica y para COMPROBAR la respuesta.
   */
  funcionesNumericas(sol) {
    const E = Math.exp, C = Math.cos, S = Math.sin;
    if (sol.caso === 'reales') {
      const r1 = sol.m1.valor(), r2 = sol.m2.valor();
      const exp = (r) => ({
        f:  (x) => E(r * x),
        d1: (x) => r * E(r * x),
        d2: (x) => r * r * E(r * x),
      });
      return [exp(r1), exp(r2)];
    }
    if (sol.caso === 'repetida') {
      const r = sol.m1.valor();
      return [
        { f: (x) => E(r * x), d1: (x) => r * E(r * x), d2: (x) => r * r * E(r * x) },
        { f: (x) => x * E(r * x), d1: (x) => E(r * x) * (1 + r * x), d2: (x) => E(r * x) * (2 * r + r * r * x) },
      ];
    }
    const al = sol.alfa.valor(), be = sol.beta.valor(), k = al * al - be * be;
    return [
      { f:  (x) => E(al * x) * C(be * x),
        d1: (x) => E(al * x) * (al * C(be * x) - be * S(be * x)),
        d2: (x) => E(al * x) * (k * C(be * x) - 2 * al * be * S(be * x)) },
      { f:  (x) => E(al * x) * S(be * x),
        d1: (x) => E(al * x) * (al * S(be * x) + be * C(be * x)),
        d2: (x) => E(al * x) * (k * S(be * x) + 2 * al * be * C(be * x)) },
    ];
  },

  /**
   * Comprobación: sustituye y₁ y y₂ en  a·y'' + b·y' + c·y
   * en varios puntos y mide qué tan cerca de 0 queda (residuo relativo).
   */
  verificar(sol) {
    const a = sol.a.valor(), b = sol.b.valor(), c = sol.c.valor();
    let peor = 0;
    for (const y of sol.funciones) {
      for (const x of [-1.3, -0.6, -0.1, 0.4, 0.9, 1.5]) {
        const t1 = a * y.d2(x), t2 = b * y.d1(x), t3 = c * y.f(x);
        const escala = Math.abs(t1) + Math.abs(t2) + Math.abs(t3);
        if (escala > 0 && isFinite(escala)) peor = Math.max(peor, Math.abs(t1 + t2 + t3) / escala);
      }
    }
    return peor;
  },

  /**
   * Problema de valor inicial:  y(0) = y0,  y'(0) = v0.
   * Al evaluar en x = 0 (e⁰ = 1, cos 0 = 1, sen 0 = 0) queda un sistema 2×2:
   *
   *   reales:     c₁ + c₂ = y0          m₁c₁ + m₂c₂ = v0
   *   repetida:   c₁      = y0          m·c₁ + c₂   = v0
   *   complejas:  c₁      = y0          α·c₁ + β·c₂ = v0
   *
   * Lo resolvemos de forma exacta (fórmulas despejadas a mano).
   */
  resolverPVI(sol, y0, v0) {
    const { h, B, s } = sol;
    const resto = v0.restar(h.multiplicar(y0));            // v0 − h·y0
    if (sol.caso === 'reales') {
      // c₂ = y0/2 + (v0 − h·y0)/(2B·s)·√s ,   c₁ = y0 − c₂
      const mitad = y0.dividir(2);
      const q = resto.dividir(new Fraccion(2).multiplicar(B).multiplicar(new Fraccion(s)));
      return { c1: new Cuad(mitad, q.neg(), s), c2: new Cuad(mitad, q, s) };
    }
    if (sol.caso === 'repetida') {
      return { c1: new Cuad(y0), c2: new Cuad(resto) };
    }
    // complejas: c₂ = (v0 − α·y0)/β  con  β = B√s   ⇒  (v0 − α·y0)/(B·s)·√s
    const q = resto.dividir(B.multiplicar(new Fraccion(s)));
    return { c1: new Cuad(y0), c2: new Cuad(0, q, s) };
  },

  /** Factorización entera  k(q₁m − p₁)(q₂m − p₂)  cuando las raíces son racionales. */
  factorizar(sol) {
    if (sol.caso === 'complejas' || !sol.m1.esRacional()) return null;
    const r1 = sol.m1.p, r2 = sol.m2.p;
    const k = sol.a.dividir(new Fraccion(r1.d * r2.d));
    return { k, f1: { q: r1.d, p: r1.n }, f2: { q: r2.d, p: r2.n } };
  },
};
