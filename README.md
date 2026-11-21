<h1 align="center">Ecuaciones Diferenciales</h1>

<p align="center"><strong>Escuela Superior de Cómputo · Instituto Politécnico Nacional</strong><br>Ingeniería en Sistemas Computacionales · Tercer semestre</p>

<p align="center">
  <a href="https://www.escom.ipn.mx/htmls/oferta/mapaCurrISC2020.php"><img src="https://img.shields.io/badge/ISC-Plan_2020-6D1A42?style=flat-square" alt="ISC · Plan 2020"></a>
  <img src="https://img.shields.io/badge/Semestre-III-334155?style=flat-square" alt="Semestre III">
  <img src="https://img.shields.io/badge/Grupo-3CM3-1E5A7A?style=flat-square" alt="Grupo 3CM3">
</p>

<p align="center"><a href="#programa-de-estudios">Programa de estudios</a> &nbsp;·&nbsp; <a href="#contenido-del-repositorio">Contenido</a> &nbsp;·&nbsp; <a href="#uso-del-material">Uso del material</a> &nbsp;·&nbsp; <a href="#referencias">Referencias</a></p>

---

Tareas, guías resueltas, cuadernos y apuntes de pizarrón para estudiar ecuaciones diferenciales ordinarias. El material reúne métodos de primer orden y recursos de segundo orden, independencia lineal y variación de parámetros.

| Acceso directo | Qué encontrarás |
|---|---|
| [Empezar por el primer parcial](02_guias/g01_primer_parcial.pdf) | Guía de trabajo para acompañar las tareas. |
| [Consultar el solucionario](02_guias/g02_solucionario_primer_parcial.pdf) | Procedimientos resueltos para contrastar resultados. |
| [Estudiar segundo orden](02_guias/g04_ecuaciones_de_segundo_orden/) | Material específico de ecuaciones de segundo orden. |

## Programa de estudios

Modelar sistemas dinámicos y analizar sus soluciones mediante ecuaciones diferenciales ordinarias.

Síntesis del [programa oficial de la unidad de aprendizaje](https://www.escom.ipn.mx/docs/oferta/uaISC2020/ecuacionesDiferenciales_ISC2020.pdf), perteneciente al **Plan ISC 2020**.

**Carga semanal:** 4.5 horas de teoría. **Créditos:** 9.0 TEPIC / 6.2 SATCA.

| Unidad | Eje de estudio | Alcance |
|:---:|---|---|
| I | Conceptos iniciales | Clasificación de ecuaciones, soluciones y condiciones iniciales. |
| II | Métodos de primer orden | Identificación de formas y selección de procedimientos de solución. |
| III | Ecuaciones lineales de orden superior | Soluciones homogéneas, independencia y obtención de soluciones particulares. |
| IV | Método de Laplace | Transformación de ecuaciones y resolución de problemas con condiciones iniciales. |

**Antecedentes académicos:** Cálculo, Cálculo Aplicado y Mecánica y Electromagnetismo.

El programa describe el alcance de la asignatura. Las carpetas siguientes muestran el material efectivamente disponible en esta colección.

## Contenido del repositorio

| Carpeta | Contenido |
|---|---|
| [Tareas](01_tareas/) · `01_tareas` | Actividades del primer parcial. |
| [Guías](02_guias/) · `02_guias` | Primer parcial, solucionario, Bernoulli y segundo orden. |
| [Apuntes](03_apuntes/) · `03_apuntes` | Cuadernos, compilación y fotografías de clase agrupadas por tema. |
| [Material de clase](04_material_clase/) · `04_material_clase` | Bibliografía de apoyo. |
| [Evaluaciones de referencia](05_examenes/) · `05_examenes` | Examen del primer parcial conservado como referencia. |

Los números de actividad conservan la identificación de las entregas; las guías se distinguen por el prefijo `g` y las prácticas por `p` o `act`, según la materia.

## Uso del material

### Elegir el material adecuado

| Necesidad | Recurso |
|---|---|
| Practicar un método de primer orden | [Guía de Bernoulli](02_guias/g03_ecuacion_de_bernoulli.pdf) y [tareas del primer parcial](01_tareas/primer_parcial/). |
| Revisar el desarrollo de clase | [Cuaderno de la materia](03_apuntes/cuaderno_ecuaciones_diferenciales.pdf). |
| Repasar independencia de soluciones | [Apuntes de independencia lineal](03_apuntes/apuntes_pizarron_2026_11_18/01_independencia_lineal/). |
| Trabajar soluciones particulares | [Apuntes de variación de parámetros](03_apuntes/apuntes_pizarron_2026_11_18/02_variacion_parametros/). |

Antes de resolver, identifica orden, linealidad y condiciones dadas. Al terminar, sustituye la solución en la ecuación original y comprueba las condiciones iniciales: esto permite detectar errores que no se aprecian al comparar únicamente la expresión final.

Los PDF son la vía más directa de consulta. Las fotografías se numeran dentro de cada tema para conservar la secuencia del pizarrón. El temario oficial incluye Laplace; la presencia de una unidad en ese temario no implica que todas sus actividades estén ya incorporadas al repositorio.

<details>
<summary><strong>Clonar el repositorio</strong></summary>

```powershell
git clone https://github.com/EmilioNoyola/Ecuaciones_Diferenciales_3CM3_NGED.git ecuaciones_diferenciales
cd ecuaciones_diferenciales
```

</details>

## Referencias

- [Programa oficial de Ecuaciones Diferenciales — PDF](https://www.escom.ipn.mx/docs/oferta/uaISC2020/ecuacionesDiferenciales_ISC2020.pdf): unidades, carga académica, evaluación y bibliografía institucional.
- [Catálogo de unidades de aprendizaje de ISC 2020](https://www.escom.ipn.mx/htmls/oferta/mapaCurrISC2020.php): programas oficiales publicados por ESCOM.
- [Mapa curricular de ISC 2020 — PDF](https://www.escom.ipn.mx/docs/oferta/mapaCurricularISC2020.pdf): ubicación de la materia en la carrera.

---

**Repositorios relacionados:** [Circuitos Eléctricos](https://github.com/EmilioNoyola/Circuitos_Electricos_3CM1_ATLG_HEY_HX_NGED) · [Análisis y Diseño de Algoritmos](https://github.com/EmilioNoyola/Analisis_y_Disenho_de_Algoritmos_3CM1_ATLG_NGED).

Colección académica de [Emilio Noyola](https://github.com/EmilioNoyola). La autoría de cada entrega se indica en su portada o en el código correspondiente.
