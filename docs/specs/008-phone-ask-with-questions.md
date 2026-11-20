# 008. On phones, the question box sits with its questions

**Status:** implemented · **Roadmap:** phase 14

## Problem

On a phone, the "Ask my CV" box sits on the cover, and its twelve suggested
questions sit more than a screen and a half further down. They stack one
under another, 655 px tall, below the answer. On a phone, asking and choosing
a question are two separate places.

## Scope

- **Phones (≤ 680 px):** the one question box moves into the question
  section. Order: the box, then the suggested questions in one swipeable row,
  then the search modes and the answer.
- **Still one box (D5).** The same element moves; nothing is duplicated.
  Turning a tablet or resizing a window moves it back.
- **"Ask something else"** brings the box into view on a phone. Elsewhere it
  still scrolls to the top.
- **Desktop and tablet** are unchanged.

## Risks

- **Layout shift.** The box moves after the first frame. Mitigation: on a
  phone it sits below the fold, Lighthouse must keep CLS at 0, and the layout
  tests check for horizontal overflow.
- **A row nobody knows scrolls.** Mitigation: the next question peeks in from
  the right edge.

## Acceptance criteria

1. On a phone, there is one box, inside the question section, before the
   questions. The questions are on one row, and the page does not scroll
   sideways.
2. On a desktop, the box stays on the cover. Resizing moves it either way.
3. On a phone, "Ask something else" shows the box and focuses it.
4. axe passes, coverage stays at 100%, and Lighthouse stays at 100 with
   CLS at 0.
