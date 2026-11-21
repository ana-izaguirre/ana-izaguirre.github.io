# 026. The motion switch on every phone

**Status:** implemented · **Roadmap:** phase 19 (revision)

## Problem

Ana's review: on her phone the motion switch does not appear, and nothing
moves. That is spec 019 working as written. When the system asks for
reduced motion, the button was hidden and every animation stopped. Many
phones ask for it without the owner knowing: battery saver modes often
switch it on. So she had a still page and no way out.

## Scope

- **The switch is always there.** The system's reduced motion is now the
  *default*, not a lock.
  - A phone that asks for it starts still, with the button showing motion
    off.
  - A tap turns everything on: fireflies, scroll motion, the companies band,
    touch feedback.
  - A saved choice ("on" or "off") wins over the system on the next visit.
- **One source of truth.** The first-frame script sets `data-motion` to
  `on` or `off` (saved choice, else the system), and all CSS and script
  read only that. The `prefers-reduced-motion` media gates are gone.
- **Still the accessible default.** Nobody who asked for less motion gets
  motion unless they turn it on themselves.

## Acceptance criteria

1. Under the system's reduced motion, the button is visible and unpressed,
   and the page is still: flights paused, no CSS animation running.
2. Pressing it starts the fireflies and the CSS motion. After a reload, the
   choice still wins.
3. Without reduced motion, nothing changes from spec 019. Coverage stays at
   100%, and Lighthouse stays at 100.
