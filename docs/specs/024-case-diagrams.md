# 024. Interactive diagrams and a state-machine lesson

**Status:** implemented · **Roadmap:** phases 6 and 7 (first lesson)

## Problem

The case studies describe architecture in sentences. An engineer would
rather see the pieces and how they connect. trainer-flow's central rule,
that a draft can never reach the client without a trainer's approval, is
easier to believe after trying to break it.

## Scope

- **A diagram per case**, under its parts. Each piece is a button: pressing
  it explains that piece in one plain sentence below the diagram
  (`aria-live`).
  - **trainer-flow:** AI / Template / Manual → WorkoutDraft → validateDraft →
    WorkoutVersion. The architecture rule from its repository: three
    sources, one draft, one validation.
  - **mcp-docs-search:** Markdown → Chunks → SQLite FTS5 → search_docs →
    Agent.
  - **latino-migra:** Browser → firestore.rules / Express `/api/*` →
    Firestore / Gemini.
- **A lesson in trainer-flow's case:** the state machine to try by hand.
  Approve, send, start again. Sending a draft is refused with the rule's
  reason ("DRAFT → SENT does not exist"), with a short shake.
- **Every sentence comes from the case study or the project's own rules.**
  Nothing new is claimed.
- **Plain HTML buttons**, so keyboard and screen readers work as anywhere
  else. The caption keeps the pressed piece's key, so a language switch
  translates whatever is showing.
- **The Curiosity Switch:** diagrams and the lesson are engineering depth,
  hidden in the Hiring view.
- **Screen only, not indexed:** the PDF and the search results do not
  change.

## Acceptance criteria

1. Pressing each piece explains it, and only that piece is pressed.
2. In the lesson, sending a draft is refused and the state stays DRAFT.
   Approve then send reaches SENT. After that, both actions say it is done.
   Start again returns to DRAFT.
3. A language switch translates the caption that is showing.
4. Hiring view hides them. axe passes, coverage stays at 100%, the golden
   file is unchanged, and Lighthouse stays at 100.
