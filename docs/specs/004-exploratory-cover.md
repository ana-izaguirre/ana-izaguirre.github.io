# 004. Exploratory cover

**Status:** implemented · **Roadmap:** phase 4

## Problem

The cover's three cards ("My journey", "Projects", "About me") are links and
nothing more. The landscape behind them tells the Honduras-to-Zaragoza story,
but nothing ties a card to its part of that story. The cover reads as a
picture with buttons on it, not as something to explore.

## Scope

- **The light follows intent.** Hovering a card, or focusing it from the
  keyboard, moves a soft light over the landscape to what the card is about:
  "My journey" lights Honduras, where it started; "Projects" lights Zaragoza
  and the basilica; "About me" lights the family. The rest dims a little.
  - One extra layer, moved with `transform`, so it is composited and never
    repaints the SVG. `pointer-events: none` and absolutely positioned, so it
    cannot shift layout.
- **The message changes.** A short line over the landscape changes with the
  card. It is decoration (`aria-hidden`): the card already carries the
  information, so a screen reader misses nothing. Every message is a fact
  already on the page.
- **Pointers and keyboard.** Hover counts only where the device can hover
  (`(hover: hover)`), so a tap on a phone simply follows the link. Focus
  works everywhere. `prefers-reduced-motion` keeps the change but removes the
  transition.

## Out of scope

- Moving the cards.
- Per-card scene art.
- Anything on the first frame: the light starts hidden.

## Risks

- **Performance.** Mitigation: only `transform` and `opacity` change, and
  Lighthouse must stay at 100.
- **Layout shift.** Mitigation: an absolutely positioned layer inside the
  world, and a test asserts that the cover's boxes do not move on hover.
- **Contrast of the message over the landscape.** Mitigation: the text sits
  on its own soft backing, and axe must pass in both themes.

## Acceptance criteria

1. Hovering or focusing each card sets its focus on the cover and shows its
   message. Leaving clears both.
2. The light layer is moved only by `transform`. Nothing on the cover moves
   (boxes are identical before and during hover).
3. Without hover (a touch device), a tap does not leave a focus state behind.
4. Both languages, both themes, axe clean. Coverage stays at 100%, and
   Lighthouse stays at 100.
