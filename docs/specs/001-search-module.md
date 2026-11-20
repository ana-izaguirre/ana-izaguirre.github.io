# 001. Search as a pure, tested module

**Status:** implemented · **Roadmap:** phase 1

## Problem

The BM25 search in `app.js` reads the DOM while it ranks: it pulls
`textContent` out of elements, and its results carry elements around. Its
logic cannot be tested without a browser, it does not validate its input, and
the next phase (query modes and visible evidence) would have to grow inside
that coupling.

## Scope

- `js/search.mjs` is an ES module with no DOM access. It holds the tokenizer
  (normalization, stopwords, light stemming), the synonym groups, BM25 with
  section boosts, passage selection, and highlight matching.
- **Contract.** `createIndex(docs, options)` takes plain
  `{id, section, text, lines: [{text}]}` objects. `search(index, query)`
  returns ids and line positions, plus, for each hit, the query terms it
  matched (evidence for phase 3).
- **Validation.** Malformed docs or a non-string query throw a `TypeError`
  with a message saying what was wrong. An empty query, or one made only of
  stopwords, returns no hits instead of throwing.
- **Adapter.** `app.js` becomes an adapter: it builds docs from
  `[data-chunk]`, maps ids back to elements, and keeps every visible
  behaviour.
- **Loading.** `app.js` loads as a module (`type="module"`), still after
  the first frame (D2).
- **Tests.** Unit tests in `tests/unit/` run with `node --test`, with no
  dependencies. Coverage merges V8 data from Node and from the browser, so
  branches reached only by unit tests count, and the gate stays at 100%.

## Out of scope

Query modes, the evidence UI and new synonyms are phase 3. No ranking
changes: the same queries must return the same passages.

## Risks

- **Ranking drift.** Mitigation: a golden test pins today's top results for
  every suggested question, in both languages, before the refactor.
- **Module loading changes timing or strict-mode behaviour.** Mitigation: the
  full E2E and first-paint suites, plus Lighthouse.
- **Playwright picking up the Node tests.** Mitigation: `testIgnore` for
  `tests/unit`.

## Acceptance criteria

1. `js/search.mjs` has no reference to `document`, `window` or `Element`.
2. The golden results are identical before and after.
3. `npm run test:unit` passes and covers tokenization, synonyms, BM25 order,
   boosts, the cutoff and limit, line selection, validation errors and empty
   queries.
4. The whole Playwright suite passes, coverage stays at 100% with Node and
   browser data merged, and Lighthouse stays at 100 on mobile and desktop.
