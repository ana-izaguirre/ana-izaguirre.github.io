# Ana Izaguirre — CV interactivo

[English](README.md) · **Español**

[![Deploy](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/deploy.yml)
[![Quality](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/quality.yml/badge.svg)](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/quality.yml)
[![Live](https://img.shields.io/badge/en%20vivo-ana--izaguirre.github.io-E4674A)](https://ana-izaguirre.github.io/)

[![Lighthouse](https://img.shields.io/badge/Lighthouse-100%20%C2%B7%20100%20%C2%B7%20100%20%C2%B7%20100-success)](#mediciones)
[![axe-core](https://img.shields.io/badge/axe--core-0%20violaciones-success)](#mediciones)
[![Tests](https://img.shields.io/badge/Playwright-41%20pruebas-success)](#compuertas-de-calidad)
[![Dependencias](https://img.shields.io/badge/dependencias%20en%20runtime-ninguna-success)](#notas-de-ingenier%C3%ADa)

Un CV y portafolio interactivo, construido como una sola página autocontenida.

**En vivo:** https://ana-izaguirre.github.io/

---

## Qué es

Un CV que se puede leer, buscar e imprimir, dentro de una escena de bosque original. La carrera se cuenta como un relato sobre una línea de tiempo continua — empresa, sector, duración y las tecnologías de cada etapa, con sus logos — y el documento entero se puede consultar desde la misma página.

Disponible en español e inglés, con tema claro y oscuro. Ambos se recuerdan entre visitas.

## Notas de ingeniería

Lo que vale la pena mirar, para quien revise el código:

**La búsqueda corre sobre el CV, no sobre una copia.** El índice se construye al cargar, a partir del DOM renderizado: cada elemento marcado con `data-chunk` es un documento, puntuado con BM25. No hay una segunda fuente de verdad que se desincronice, ni un modelo generando texto — cada respuesta cita un pasaje del CV y enlaza al lugar del que salió, así que nada puede inventarse. Los grupos de sinónimos amplían el ranking (`sql` alcanza PostgreSQL, DynamoDB y Snowflake), mientras que el resaltado se limita estrictamente a los términos que escribió la persona.

**No se pide nada al exterior.** Sin framework, sin CDN, sin analítica, sin fuentes por red. Las tipografías están alojadas y subconjuntadas; los logos de tecnologías son trazos de [simple-icons](https://simpleicons.org/) incrustados como SVG. La página es un archivo HTML más tres de fuentes.

**La escena está dibujada en código.** Dosel, capas de árboles, bandas de niebla, rayos de luz y los espíritus que caminan son SVG y animaciones CSS escritos a mano — sin imágenes ni material de terceros. Día y noche son dos paletas sobre la misma geometría.

**La animación se aplaza hasta que la página es interactiva.** Toda animación de la escena arranca en pausa tras una clase `boot` y se libera en `load`, dentro de `requestIdleCallback`. Eso mantiene libre el hilo principal durante el arranque, que es lo que sostiene el tiempo de bloqueo cerca de cero en un teléfono frenado.

**La hoja de impresión es el PDF.** Los dos CV descargables se generan con las reglas de impresión de la propia página — una página A4 cada uno, en cualquiera de los dos idiomas. No hay un documento aparte que se quede atrás de la versión web.

## Mediciones

Lighthouse; el móvil se mide con la CPU frenada 4 veces y red 4G lenta:

|                 | Escritorio | Móvil |
|-----------------|------------|-------|
| Rendimiento     | 100        | 100   |
| Accesibilidad   | 100        | 100   |
| Buenas prácticas| 100        | 100   |
| SEO             | 100        | 100   |

`axe-core` no reporta violaciones en oscuro, claro ni móvil. La página se maneja por completo con teclado, respeta `prefers-reduced-motion`, y el diseño aguanta de 360 px a 1920 px sin scroll horizontal.

## Compuertas de calidad

Nada llega a producción sin medirse. Cada push a `main` corre la suite completa primero, y el trabajo de despliegue solo arranca cuando está en verde.

| Capa | Qué comprueba | Herramienta |
|---|---|---|
| End-to-end | Buscador, historia de carrera, temas, idioma, popup de contacto, descargas de CV | Playwright |
| Layout | Sin desbordes, nada recortado, nada montado — en seis tamaños | Playwright |
| Accesibilidad | Cero violaciones en oscuro, claro y móvil; manejo solo con teclado | axe-core |
| Rendimiento | Puntuaciones de Lighthouse y Core Web Vitals, contra umbrales | Lighthouse |

Las pruebas de layout existen porque cada aserción fue un fallo real: un nombre cortado por un ancestro con `content-visibility`, las píldoras de preguntas deslizándose bajo la hoja del CV, una banda de sección desbordando el viewport. Comprueban el invariante en lugar de comparar píxeles, así que siguen siendo útiles entre plataformas en vez de volverse inestables.

Accesibilidad, buenas prácticas y SEO son deterministas y deben dar 100. El rendimiento se mide con la CPU frenada, así que CI exige un piso (90 en móvil, 95 en escritorio) en lugar de un número exacto; la tabla de arriba es lo que realmente puntúa.

Para correrlo:

```bash
npm ci
npx playwright install --with-deps chromium
npm run qa          # pruebas + Lighthouse
npm test            # solo pruebas
npm run lighthouse  # solo Lighthouse
```

El `package.json` solo contiene herramientas de prueba. El sitio en sí no lleva ninguna dependencia.

## Ejecutarlo en local

Sin compilación ni dependencias:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

Abrir `index.html` directamente desde el disco también funciona, aunque las fuentes cargan de forma más fiable por HTTP.

## Despliegue

Cada push a `main` despliega con `.github/workflows/deploy.yml`, que llama primero al workflow de calidad y solo publica si pasa. También se puede lanzar a mano desde la pestaña Actions. Pages debe estar configurado en **Settings → Pages → Source: GitHub Actions**.

## Editar

Todo el contenido vive en `index.html`. El texto en español está en el marcado; las traducciones al inglés, en el objeto `EN` del script. El índice de búsqueda se reconstruye solo a partir de ese mismo marcado, así que añadir un puesto o un proyecto no requiere tocar nada más.

Si el sitio se muda a otro dominio, hay que actualizar la URL en `index.html` (canonical, `og:url`, `og:image`, JSON-LD), en `robots.txt` y en `sitemap.xml`.

## Créditos

Tipografías: Instrument Serif, Geist y Geist Mono, bajo SIL Open Font License 1.1.
Logos de tecnologías: [simple-icons](https://simpleicons.org/), CC0.
Todo lo demás — escena, diseño, código — es original.
