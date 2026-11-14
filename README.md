# Portafolio de Ana Izaguirre

CV interactivo ambientado en un bosque antiguo: dosel, troncos a varias profundidades, bandas de niebla, rayos de luz y espíritus luminosos que caminan por la escena, delante y detrás del contenido. Todo son SVG originales dibujados en código: no hay imágenes ni personajes de terceros. La carrera se cuenta como un relato sobre una línea de tiempo (empresa, sector, duración y tecnologías con sus logos) y se puede consultar con un buscador que cita el propio CV.

Dos ambientes: día (pradera) y noche (cielo estrellado). Español e inglés.

Todo el paisaje es SVG propio dibujado a mano en código: no hay imágenes ni material de terceros.

Los logos son de simple-icons (CC0), incrustados en el HTML: la página no hace ninguna petición externa.

## Publicar en GitHub Pages
1. Crea un repositorio público llamado `ana-izaguirre.github.io`.
2. Sube todo el contenido de esta carpeta a la raíz del repositorio, incluida `.github/`.
3. En Settings, Pages, en **Source** elige **GitHub Actions** (no «Deploy from a branch»).
4. Cada `push` a `main` despliega solo, con el workflow `.github/workflows/deploy.yml`.
5. La página queda en https://ana-izaguirre.github.io/

El workflow también se puede lanzar a mano desde la pestaña Actions (`Run workflow`).

Si usas otro dominio, cambia esa dirección en `index.html` (canonical, og:url, og:image, JSON-LD), en `robots.txt` y en `sitemap.xml`.

## Editar el CV
Todo el contenido está en `index.html`. El texto en español está en el HTML y el inglés en el objeto `EN` del script.
El buscador se indexa solo a partir de ese mismo HTML, así que no hay que tocar nada más.

## Regenerar los PDF
Abre la página, elige el idioma y usa Imprimir, Guardar como PDF (A4). Guarda el archivo como
`Ana-Izaguirre-CV-ES.pdf` o `Ana-Izaguirre-CV-EN.pdf`.

## Tipografías
Instrument Serif, Geist y Geist Mono, bajo SIL Open Font License 1.1, alojadas en `fonts/`.

## Medición (Lighthouse)

| | Escritorio | Móvil |
|---|---|---|
| SEO | 100 | 100 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| Rendimiento | 100 | 100 |

El móvil se mide con la CPU frenada 4 veces y red 4G lenta. Las animaciones del bosque quedan en pausa hasta que la página termina de cargar (`html.boot`), así que el hilo principal queda libre durante el arranque.
