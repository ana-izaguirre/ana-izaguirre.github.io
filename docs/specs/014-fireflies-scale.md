# 014. Fireflies scaled to the screen

**Status:** implemented · **Roadmap:** phase 16

## Problem

After spec 007 the fireflies fly on iPhone, but Ana still saw them as still
on her phone. They also flaked a test under load. On a phone they flew
70 px each way over 9–15 s, about 10 px a second. In a band about 300 px
tall on a small screen, that reads as standing still. Ana also asked that
the fix not make the desktop look odd: the behaviour must depend on the
screen size.

## Scope

- **One table, two flights**, chosen by screen size (≤ 680 px is the phone
  band):
  - **Desktop:** 130 px each way over 9–15 s, unchanged.
  - **Phone:** a third of the band's width horizontally and a quarter of its
    height vertically, over 5–8 s, so they cross a good part of the band.
- **Sizes come from the landscape element**, not from constants, so a
  narrow phone and a large one look alike.

## Acceptance criteria

1. On a phone, fireflies move more than 30 px in 2 s on average (was 18).
2. On a desktop, every flight still lasts 9–15 s and reaches at most
   130 px.
3. Reduced motion still starts no flight. Coverage stays at 100%, and
   Lighthouse stays at 100.
