# 005. Searchable case studies, honest synonyms

**Status:** implemented · **Roadmap:** phase 3 (second part)

## Problem

1. **The case studies are invisible to the search.** The strongest evidence
   on the page (decisions, trade-offs, results) cannot be found by asking.
   "Which architecture decisions did you take in trainer-flow?" is a
   suggested question, and it cannot reach the trainer-flow case.
2. **Some synonyms are false friends.** The evidence from spec 003 made them
   visible. An audit of every synonym against the CV found seven words that
   widen questions into unrelated passages:

   | Synonym | Meant for | Also matched |
   |---|---|---|
   | data | databases | **Allergan Data Labs** |
   | donde / where | where she lives | "trainer-flow, **where** AI proposes" |
   | based / role | location, the role sought | "**role-based** permissions" |
   | remoto / remote | remote work | "**remote** proctoring" |
   | education | studies | **Laureate Education** |
   | flow | trainer-flow | "financing **flows**" |
   | github | projects | "**GitHub** Actions" |

## Scope

- **Synonyms.** Remove those words from the synonym groups only. Typed
  directly, they still match literally ("remote" still finds "remote
  proctoring": it was typed).
  - "remoto / remote / híbrido / hybrid / teletrabajo" become a group of
    their own, so the question about remote work still crosses languages.
  - Project names stop being synonyms of each other. "trainer-flow" was
    pulling in latino-migra.
- **Cases as passages.** Every line of a case is its own passage
  (`section: case`), ranked on the project name, the part heading
  ("Decisions") and the line itself. Not the summary text ("problem,
  decisions…"), which every case shares.
  - Line by line, because one long passage per case raised the average
    length and pushed short skill lines (Jest, Docker) out of answers.
  - The adapter asks for six hits, keeps one per element, and shows three.
  - Cases weigh 0.7: they add detail to projects the CV already lists, so
    they answer after the CV, not instead of it.
  - An answer from a case is titled "Case study: trainer-flow".
  - "See it" opens the case before scrolling to it.
  - The Projects mode includes cases.
- **Golden file.** Regenerate it and review its diff in this PR. Every change
  must be either a removed false friend or a case that now answers.

## Out of scope

New synonyms, and k1, b and the cutoff. The only new parameter is the case
boost.

## Considered and dropped

Counting each typed word once, through its best synonym only. It fixed
"snowflake" (below) but lost two of three sources for "How do you approach
testing?", a suggested question. A variant that ranked any literal match
above every synonym-only one broke "¿Qué bases de datos has usado?": the
skills line "PostgreSQL, MongoDB, Snowflake" holds no typed word. Summing
synonyms stays.

## Known limitation

"snowflake" ranks Laureate (MongoDB, through the database group) above
Allergan, which names Snowflake. All three right sources answer, and the
evidence marks Laureate's match as a synonym, so the answer is honest about
it. Fixing the order needs a scoring change, which is its own spec.

## Risks

- **Rankings move.** That is the point, but each move gets reviewed. The
  golden diff is summarized in the PR.
- **Long case passages drown the short CV lines.** Mitigation: BM25's length
  normalization (b = 0.6) already discounts long passages. The diff shows
  whether that holds.

## Acceptance criteria

1. No passage is reached through one of the seven removed words. A unit test
   checks it.
2. "Which architecture decisions did you take in trainer-flow?" cites the
   trainer-flow case, and "See it" opens it.
3. The Projects mode returns cases. The golden diff is reviewed: no regression
   on a suggested question.

## Golden diff (18 of 58 queries)

- **Cases answer:** both trainer-flow decisions questions (replacing
  latino-migra and the career break), supabase, python.
- **False friends gone:** trainer-flow no longer pulls latino-migra; the
  EN AI question cites the profile, not latino-migra.
- **Better:** jest now cites the skills line; sql and the databases
  questions cite the skills line second instead of third.
- **Neutral:** "react angular" swaps two sources that both match; "remote"
  adds "remote proctoring", typed literally.
- **Weaker:** "snowflake", see above.
4. Both languages. Coverage stays at 100%, and Lighthouse stays at 100.
