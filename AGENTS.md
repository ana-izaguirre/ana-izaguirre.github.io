# AGENTS.md

Permanent instructions for anyone, human or AI, changing this repository.
How the system works lives in `docs/`; this file holds the rules.

## What this is

Ana Izaguirre's portfolio and CV: one static page on GitHub Pages, no build
step, no runtime dependencies. It has to work as a portfolio and also be
evidence of how she engineers. A shortcut that would embarrass a senior
reviewer reading the source is a bug.

## Non-negotiables

1. **Never invent experience.** Every claim on the page must be backed by the
   CV content in `index.html`, by a public repository, or by Ana directly. The
   May 2025 to present gap is a parenting career break and is shown as such.
2. **Lighthouse 100** in all four categories, on mobile and desktop. The CI
   gate enforces floors; anything below 100 locally gets investigated
   before it is merged.
3. **Accessibility.** axe-core reports zero violations, everything works from
   the keyboard, and `prefers-reduced-motion` stops all motion.
4. **Both languages, both themes.** Every visible string exists in Spanish
   and English, and every surface works in light and dark.
5. **No frameworks, no runtime dependencies, no external requests.**
   `package.json` holds test tooling only.
6. **The first frame stands on its own.** The script loads after the first
   paint (see `docs/decisions.md`, D2). Anything on the first screen must be
   correct without it: language, theme, layout. Nothing may shift when the
   script arrives; `tests/first-paint.spec.js` guards this.
7. **Language of artefacts.**
   - Code comments, commit messages, PRs, specs and docs: English.
   - Spanish only in `README.es.md` and in the Spanish UI copy.
   - Visitor-facing text is bilingual, as in rule 4.

## Workflow

Lightweight spec-driven development:

1. For any change bigger than a fix, write `docs/specs/NNN-short-name.md`
   first: problem, scope, out of scope, risks, acceptance criteria. Keep it
   short.
2. Branch from the latest `origin/main`, one branch and one PR per unit of
   work. Do not stack unrelated changes on a branch that already has a PR.
3. Make atomic conventional commits (`feat(scope): …`, `fix`, `perf`,
   `refactor`, `test`, `docs`, `ci`, `chore`), authored as
   `Ana Izaguirre <ana.cimatamoros@gmail.com>`. No AI attribution trailers.
4. Open a PR and watch CI until it is green. If it fails, find the cause,
   fix it on the same branch and watch again. Merge only when it is green,
   then confirm the deploy succeeded.
5. Update the spec's status, `docs/roadmap.md`, and the READMEs if the change
   made them inaccurate.

## Testing

- `npm test` runs Playwright: journeys, layout at six sizes, axe, and first
  paint.
- `npm run test:unit` runs Node's built-in test runner over the pure modules
  in `js/`, with no dependencies.
- `npm run coverage` reports V8 coverage of the page's own JavaScript. The gate
  is 100% of code and functions, browser and Node data merged. It is a ratchet: write the test, or delete
  the dead code it exposes; never lower the minimum.
- `npm run lighthouse` runs the Lighthouse gate.
- **A test must prove its own premise.** Break the fix and watch the test
  fail before keeping it. Assert the preconditions you set up, such as an
  intercepted request, a mocked clock or a blocked script.
- Never make a branch depend on machine speed. Drive the clock
  (`page.clock`, a stubbed `performance.now`) instead.
- Timing-sensitive specs live in their own file with `trace: 'off'`, because
  recording a trace forces frames.

## Architecture in one screen

| Piece | Where | Notes |
|---|---|---|
| Markup, critical CSS | `index.html` | CSS stays inline on purpose (D1) |
| First-frame script | inline in `index.html` | theme, language, cover translation (`EN_TOP`) |
| Page logic | `app.js` | requested after the first frame (D2) |
| Pure modules | `js/*.mjs` | no DOM access; unit-tested in Node (D9) |
| Landscape | `tools/scene.py` → `index.html` | generated; edit the generator, not the SVG |
| CV content | `index.html` | Spanish in the markup, English in `app.js` |
| Print and PDF | print rules in `index.html` | `.cv-only` is hidden on screen, printed in the PDF |

## Pitfalls that already happened

- Reads and writes of layout interleaved in a loop force a layout each time.
  Batch the reads first, then the writes.
- A rule later in the file wins: `.sh{display:flex}` beat a screen-only
  `display:none` until it got `!important`.
- `display:revert` in print undoes author styles too; scope with
  `@media screen` instead.
- A deploy that uploads and publishes the Pages artifact in the same job
  races; build and deploy are separate jobs.
- A coverage branch can depend on how fast the CI runner is. Pin both sides
  with a test.
- A ranking change must be deliberate: `tests/golden/search.json` pins the
  results; regenerate it and review its diff in the same PR.

## Commands

```bash
python3 -m http.server 8000              # serve locally
npm test                                 # Playwright (needs the server or starts one)
npm run test:unit                        # pure modules, Node only
npm run coverage                         # after npm test
CHROME_PATH=… LH_RUNS=3 npm run lighthouse
python3 tools/scene.py                   # regenerate the landscape
python3 tools/font-fallback.py           # recompute the fallback-font metrics
```
