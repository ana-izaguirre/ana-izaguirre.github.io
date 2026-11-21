# 022. Section exits

**Status:** removed (Ana, 2026-11-21): the links added nothing the page's own order does not

## Problem

ar2design.com closes every section on one link onward ("Selected work",
"Let's talk"). Here a section simply ends, and the reader has to decide
where to go next.

## Scope

Three exits, each a single text link at the end of its section, phrased as
the reader's next question:

1. After the career story: "¿Una duda concreta? Pregúntale a mi CV" → the
   question section.
2. After the answers: "Sigue con quién soy y qué he construido" → About me.
3. After the projects: "¿Encajo en tu equipo? Hablemos" → the closing card.

They are plain links, so they work without script and land through the
in-page jump fix (spec 009). Screen only: the PDF does not change. The
arrow is decoration (`aria-hidden`).

## Acceptance criteria

1. Three exits, in page order, each pointing to the section after it.
2. Each brings its target into view.
3. English text. axe passes, the layout tests pass, coverage stays at 100%,
   and Lighthouse stays at 100.

## Revision (2026-11-21)

Ana saw "¿Una duda concreta? Pregúntale a mi CV" right above the section
titled "Pregúntale a mi CV": the same thing twice, especially on a phone,
where they touch. That exit is gone. The projects' exit said "Hablemos" over the card
labelled "Hablemos", so it now reads "¿Encajo en tu equipo? Así me
contactas". An exit never repeats its target's label, and a test checks it
in both languages.

