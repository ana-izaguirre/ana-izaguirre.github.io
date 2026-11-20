# 021. Case parts unfold in sequence

**Status:** implemented · **Roadmap:** phase 11

## Problem

Opening a case study shows all five parts at once, as one block of text.
Ana's review asked for transitions with intent. A case reads in order
(problem, decisions, architecture, trade-offs, results), so it can arrive
in that order.

## Scope

- When a case opens, each heading and its text rise into place one after
  another, 55 ms apart, in reading order. The whole case is in place in
  under a second.
- **CSS only:** `nth-child` delays on the case body's children. No script.
- **Reduced motion, or the motion switch off** (spec 019): everything
  appears at once.
- **The Curiosity Switch** (spec 006) still hides the parts it hides; the
  rest keep their order.

## Acceptance criteria

1. In an opened case, every part animates, the delays never go down, and
   the last part ends opaque.
2. Under reduced motion, nothing animates.
3. axe passes, coverage stays at 100%, and Lighthouse stays at 100.
