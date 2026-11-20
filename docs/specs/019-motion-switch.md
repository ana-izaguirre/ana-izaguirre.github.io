# 019. A motion switch

**Status:** implemented · **Roadmap:** phase 19

## Problem

The page now moves a lot: fireflies, the cover parallax, arriving content,
the band of companies, counting figures. Visitors whose system asks for
reduced motion already get a still page. Everyone else has no way to stop
it. janneparri.com puts a motion switch next to the theme: a site control
offered as part of the experience, not buried in settings.

## Scope

- **A button in the bar**, next to the theme: two waves, crossed out when
  off. `aria-pressed` says whether motion is on, and the label is
  "Movimiento" / "Motion" from the first frame.
- **Off behaves like reduced motion.**
  - Every CSS animation and transition stops, scroll-driven ones included.
  - The fireflies land: their flights pause where they are.
  - The story stops.
  - Jumps around the page become instant.
  - The companies band wraps, standing still. The figures show plainly.
- **On again**, the fireflies resume and the CSS motion returns.
- **Remembered** in `localStorage` and applied before the first frame,
  exactly like the theme.
- **Not shown when the system already asks for reduced motion**, since
  there is nothing to switch.

## Out of scope

Sound, and a layout switch.

## Acceptance criteria

1. Off: the button is unpressed, `data-motion="off"`, no element runs a CSS
   animation, and every firefly's flight is paused. On again: they run.
2. The choice survives a reload, and the page starts still.
3. Under the system's reduced motion, the button is hidden.
4. The label reads "Motion" in English before `app.js` runs. Coverage stays
   at 100%, and Lighthouse stays at 100.
