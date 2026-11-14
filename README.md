# Ana Izaguirre — Interactive CV

**English** · [Español](README.es.md)

[![Deploy](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/deploy.yml)
[![Quality](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/quality.yml/badge.svg)](https://github.com/ana-izaguirre/ana-izaguirre.github.io/actions/workflows/quality.yml)
[![Live](https://img.shields.io/badge/live-ana--izaguirre.github.io-E4674A)](https://ana-izaguirre.github.io/)

[![Lighthouse](https://img.shields.io/badge/Lighthouse-100%20%C2%B7%20100%20%C2%B7%20100%20%C2%B7%20100-success)](#measurements)
[![axe-core](https://img.shields.io/badge/axe--core-0%20violations-success)](#measurements)
[![Tests](https://img.shields.io/badge/Playwright-41%20tests-success)](#quality-gates)
[![Dependencies](https://img.shields.io/badge/runtime%20dependencies-none-success)](#engineering-notes)

An interactive CV and portfolio, built as a single self-contained page.

**Live:** https://ana-izaguirre.github.io/

---

## What it is

A CV you can read, search and print, wrapped in an original forest scene. The career is told as a story along a continuous timeline — company, sector, duration and the technologies used at each stage, with real logos — and the whole document is searchable from the page itself.

Available in Spanish and English, with light and dark themes. Both are remembered between visits.

## Engineering notes

The parts worth looking at, for anyone reviewing the code:

**Search runs on the CV, not on a copy of it.** The index is built at load time from the rendered DOM: every element marked `data-chunk` becomes a document, scored with BM25. There is no second source of truth to drift out of sync, and no model generating text — every answer quotes a passage from the CV and links back to the place it came from, so nothing can be invented. Synonym groups widen the ranking (`sql` reaches PostgreSQL, DynamoDB and Snowflake), while highlighting stays strictly on the terms the visitor typed.

**Nothing is fetched from outside.** No framework, no CDN, no analytics, no web fonts over the network. Typefaces are self-hosted and subset; technology logos are [simple-icons](https://simpleicons.org/) paths embedded as inline SVG. The page is one HTML file plus three font files.

**The scene is drawn in code.** Canopy, tree layers, mist bands, light shafts and the walking spirits are hand-written SVG and CSS animations — no images, no third-party art. Day and night are two palettes over the same geometry.

**Animation is deferred until the page is interactive.** Every scene animation starts paused behind a `boot` class and is released on `load`, inside `requestIdleCallback`. That keeps the main thread free during startup, which is what holds total blocking time near zero on a throttled phone.

**The print stylesheet is the PDF.** Both downloadable CVs are generated from the page's own print rules — one A4 page each, in either language. There is no separately maintained document to fall behind the web version.

## Measurements

Lighthouse, mobile measured with 4× CPU throttling and slow 4G:

|                 | Desktop | Mobile |
|-----------------|---------|--------|
| Performance     | 100     | 100    |
| Accessibility   | 100     | 100    |
| Best practices  | 100     | 100    |
| SEO             | 100     | 100    |

`axe-core` reports no violations in dark, light and mobile contexts. The page is fully keyboard-operable, honours `prefers-reduced-motion`, and the layout holds from 360 px to 1920 px without horizontal scroll.

## Quality gates

Nothing reaches production unmeasured. Every push to `main` runs the full suite first, and the deploy job only starts once it is green.

| Layer | What it checks | Tool |
|---|---|---|
| End-to-end | Search, career story, themes, language, contact popup, CV downloads | Playwright |
| Layout | No overflow, nothing clipped, nothing overlapping — across six viewports | Playwright |
| Accessibility | Zero violations in dark, light and mobile; keyboard-only operation | axe-core |
| Performance | Lighthouse scores and Core Web Vitals, against thresholds | Lighthouse |

The layout tests exist because each assertion was once a real bug: a name chopped off by a `content-visibility` ancestor, question chips sliding under the CV sheet, a section band bleeding past the viewport. They assert the invariant rather than compare pixels, so they stay meaningful across platforms instead of going flaky.

Accessibility, best practices and SEO are deterministic and must score 100. Performance is measured on a throttled CPU, so CI enforces a floor (90 mobile, 95 desktop) rather than an exact number; the table above is what it actually scores.

Run it yourself:

```bash
npm ci
npx playwright install --with-deps chromium
npm run qa          # tests + Lighthouse
npm test            # tests only
npm run lighthouse  # Lighthouse only
```

Test tooling is the only thing in `package.json`. The site itself ships no dependencies.

## Running it locally

No build step, no dependencies:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works, though fonts load more reliably over HTTP.

## Deployment

Every push to `main` deploys through `.github/workflows/deploy.yml`, which calls the quality workflow first and only publishes if it passes. It can also be triggered by hand from the Actions tab. Pages must be configured with **Settings → Pages → Source: GitHub Actions**.

## Editing

All content lives in `index.html`. Spanish text sits in the markup; English translations are in the `EN` object in the script. The search index rebuilds itself from that same markup, so adding a role or a project needs no other change.

If the site moves to another domain, update the URL in `index.html` (canonical, `og:url`, `og:image`, JSON-LD), in `robots.txt` and in `sitemap.xml`.

## Credits

Typefaces: Instrument Serif, Geist and Geist Mono, under the SIL Open Font License 1.1.
Technology logos: [simple-icons](https://simpleicons.org/), CC0.
Everything else — scene, layout, code — is original.
