# 025. Motion on phones

**Status:** implemented · **Roadmap:** phases 9 and 10 (revision)

## Problem

Ana's review on her phone: nothing moves when she scrolls, and nothing
answers when she taps a card or a button.

1. **Scrolling.** The motion of spec 010 uses CSS scroll-driven animations.
   Safari, every browser on iPhone, and Firefox do not support them yet. As
   designed, they fell back to a still page, so on an iPhone nothing below
   the cover moves.
2. **Tapping.** The pointer response of spec 011 is for a mouse. Touch had no
   feedback at all, and iOS does not show `:active` unless the page listens
   to touches.

## Scope

- **A fallback where scroll-driven animations are missing**
  (`CSS.supports('animation-timeline: view()')` is false):
  - an `IntersectionObserver` marks content `.seen` as it arrives, and CSS
    raises it into place with a transition. It covers the same elements as
    spec 010, plus the companies card;
  - a passive scroll listener writes the reading progress into `--read`,
    which draws the line under the bar;
  - the figures count up once, when they come into view.
  Where the CSS version runs (Chromium), the fallback does not.
- **Touch feedback:** cards press in to 97%, and buttons, pills and
  questions to 94%, with a small spring. A no-op `touchstart` listener lets
  iOS show `:active`.
- **Still respected:** reduced motion and the motion switch. Nothing waits
  hidden when motion is off.

## Acceptance criteria

1. With scroll-driven animations reported missing, a row below the fold is
   not marked until it scrolls into view. The reading progress follows the
   scroll, and the figures end at 8+, 6, 25, 3.
2. Under reduced motion, the fallback does not run. In Chromium it does not
   run either.
3. On a touch device, a card, a pill and a question press in under the
   finger.
4. Coverage stays at 100%, and Lighthouse stays at 100.
