# 018. Metric-led project cards

**Status:** implemented · **Roadmap:** phase 18

## Problem

janneparri.com leads every project card with figures (weeks to launch,
Lighthouse score, components). Here the figures that prove the projects'
quality exist, but they are buried in the case studies, behind "See the
case".

## Scope

- **Three figures per project**, under its summary and above "See the case".
  Every figure is already stated in that project's case study, which cites
  its repository:
  - **trainer-flow:** 100% coverage required on the critical modules; 100%
    nightly mutation, file by file, on the non-negotiable ones; 0 AI rows
    after the E2E that runs the product without AI.
  - **mcp-docs-search:** recall@3 0.44 over 50 questions without the corpus
    vocabulary; 50 evaluation questions, each change judged with McNemar's
    test; 1 runtime dependency.
  - **latino-migra:** 65% coverage as a ratchet; 0 data in the browser once
    signed in; 1 access control, the Firestore rules.
- **Honest figures.** The modest ones (0.44, 65%) are shown as they are,
  with what they measure.
- **Not indexed or printed.** The metrics sit outside the searchable rows,
  so search results do not move, and they are screen only, so the PDF stays
  one page.
- **Both languages**, with number formats per language: 0,44 and 65 % in
  Spanish, 0.44 and 65% in English.

## Acceptance criteria

1. Each project shows three figures with labels, in both languages.
2. Every figure appears in the text of the same project's case study.
3. The search golden file is unchanged, and the PDF stays one page.
4. axe passes, the layout tests pass, coverage stays at 100%, and
   Lighthouse stays at 100.
