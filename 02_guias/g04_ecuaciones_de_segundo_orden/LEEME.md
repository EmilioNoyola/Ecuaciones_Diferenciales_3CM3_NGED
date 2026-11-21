# Constructor de la solución general · 3CM3

**3CM3 — Ecuaciones Diferenciales**
Profesor: Jorge Javier Silva Martínez
Alumnos: Moreno Miranda Alexander · Noyola Gómez Emilio Damian

---

## Cómo abrirlo

Doble clic en **`g04_ecuaciones_de_segundo_orden.html`**. Se abre en cualquier navegador (Chrome, Edge, Firefox, celular).
**No necesita internet ni instalar nada**: las fórmulas (KaTeX) y las letras van dentro del mismo archivo.
Se puede mandar por WhatsApp, correo o USB y funciona igual.

Truco para la presentación: si abres el archivo directo, la dirección guarda la ecuación
(`g04_ecuaciones_de_segundo_orden.html#a=1&b=-3&c=2`), así que puedes dejar marcadores con ejemplos ya cargados.

## Qué hace

Para `a·y'' + b·y' + c·y = 0` muestra los mismos pasos que el profesor en el pizarrón:

1. **Ecuación característica** `a m² + b m + c = 0` (y de dónde sale, al proponer `y = e^{mx}`).
2. **Raíces** `m₁, m₂` con el discriminante, la fórmula general y, si se puede, la factorización.
3. **Soluciones** `y₁, y₂` según el caso, y el **Wronskiano** para comprobar que son l.i.
4. **Solución general** `y_c = c₁y₁ + c₂y₂` y una comprobación numérica automática.
5. (Opcional) **PVI**: con `y(0)` y `y'(0)` calcula `c₁` y `c₂` exactos.

Extras: gráfica de `y₁`, `y₂`, `y_c` con deslizadores para `c₁` y `c₂`, plano complejo de las raíces
y tema claro/oscuro (pintarrón/pizarrón).

Acepta enteros, negativos, decimales y fracciones: `-3`, `0.25`, `1/2`, `-3/4`.
Con las flechas ↑ ↓ del teclado el número sube o baja de 1 en 1.

## La lógica (para explicársela al profesor)

La idea central es **una decisión con el discriminante** `Δ = b² − 4ac`:

| Δ | Raíces | y₁ | y₂ |
|---|---|---|---|
| Δ > 0 | reales distintas m₁ ≠ m₂ | e^{m₁x} | e^{m₂x} |
| Δ = 0 | repetida m | e^{mx} | x·e^{mx} |
| Δ < 0 | complejas α ± βi | e^{αx} cos βx | e^{αx} sen βx |

Donde `h = −b/2a` es el centro de las raíces (es `α` en el caso complejo) y `√|Δ| / |2a|` es la mitad
de la separación (es `β` en el caso complejo). Así las tres ramas salen de las mismas dos cantidades.

### Por qué las respuestas salen como en el cuaderno (y no en decimales)

La computadora normalmente diría `m = 0.8660254…`. Para escribir `√3/2` el programa usa
**aritmética exacta**:

- `Fraccion`: guarda `n/d` con enteros grandes (BigInt) y siempre la reduce con el MCD (Euclides).
- `raizDe(q)`: simplifica raíces. Ejemplo `√12 = 2√3`, y `√(3/4) = √12/4 = √3/2`.
- `Cuad`: números de la forma `p + q√s`, para raíces como `1 ± √3`.

### Cómo sabe que la respuesta es correcta

`Motor.verificar()` toma `y₁` y `y₂`, calcula sus derivadas y las sustituye en `a·y'' + b·y' + c·y`
en seis puntos distintos. El resultado debe ser 0; en pantalla se ve el error relativo (≈ 10⁻¹⁶, que es
el límite de precisión de la computadora).

### El PVI

En `x = 0` se cumple `e⁰ = 1`, `cos 0 = 1`, `sen 0 = 0`, y queda un sistema 2×2:

- reales: `c₁ + c₂ = y(0)` y `m₁c₁ + m₂c₂ = y'(0)`
- repetida: `c₁ = y(0)` y `m·c₁ + c₂ = y'(0)`
- complejas: `c₁ = y(0)` y `α·c₁ + β·c₂ = y'(0)`

Se despejaron a mano y el programa evalúa esas fórmulas con fracciones exactas.

## Estructura del código (`src/`)

| Archivo | Qué contiene |
|---|---|
| `js/1-aritmetica.js` | `Fraccion`, `leerNumero`, `raizDe`, `Cuad` (números exactos) |
| `js/2-motor.js` | `Motor.resolver` (los 3 casos), `resolverPVI`, `verificar`, `factorizar` |
| `js/3-latex.js` | `TeX`: convierte los números a LaTeX bien escrito (sin `1y''`, sin `+ -3`, `e^{-x}` en vez de `e^{-1x}`) |
| `js/4-graficas.js` | Plano complejo de raíces (SVG) y gráfica de las soluciones (canvas) |
| `js/5-interfaz.js` | Lee los cuadros, arma los pasos, dibuja y responde a los botones |
| `css/estilos.css` | Diseño, temas claro/oscuro y versión para celular |
| `index.html` | La estructura de la página |
| `vendor/` | KaTeX (dibuja el LaTeX) y las tipografías |

Flujo cada vez que escribes un número:

```
leer a, b, c  →  Motor.resolver()  →  construirPasos() (LaTeX)  →  KaTeX dibuja  →  gráfica
```

## Si cambian algo

Editen los archivos de `src/` (se puede abrir `src/index.html` directo para probar) y luego, para
volver a generar el archivo único `g04_ecuaciones_de_segundo_orden.html`, corran:

```
python build.py
```
