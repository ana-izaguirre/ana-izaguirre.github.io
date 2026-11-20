# 017. A stat row under the cover

**Status:** implemented · **Roadmap:** phase 24 (with phase 11)

## Problem

ar2design.com puts four large figures under its statement. Here the same
figures exist (companies, technologies, own projects), but only at the very
end of the career story, after seven scenes.

## Scope

- **Four figures**, at the top of the "Has worked at" band:
  - 8+ years in production, from the cover's lead;
  - 6 companies, 25 technologies and 3 own projects, the story's own
    totals at its last scene. A test keeps them equal.
- **They count up as they come into view.** A registered `--n` animates
  from 0 to each figure on a `view()` timeline, and a CSS counter draws it.
  No script.
- **Accessible and graceful.**
  - The real figure stays in the text. It is visually hidden only where the
    counter runs, and the counter's content has empty alt text, so a screen
    reader reads each figure once.
  - Without scroll-driven animations, with reduced motion, or in print, the
    plain figure is all there is.
- **A fix found on the way.** The band was `overflow: hidden`, which made it
  a scroll container: every `view()` timeline inside it measured against the
  band, not the page, and sat at its end. It is now `overflow: clip`.

## Acceptance criteria

1. The four figures read 8+, 6, 25 and 3, and the last three equal the
   story's counters at its last scene.
2. Partly in view, a figure shows less than its value. Fully in view, it
   shows its value.
3. Under reduced motion, the plain figures show and nothing counts.
4. Both languages. axe passes, coverage stays at 100%, and Lighthouse stays
   at 100.
