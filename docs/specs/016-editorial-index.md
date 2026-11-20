# 016. A numbered editorial index

**Status:** implemented · **Roadmap:** phase 23 (with phase 8)

## Problem

ar2design.com reads like an index: every section opens with a small
numbered label over a large headline, and the footer lists the sections in
the same order. Here the sections have headings but no sense of sequence,
and the footer is a single line.

## Scope

- **Eyebrows.** A small numbered label over each section heading:
  1. Trayectoria / Journey
  2. Pregúntale a mi CV / Ask my CV
  3. Perfil / Profile
  4. Trabajo propio / Own work
  5. Hablemos / Let's talk

  Each label complements its heading ("Perfil" over "Sobre mí") and never
  repeats it. They are decoration (`aria-hidden`), since the heading already
  names the section.
- **Footer index.** A `<nav aria-label="Índice">` lists the five sections
  with their numbers and links to each. It uses the same strings, so the two
  cannot drift.
- **Motion.** The CV's labels arrive with their headings (spec 010).

## Out of scope

Section exits and the cover stat row (phases 24 and 25).

## Acceptance criteria

1. The five labels appear in page order, numbered 01–05. The footer lists
   the same five.
2. Every index link brings its section into view.
3. English labels, and a translated `aria-label` on the index. Labels are
   hidden from assistive technology. axe passes, coverage stays at 100%,
   and Lighthouse stays at 100.
