# 007. Fireflies that fly on iPhone

**Status:** implemented · **Roadmap:** phase 13 · **Type:** bug fix

## Problem

On a phone, Ana saw the fireflies blink in place: they did not fly. The E2E
test "they visibly fly" passes, because it runs in Chromium.

## Root cause

The flight was a CSS animation whose `@keyframes` read each firefly's points
from custom properties (`translate(var(--x1), var(--y1))`). Safari on iPhone
did not animate those keyframes. The blink, whose keyframes are plain values,
kept working. That is exactly what Ana saw.

## Fix

The flight becomes a Web Animation started from `app.js`. Each firefly gets
its own three points written as px values. The blink stays in CSS.
`prefers-reduced-motion` starts no flight at all.

## Acceptance criteria

1. No flight keyframe contains `var(`. Chromium cannot reproduce the WebKit
   behaviour, so a test checks the cause directly.
2. The phone test still measures real movement.
3. Under reduced motion, no element runs a CSS animation or a Web Animation.
4. Coverage stays at 100%, and Lighthouse stays at 100.
