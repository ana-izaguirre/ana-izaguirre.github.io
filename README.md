# Ana Izaguirre — Interactive CV

**English** · [Español](README.es.md)

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

## Running it locally

No build step, no dependencies:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works, though fonts load more reliably over HTTP.

## Deployment

Every push to `main` deploys through `.github/workflows/deploy.yml`. It can also be triggered by hand from the Actions tab. Pages must be configured with **Settings → Pages → Source: GitHub Actions**.

## Editing

All content lives in `index.html`. Spanish text sits in the markup; English translations are in the `EN` object in the script. The search index rebuilds itself from that same markup, so adding a role or a project needs no other change.

If the site moves to another domain, update the URL in `index.html` (canonical, `og:url`, `og:image`, JSON-LD), in `robots.txt` and in `sitemap.xml`.

## Credits

Typefaces: Instrument Serif, Geist and Geist Mono, under the SIL Open Font License 1.1.
Technology logos: [simple-icons](https://simpleicons.org/), CC0.
Everything else — scene, layout, code — is original.
