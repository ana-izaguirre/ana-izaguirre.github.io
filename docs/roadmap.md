# Roadmap

The experiences Ana asked for, ordered by impact on the person reading the
page (a recruiter or a hiring engineer), against risk and effort. One phase
equals one spec, one PR, green CI and a verified deploy. References: ar2design
(editorial cadence, numbered navigation), janneparri (site controls as play,
metrics on every project, honest "good fit / bad fit").

| # | Phase | Impact | Risk | Effort | Status |
|---|---|---|---|---|---|
| 0 | `AGENTS.md`, decisions, roadmap, English comments | Foundation | Low | S | Done |
| 1 | Search decoupled from the DOM, unit-tested, validated | High for reviewers | Low | M | Done (spec 001) |
| 2 | Projects as case studies | **Highest** for recruiters | Medium (must not invent) | M | Done (spec 002) |
| 3 | Ask my CV: query modes and visible evidence | High | Low | M | Modes and evidence done (spec 003); case search and synonym tuning next |
| 4 | Exploratory cover: hover changes the scene and message | Medium-high, memorable | Medium (CLS, performance) | M | Planned |
| 5 | The Curiosity Switch: recruiter / engineer perspective | High, signature feature | Medium | M-L | Planned |
| 6 | Interactive diagrams in the case studies | Medium | Low | M | Planned |
| 7 | Small lessons: code, simulation, feedback | Medium | High (scope) | L | Later |
| 8 | Editorial navigation, deliberate micro-animations | Medium | Low | S-M | With 4-6 |

## Why this order

- **1 before 3.** Query modes and evidence need the search to be a module with
  a clear contract. Built on the DOM-coupled version, they would add risk to
  every later change.
- **2 early.** It is the strongest evidence of seniority, and the material is
  real: the repositories document their decisions (trainer-flow's state
  machine and `AIProvider` boundary, latino-migra's rules-only access model,
  mcp-docs-search's FTS5 choice). The risk is inventing results; every claim
  must cite a repo.
- **4 and 5 after content.** A memorable shell around thin content reads as
  decoration. With case studies and evidence in place, the switch has
  something real to switch between: the story for a recruiter, how it is
  built for an engineer.
- **7 last.** Lessons are the easiest to over-build. They earn a place only if
  each one teaches something Ana actually does, such as BM25 scoring or
  idempotent consumers.

## Out of scope

Frameworks, a build step, CMS or backend, analytics, AI-generated answers
(the search must keep citing, never generating), and rebuilding the visual
identity.
