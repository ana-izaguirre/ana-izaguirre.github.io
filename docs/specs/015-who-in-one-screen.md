# 015. Who she is in one screen

**Status:** implemented · **Roadmap:** phase 17

## Problem

Ana pointed to janneparri.com and ar2design.com: both say who the person is,
whether they are available, and who they have worked for, before any
scrolling. Here the facts are on the cover ("Available immediately" among
four plain chips), but nothing signals them, and the companies only appear
inside the story or the CV.

## Scope

- **Availability as a live signal.** The "Available immediately" chip gets a
  small pulsing green dot. It is the same text and fact, just marked as
  current.
- **"Has worked at" band**, right under the cover: the six companies from
  the CV, in its own order (Allergan Data Labs (AbbVie), Intel, AutoFi,
  Laureate Education, Agile Solutions, INFOP), passing by slowly, like a
  studio's client wall.
  - CSS only: two copies of the list move together for a seamless loop. The
    second copy is `aria-hidden`, so a screen reader hears each name once.
  - It pauses under the pointer.
  - Under reduced motion it stands still, wrapped, with every name in view.
  - It sits above the cover's sinking landscape (spec 010).
- **No logos.** They are trademarks and would add weight. The names are set
  in the page's serif.

## Out of scope

Pricing, testimonials, and good fit / bad fit (phase 22, which needs Ana's
own words).

## Acceptance criteria

1. The band lists the six companies once for assistive technology, and it
   moves.
2. Under reduced motion it does not move, the copy is gone, and all six
   names are inside the viewport.
3. The availability chip pulses, but not under reduced motion.
4. Both languages and themes, axe clean. Coverage stays at 100%, and
   Lighthouse stays at 100.
