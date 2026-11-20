# 002. Projects as case studies

**Status:** implemented · **Roadmap:** phase 2

## Problem

Each project is a two-line summary and a few tags. That is enough for a
recruiter skimming, but not for an engineer deciding whether Ana makes good
calls, and a senior engineer is hired for her calls.

## Scope

- Under each project, a native `<details>` element ("See the case") with five
  parts, always in this order:
  1. Problem
  2. Decisions
  3. Architecture
  4. Trade-offs
  5. Results
- **Sources.** Every claim comes from the project's own repository, and each
  case links to the documents it draws on: trainer-flow's ADRs and risk
  register, mcp-docs-search's README and evals, and latino-migra's README and
  rules. Results are stated as the repository states them, including the
  unflattering ones (recall@1 0.30, coverage 65%).
- **Languages.** Spanish is in the markup; English is in `app.js`'s
  dictionary.
- **Styling.** The cases use the existing paper and stitch styling, and a
  small opening animation that `prefers-reduced-motion` turns off.
- **Placement.** Screen only: the PDF stays one page. Each case sits outside
  its `[data-chunk]` block, so the search results stay the same; making the
  cases searchable is phase 3.

## Out of scope

Diagrams, which are phase 6, and anything not documented in a repository.

## Risks

- **Inventing or inflating.** Mitigation: every sentence maps to a repo
  document, and "measured" is never written as "enforced". For example,
  trainer-flow's mutation score is measured with Stryker without a CI
  threshold, so the case says "measured".
- **Length.** A case that scrolls forever loses the skimmer. Mitigation:
  closed by default, one to three short lines per part.

## Acceptance criteria

1. Three cases, each with the five parts in order, in Spanish and English.
2. Each case links to its sources in the project's repository.
3. Cases open and close with the keyboard. axe passes, and the layout tests
   pass at six sizes.
4. Not printed: the PDF stays one page.
5. The golden search file is unchanged, coverage stays at 100%, and
   Lighthouse stays at 100.
