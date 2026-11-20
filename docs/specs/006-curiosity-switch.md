# 006. The Curiosity Switch

**Status:** implemented · **Roadmap:** phase 5

## Problem

Two kinds of reader reach the projects, and they want different things from
them. Someone hiring wants to know what problem a project solved and what came
of it. Someone who programs wants the decisions, the architecture and the
trade-offs. Each case study gives both readers all five parts, so the hiring
reader has to dig for the two parts they want.

## Scope

- **One switch, above the projects:** "Read it as: Hiring · Engineering".
  Native radios, styled like the search modes, so arrow keys, focus and screen
  readers work without script.
- **Hiring** shows each case's Problem and Results. The summary hint says so
  ("problem and results").
- **Engineering** (the default) shows all five parts, exactly as today.
- **No new content.** The switch only chooses among parts that already exist.
  Nothing is written for one reader that the other cannot see.
- **CSS only.** `:has()` on the checked radio hides the Decisions,
  Architecture and Trade-offs parts (`data-deep`). There is no script in the
  switch itself.
- **Search still reaches everything.** If "See it" points at a part the
  current view hides, the page switches to Engineering first, then opens the
  case and scrolls to it.
- **Both languages.** Spanish is in the markup, English is in `app.js`.

## Out of scope

- Remembering the choice between visits.
- Changing anything outside the case studies.
- Diagrams, which are phase 6.

## Risks

- **A reader misses the depth.** Mitigation: Engineering is the default, and
  the Hiring view's hint says what is left out.
- **Search cites a hidden line.** Mitigation: "See it" switches the view
  first, and an E2E test covers it.
- **Layout shift on the first frame.** Mitigation: the switch is static
  markup in place from the start, and the layout tests run at six sizes.

## Acceptance criteria

1. By default, all five parts show. In Hiring, only Problem and Results show,
   and the hint changes to match.
2. The arrow keys move between the two views.
3. From Hiring, "See it" on a decisions line switches to Engineering and
   shows that line.
4. Both languages and both themes pass axe. Coverage stays at 100%, and
   Lighthouse stays at 100.
