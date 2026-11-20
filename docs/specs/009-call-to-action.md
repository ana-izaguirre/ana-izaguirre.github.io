# 009. A clear call to action

**Status:** implemented · **Roadmap:** phase 12

## Problem

A recruiter convinced by the page has nowhere obvious to go. Contact exists,
but as a floating button in a corner and a "Download CV" button in the bar.
Nothing on the cover asks, and the page ends on the CV with no next step.

## Scope

- **On the cover:** "Let's talk →", a filled pill next to "Explore my world".
  It is static markup, in the visitor's language from the first frame
  (`EN_TOP`). It links to the closing section, so it works without script.
- **Where the page ends:** a closing card, "Available to start now", with
  three actions:
  1. Write to me (email);
  2. Download CV, in the current language;
  3. LinkedIn.
  Its heading and text reuse the contact popup's strings, so nothing new is
  claimed.
- **In-page links land.** The sections below the story skip rendering until
  seen (`content-visibility`), so a jump aims at estimated heights. On a
  phone, "Let's talk" stopped about 950 px short. Once the scroll settles,
  the page aims again at the real position. The browser's own jump (hash,
  focus, history) stays.

## Out of scope

Forms, calendars, or any third-party script.

## Risks

- **First-frame shift.** Mitigation: the pills are static, and the
  first-paint test measures the cover with and without `app.js`.
- **Two red buttons competing.** Mitigation: on the cover, only "Let's talk"
  is filled.

## Acceptance criteria

1. The cover shows "Hablemos" / "Let's talk" before `app.js` runs.
2. On a phone and on a desktop, "Let's talk" brings the closing card into
   view.
3. The closing card offers email, LinkedIn and the CV in the current
   language.
4. axe passes in both themes. Coverage stays at 100%, and Lighthouse stays
   at 100.
