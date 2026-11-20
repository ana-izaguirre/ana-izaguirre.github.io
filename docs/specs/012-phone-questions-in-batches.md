# 012. On phones, the questions come in batches

**Status:** implemented · **Roadmap:** phase 14 (revision)

## Problem

Spec 008 put the twelve suggested questions in a sideways-scrolling row.
Ana's review: on a phone the questions do not read well, and sideways
scrolling is not the experience she wants. She asked for something more
engaging, in the spirit of lazy loading.

## Scope

- **Phones (≤ 680 px):** the questions stack, one per line, and only the
  first four show.
- **"More questions +8"** sits under them. Each tap brings in the next four,
  one after another (70 ms apart), and moves the focus to the first new
  question, so keyboard and screen-reader users land on what appeared. The
  count goes down, and at twelve the button disappears.
- **The state lives in markup.** `data-shown` is set in the HTML and the CSS
  hides the rest, so the first frame is already right, before `app.js`.
- **Wider screens** show all twelve and never see the button.
- **No sideways scrolling** anywhere.

## Out of scope

Revealing on scroll. New questions arriving above the answer while the
reader scrolls toward it would push the answer away.

## Acceptance criteria

1. On a phone, four questions show at first. Two taps show eight, then
   twelve, and then the button is gone.
2. Focus goes to the first question of each new batch, and the batch
   animates in order.
3. On a desktop, all twelve show and the button does not.
4. Both languages. axe passes, coverage stays at 100%, and Lighthouse stays
   at 100.
