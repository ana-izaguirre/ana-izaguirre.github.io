# 013. Every visit starts at the start

**Status:** implemented · **Roadmap:** phase 15

## Problem

Ana's review: when you enter the page, the career timeline should be at its
start, and everything should be collapsed. Two causes, both measured:

1. **The story played on the cover, where nobody saw it.** Autoplay started
   on load. By the time a visitor scrolled down, it had walked all seven
   scenes and sat at the last one ("Career break"). With `?quiet`, the
   resting state was the last scene too.
2. **A reload kept the scroll position.** The browser restored it, so a
   visitor could re-enter halfway down the page.

## Scope

- **The story rests at scene 1, step 1.** It starts playing once, when it is
  at least 45% in view. If the visitor already moved it by hand, it does not
  take over. Under reduced motion it never plays on its own.
- **Every visit starts at the top.** `history.scrollRestoration = 'manual'`
  is set in the first-frame script. A shared `#link` still lands where it
  points.
- **Collapsed by default.** Case studies are closed, and on phones the
  questions show four at a time (spec 012). The play button says "Play",
  not "Replay".

## Out of scope

The sample answer under "What my CV says". It shows what the search does
before anyone asks. Whether it should stay is Ana's call.

## Acceptance criteria

1. Two minutes on the cover leave the story at 1/4 · 1/7.
2. Scrolling the story into view starts it, and it walks to the end.
3. A reload after scrolling lands at the top.
4. No `<details>` is open on arrival. Coverage stays at 100%, and Lighthouse
   stays at 100.
