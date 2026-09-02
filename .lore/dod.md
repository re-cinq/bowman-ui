# Definition of Done

Strategy: direct

Why: The three source files (`src/components/Toast.tsx`, `src/components/ConversationList.tsx`, `src/hooks/useFocusGroups.ts`) are readable today; a source-walk test can directly assert the duplicated literal appears in exactly one file.

Acceptance tests:
  - tests/visually-hidden-util.test.ts::"the visually-hidden style utility > the clip \"rect(0, 0, 0, 0)\" literal is not duplicated — it appears in exactly one src/ file" — the raw `rect(0, 0, 0, 0)` string lives in a single shared location, not spread across three call sites

Facets (the red-green-refactor steps you expect, smallest first):
  - Create a shared `visuallyHidden` style object (e.g. `src/hooks/visuallyHidden.ts`) containing the full six-property clip pattern
  - Import and use it in `src/components/Toast.tsx` in place of the inline `as const` object
  - Import and use it in `src/components/ConversationList.tsx` in place of the inline style object
  - Import and use it in `src/hooks/useFocusGroups.ts` in place of the individual `announcement.style.*` assignments
  - Verify the test is green and the existing behavioral tests (Toast, ConversationList, useFocusGroups) remain green

Out of scope: changing what the visually-hidden pattern does, adding new accessibility behaviour, exporting the utility from `src/index.ts` (it is an internal implementation detail), and any ESLint rule to prevent re-duplication.
