# 010. Motion on scroll

**Status:** implemented · **Roadmap:** phase 9

## Problem

Ana's review: next to the reference portfolios, the page reads as static.
The cover is alive (landscape, fireflies, the light that follows the cards),
but below it nothing moves. Scrolling is a page of still paper.

## Scope

- **Reading progress.** A thin line under the bar fills as the page is read.
- **Leaving the cover.** The landscape sinks slower than the page and the
  words lift away faster, a two-layer parallax. Movement only: no fading,
  so contrast holds wherever the cover is. Not on phones, where the
  landscape is a band in the flow and sinking would cover the cards.
- **Arriving content.** Each piece rises into place as it enters, then
  stays put:
  - the career card;
  - the question header and the suggested questions;
  - the CV headings, paragraphs, rows and cases;
  - the closing card.
- **The stitched rule** under the question header draws itself across.
- **CSS only.** Scroll-driven animations (`animation-timeline: view()`,
  `scroll()`) run on the compositor, with no script and no observers. Only
  `transform` and `opacity` change.
- **Graceful everywhere.** Without support (Safari and Firefox today), with
  reduced motion, or on paper (`@media screen`), nothing animates and all
  content is fully visible.

## Out of scope

Pointer effects (phase 10), sequenced case parts and counters (phase 11),
and anything that needs JavaScript.

## Risks

- **Hidden content.** Mitigation: content is fully visible without support,
  and it is fully visible once entered. Tests check both ends.
- **Measurements shift.** Mitigation: the cover sits at its resting place at
  the top, so the first-paint and layout tests measure it unchanged.
- **The flash highlight is lost.** Mitigation: the arriving animation skips
  `.flash`, so "See it" still highlights.
- **Contrast.** A fading cover failed axe once scrolled away, so the cover
  only moves.

## Acceptance criteria

1. The progress line is empty at the top and full at the bottom.
2. A CV row below the fold starts transparent and lower, and once in view it
   is opaque and in place.
3. Under reduced motion, and when printed, no row animates and every row is
   opaque.
4. axe passes in both themes. Coverage stays at 100%, and Lighthouse stays
   at 100 with CLS at 0.
