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
| 3 | Ask my CV: query modes and visible evidence | High | Low | M | Done (specs 003, 005) |
| 4 | Exploratory cover: hover changes the scene and message | Medium-high, memorable | Medium (CLS, performance) | M | Done (spec 004) |
| 5 | The Curiosity Switch: recruiter / engineer perspective | High, signature feature | Medium | M-L | Done (spec 006) |
| 6 | Interactive diagrams in the case studies | Medium | Low | M | Planned |
| 7 | Small lessons: code, simulation, feedback | Medium | High (scope) | L | Later |
| 8 | Editorial navigation, deliberate micro-animations | Medium | Low | S-M | With 4-6 |
| 9 | Motion on scroll: sections reveal, cover parallax, reading progress | **High**: the page reads as static | Medium (CLS, performance) | M | Next |
| 10 | Pointer response: gentle tilt on cards and projects, answers that write in | Medium | Medium (motion sickness) | M | Planned |
| 11 | Transitions with intent: case parts unfold in sequence, figures count up | Medium | Low | S-M | Planned |
| 12 | A clear call to action: hire / contact, visible without hunting | **High** for recruiters | Low | S | Done (spec 009) |
| 13 | Fireflies that drift on phones, as on desktop | Medium | Low | S | Done (spec 007) |
| 14 | On phones, "Ask my CV" sits with the suggested questions, one place | Medium | Low | S | Done (specs 008, 012) |
| 15 | Entering the page: always at the top, the story at its first scene, everything collapsed | High (first impression) | Low | S | Next |
| 16 | Fireflies scaled to the screen: clearly flying on phones, unchanged on desktop | Medium | Low | S | Next |
| 17 | Who she is in one screen: availability badge in the bar, a value-proposition headline, the companies she shipped for | **High** for recruiters | Low | S-M | Planned |
| 18 | Metric-led project cards: three figures per project, from each repository | High | Low (must cite) | S | Planned |
| 19 | Site controls as play: a motion on/off switch next to theme and language | Medium | Low | S | Planned |
| 20 | Hover easter eggs: "Honduras" and "Zaragoza" reveal a small picture | Low-medium, memorable | Low | S | Planned |
| 21 | Short FAQ for recruiters: start date, remote, English, contract | Medium | Low | S | Planned |
| 22 | Good fit / bad fit, in Ana's own words | High, distinctive | Needs Ana: not to be invented | S | Needs Ana |

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

- **9 to 11 after Ana's review (2026-11-20).** The page reads as static
  next to the references: below the cover, nothing moves. Each phase
  animates only `transform` and `opacity`, prefers CSS scroll timelines, and
  stands still under `prefers-reduced-motion`. Pointer effects never run on
  touch.
- **12 to 14 from the same review.** There is no call to action, the
  fireflies look still on a phone, and on a phone the question box is apart
  from its suggested questions.

- **15 and 16 from Ana's review (2026-11-20, second pass).** A visitor
  should always enter at the top, with the story at its start, and the
  fireflies' fix must not change how they look on a desktop: behaviour
  scales with the screen.
- **17 to 22 from janneparri.com, which presents the developer in one
  screen.** It has an availability badge and a value proposition up top, a
  "trusted by" row, metrics on every project card, site controls as play,
  playful hover details, an FAQ and honest good-fit/bad-fit lists. Each is
  adapted only with Ana's real facts. Good fit / bad fit needs her own
  words, and testimonials stay out until real ones exist.

## Out of scope

Frameworks, a build step, CMS or backend, analytics, AI-generated answers
(the search must keep citing, never generating), and rebuilding the visual
identity.
