# 023. Flags on the signs

**Status:** implemented · **Roadmap:** phase 20

## Problem

janneparri.com hides small surprises behind hover, such as pictures that
appear over the word "Finland". They make a page feel made by a person.
The cover here already has the two places of Ana's story on signs
(Honduras, Zaragoza), but they do nothing.

## Scope

- **Hovering a sign raises its flag** on a little pole: Honduras, and Aragón
  for Zaragoza. The flag waves while the pointer stays. Both are drawn as
  inline SVG: no images, no requests.
- **Decoration only.** The signs are already `aria-hidden`, and so are the
  flags. Nothing is said that the page does not already say.
- **Pointer devices only** (`(hover: hover)`). On touch the signs stay plain
  signs. Under reduced motion or with the motion switch off, the flag
  appears without waving.

## Acceptance criteria

1. Hovering each sign shows its flag. Leaving hides it.
2. On a touch device the flag never shows.
3. axe passes, coverage stays at 100%, and Lighthouse stays at 100.
