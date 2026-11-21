/* =====================================================================
   1 · ARITMÉTICA EXACTA
   ---------------------------------------------------------------------
   La computadora normalmente trabaja con decimales (0.3333…), pero en
   clase escribimos  1/3  y  √3/2.  Para que el programa responda como
   en el pizarrón usamos tres piezas:

     · Fraccion  →  n/d  con enteros grandes (BigInt), siempre reducida.
     · raizDe(q) →  √q  simplificada como  k·√s   (s libre de cuadrados)
     · Cuad      →  números de la forma  p + q·√s   (p, q fracciones)

   Con eso, las raíces de  am² + bm + c = 0  salen EXACTAS.
   ===================================================================== */

/** Máximo común divisor (algoritmo de Euclides) con BigInt. */
function mcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}

/** Raíz cuadrada entera de un BigInt (método de Newton). */
function raizEntera(n) {
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
}

class Fraccion {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error('División entre cero');
    if (d < 0n) { n = -n; d = -d; }           // el signo vive en el numerador
    const g = mcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  static de(x) { return x instanceof Fraccion ? x : new Fraccion(x); }

  sumar(o)       { o = Fraccion.de(o); return new Fraccion(this.n * o.d + o.n * this.d, this.d * o.d); }
  restar(o)      { o = Fraccion.de(o); return new Fraccion(this.n * o.d - o.n * this.d, this.d * o.d); }
  multiplicar(o) { o = Fraccion.de(o); return new Fraccion(this.n * o.n, this.d * o.d); }
  dividir(o)     { o = Fraccion.de(o); return new Fraccion(this.n * o.d, this.d * o.n); }
  neg()          { return new Fraccion(-this.n, this.d); }
  abs()          { return new Fraccion(this.n < 0n ? -this.n : this.n, this.d); }

  esCero()   { return this.n === 0n; }
  esUno()    { return this.n === 1n && this.d === 1n; }
  esEntero() { return this.d === 1n; }
  signo()    { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
  igual(o)   { o = Fraccion.de(o); return this.n === o.n && this.d === o.d; }
  valor()    { return Number(this.n) / Number(this.d); }
}

/**
 * Convierte el texto que escribe el usuario en una Fraccion exacta.
 * Acepta:  3   -3   −3   0.25   -1.5   1/2   -3/4   2.5/3
 * Devuelve null si el texto no es un número válido.
 */
function leerNumero(texto) {
  const t = String(texto).trim().replace(/−|–/g, '-').replace(',', '.').replace(/\s+/g, '');
  if (t === '' || t === '-' || t === '+') return null;
  const decimal = /^[+-]?(\d+\.?\d*|\.\d+)$/;
  const aFraccion = (s) => {
    if (!decimal.test(s)) return null;
    const neg = s.startsWith('-');
    s = s.replace(/^[+-]/, '');
    const [ent, dec = ''] = s.split('.');
    if (dec.length > 6 || (ent + dec).length > 12) return null;   // límites razonables
    const f = new Fraccion(BigInt((ent || '0') + dec), 10n ** BigInt(dec.length));
    return neg ? f.neg() : f;
  };
  const partes = t.split('/');
  if (partes.length === 1) return aFraccion(partes[0]);
  if (partes.length === 2) {
    const n = aFraccion(partes[0]), d = aFraccion(partes[1]);
    if (!n || !d || d.esCero()) return null;
    return n.dividir(d);
  }
  return null;
}

/**
 * Simplifica √N  (N entero ≥ 0)  como  k·√s  con s libre de cuadrados.
 * Ejemplo:  √12 = 2√3   →  { k: 2n, s: 3n }
 */
function simplificarRaiz(N) {
  let k = 1n, s = N;
  for (let p = 2n; p * p <= s && p <= 50000n; p++) {
    const p2 = p * p;
    while (s % p2 === 0n) { s /= p2; k *= p; }
  }
  const r = raizEntera(s);
  if (r * r === s) { k *= r; s = 1n; }
  return { k, s };
}

/**
 * √q  para una fracción q ≥ 0, simplificada como  coef·√s.
 * Truco:  √(n/d) = √(n·d) / d
 * Ejemplo: √(3/4) = √12/4 = 2√3/4 = (1/2)√3
 */
function raizDe(q) {
  const { k, s } = simplificarRaiz(q.n * q.d);
  return { coef: new Fraccion(k, q.d), s };
}

/**
 * Cuad: número de la forma  p + q·√s.
 * Sirve para raíces irracionales (1 ± √3), para β = √3/2,
 * y para constantes c₁, c₂ de un PVI.
 */
class Cuad {
  constructor(p, q = new Fraccion(0), s = 1n) {
    p = Fraccion.de(p); q = Fraccion.de(q);
    if (s === 1n) { p = p.sumar(q); q = new Fraccion(0); }   // √1 = 1: se junta con p
    if (q.esCero()) s = 1n;
    this.p = p; this.q = q; this.s = s;
  }
  esRacional() { return this.q.esCero(); }
  esCero()     { return this.p.esCero() && this.q.esCero(); }
  valor()      { return this.p.valor() + this.q.valor() * Math.sqrt(Number(this.s)); }
}
