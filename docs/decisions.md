# Architecture decisions

Short records of decisions that are easy to undo by accident. Each says what
was decided, why, and what would change the decision.

## D1. CSS stays inline in `index.html`

- **Decision.** All CSS lives in a `<style>` block in `index.html`.
- **Why.** A separate stylesheet is a render-blocking request. On Lighthouse's
  simulated slow 4G, each extra round trip before the first paint costs about
  150 ms of FCP, enough to drop mobile performance below 100. The CSS
  compresses to about 10 KB.
- **Revisit if** the CSS grows past what the first screen needs and splitting
  the non-critical part would pay for its own request.

## D2. The script loads after the first frame

- **Decision.** `app.js` is requested from a `requestAnimationFrame` plus
  `setTimeout` after the first paint.
- **What must be inline.** Whatever the first screen needs from JavaScript:
  theme, language decision (`LANG0`), and the cover's English (`EN_TOP`).
- **Why.** With the script inline, the HTML was 66 KB gzipped and mobile FCP
  was 1.55 s (performance 99). Now FCP is about 1.25 s, CLS is 0, and
  performance is 100.
- **Guarded by** `tests/first-paint.spec.js`.

## D3. No runtime dependencies, no external requests

- **Decision.** No framework, CDN, analytics or web-font service.
- **Why.** It is part of the claim the page makes about its author, and it is
  what keeps the page this fast. Tooling (Playwright, axe, Lighthouse) is
  dev-only.

## D4. The CV document is a data source, not a screen

- **Decision.** On screen, only "About" and "Projects" are shown. The rest of
  the CV stays in the markup with `.cv-only`: hidden by `@media screen`,
  printed in the PDF, and indexed by the search.
- **Why.** Ana did not want a second CV under the portfolio, but the PDF, the
  search and the career story all read this content. One copy of the content
  is safer than three.
- **Consequence.** Answers that quote a hidden passage carry no
  "see it in the CV" link.

## D5. One question box

- **Decision.** The cover box is the only input. The section below shows
  answers, suggestions and history.

## D6. Coverage is measured in the browser

- **Decision.** V8 coverage is collected during the Playwright run
  (`tests/fixtures.js`), merged by `scripts/coverage.mjs`, and gated at 100%
  of code and functions.
- **Why.** The page under test is the page that ships: there is no
  instrumentation step that could differ from production.

## D7. TypeScript: not now

- **Decision.** No TypeScript for now.
- **Why.** A TS source would need a build step for GitHub Pages, which the
  project avoids (D3). For the pure modules, JSDoc types checked by
  `tsc --checkJs` in CI would add type safety with no build.
- **Adopt it when** a pure module grows enough that a type error would plausibly
  ship. Until then the unit tests and the 100% coverage gate carry that load.

## D8. Deploy in two jobs

- **Decision.** One job builds and uploads the Pages artifact; a separate job
  publishes it.
- **Why.** Run in a single job, `deploy-pages` raced the upload: it found no
  artifact, then two on the re-run. Two jobs is also what GitHub's own Pages
  workflow does.
