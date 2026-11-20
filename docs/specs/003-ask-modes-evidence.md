# 003. Ask my CV: modes and visible evidence

**Status:** implemented · **Roadmap:** phase 3 (first part)

## Problem

The search answers well, but it does not show why. Synonyms widen the
ranking silently, so a passage reached only through a synonym looks like a
direct match. There is also no way to ask only about experience, or only
about projects.

## Scope

- **Search modes.** A radio group, "Search in: Whole CV · Experience ·
  Projects · Skills", above the answer. Changing it re-asks the question on
  screen in the new scope. These are native radios styled as pills: arrow
  keys, focus and screen readers work with no script.
- **Module.** `search()` takes `sections`. idf still comes from the whole CV,
  so a word weighs the same in every mode. Every hit reports `synonyms`, the
  matches that were not typed.
- **Evidence.** Under each source, "Matches:" lists the words that made the
  passage answer, written as the CV writes them ("Kubernetes", not the
  stemmed "kubernete"). Synonyms are dashed and say so to screen readers.
- **No dead ends.** An empty mode says "Nothing in Projects." and offers
  "Search the whole CV" in one click.

## Out of scope

- Indexing the case studies. It changes default rankings, so it gets its own
  spec and a reviewed golden-file diff.
- Tuning the synonym groups. The evidence now shows a false friend: "data"
  matches "Allergan Data Labs". That needs its own spec and golden-file diff
  too.

## Risks

- **Ranking drift in the default mode.** Mitigation: the golden file must
  pass unchanged.
- **A styled radio that is not really a radio.** Mitigation: the inputs stay
  in place, transparent over their labels, and a test drives them with the
  arrow keys.

## Acceptance criteria

1. A mode restricts the sources: "typescript" in Projects only cites
   projects.
2. Arrow keys move between modes.
3. An empty mode offers the whole CV, and doing so answers.
4. Evidence shows the typed words plainly and marks synonyms. "sql" in the
   CV is reached only through synonyms, and the page says so.
5. Both languages work. The golden file is unchanged, unit tests cover
   `sections` and `synonyms`, coverage stays at 100%, and Lighthouse stays at
   100.
