# Ana Izaguirre — CV interactivo

[English](README.md) · **Español**

[![Deploy](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/deploy.yml)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fana-izaguirre.github.io%2Fcoverage.json)](#calidad)
[![En vivo](https://img.shields.io/badge/en%20vivo-ana--izaguirre.github.io-E8B572)](https://ana-izaguirre.github.io/)

Portafolio y CV en una sola página estática, dentro de un paisaje ilustrado original que cuenta el viaje de Honduras a Zaragoza. Español e inglés, tema claro y oscuro.

## Lo que vale la pena mirar

- **Pregúntale a mi CV.** Búsqueda BM25 sobre el propio CV, construida con el marcado de la página al cargar. Ningún modelo genera texto: cada respuesta cita el CV.
- **Casos que se pueden tocar.** Cada proyecto abre con cifras de su repositorio y se despliega en problema, decisiones, arquitectura, trade-offs y resultados, con un diagrama cuyas piezas se explican solas y la máquina de estados de trainer-flow para intentar romperla.
- **Movimiento sin script.** El contenido que entra, el parallax de la portada y las cifras que cuentan son CSS guiado por el scroll. Un interruptor en la barra lo detiene todo, y se respeta el movimiento reducido.
- **Nada del exterior.** Sin framework, CDN, analítica ni servicio de fuentes: un HTML, dos módulos de script y cuatro fuentes alojadas.
- **Pinta antes que el script.** `app.js` se pide después del primer frame. La portada ya sale en el idioma del visitante y nada se mueve cuando llega el script.
- **La hoja de impresión es el PDF.** Los dos CV descargables salen de las reglas de impresión de la propia página, una página A4 cada uno.

## Calidad

Cada push a `main` pasa la compuerta completa antes de desplegar, y el despliegue solo corre si pasa:

- **Playwright:** recorridos end-to-end y layout en seis tamaños de pantalla.
- **axe-core:** cero violaciones de accesibilidad.
- **Lighthouse:** 100 en todas las categorías, en móvil y escritorio.
- **Cobertura V8:** 100% del JavaScript de la página. El badge de arriba muestra la ejecución que aprobó el sitio en vivo.

```bash
npm ci && npx playwright install --with-deps chromium
npm run qa        # pruebas + cobertura + Lighthouse
```

## Ejecutar y editar

```bash
python3 -m http.server 8000   # http://localhost:8000
```

- **Contenido:** el español vive en `index.html` y el inglés en `app.js`; el de la primera pantalla está en `EN_TOP`, dentro de `index.html`.
- **Búsqueda:** `js/search.js`, un módulo puro con sus propias pruebas unitarias (`npm run test:unit`).
- **Decisiones y specs:** `docs/`.
- **Paisaje:** lo genera `tools/scene.py`.

## Créditos

- **Tipografías:** Fraunces, Nunito y Geist Mono (SIL OFL 1.1).
- **Logos:** [simple-icons](https://simpleicons.org/) (CC0).
- Todo lo demás es original.
