# 011. Pointer response

**Status:** implemented · **Roadmap:** phase 10

## Problem

Ana's review: the page feels static. The cover cards lift on hover, but
nothing answers where the pointer actually is. Answers to a question appear
all at once, as a block.

## Scope

- **The cover cards lean toward the pointer.** A gentle 3D tilt of at most
  4.5° each way, on top of the existing lift.
- **A project row glows under the pointer.** A soft radial light that
  follows the pointer inside the row, like the fireflies.
- **Answers write in.** The sources of an answer arrive one after another,
  110 ms apart.
- **Who gets what.**
  - Tilt and glow only for a mouse or trackpad
    (`(hover: hover) and (pointer: fine)`). Touch gets nothing, so a tap
    never leaves a card tilted.
  - Under reduced motion, nothing tilts, glows or writes in.
- **The script measures and the CSS moves.** `app.js` only writes the
  pointer position into custom properties. Transforms stay in CSS.

## Out of scope

Magnetic buttons and a custom cursor. Both read as gimmicks next to a CV,
and a custom cursor costs accessibility.

## Risks

- **Motion sickness.** Mitigation: small angles, and reduced motion turns it
  all off.
- **Layout shift.** Mitigation: transforms only. The cover's layout test
  measures boxes before and during hover.
- **Contrast while an answer writes in.** Mitigation: it finishes within
  0.7 s, and axe runs after that.

## Acceptance criteria

1. With a mouse, hovering a card's right side tilts it toward the right.
   Leaving clears the tilt.
2. With a mouse, moving over a project row lights it where the pointer is.
3. On touch, and under reduced motion, nothing tilts or glows.
4. The sources of an answer arrive in order. Under reduced motion they
   appear at once.
5. axe passes. Coverage stays at 100%, and Lighthouse stays at 100.
