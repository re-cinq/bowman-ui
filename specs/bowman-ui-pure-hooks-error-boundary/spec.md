# bowman-ui pure hooks and ErrorBoundary

| Field  | Value                                                |
| ------ | ---------------------------------------------------- |
| Issue  | issue 71 (`021-bowman-ui-pure-hooks-error-boundary`) |
| Status | In Progress                                          |

Every test here is written fresh against the shipped code.

## What ships

Five hooks under `src/hooks/` and `src/components/ErrorBoundary.tsx`, all exported from the root
barrel with their option types (`FocusGroupsOptions`, `SidebarStateOptions`,
`ErrorBoundaryLabels`). Every file carries `"use client"` as its first statement, verified on the
built output, ships in the tarball with its `.d.ts` and resolves through the `"."`
exports entry for a consumer ([validated by](../../tests/hooks-dist.test.ts#L45),
[L41](../../tests/hooks-dist.test.ts#L41),
[L16](../../tests/hooks-dist.test.ts#L16)).

- `useDebounce` — carries its own `"use client"` directive rather than inheriting it from its
  importers (the directive-inheritance failure docs/design-notes.md decision 1 records). Timing
  pinned at the 299/301ms edges
  with restart-on-change
  ([validated by](../../tests/useDebounce.test.tsx#L22),
  [L37](../../tests/useDebounce.test.tsx#L37)).
- `useReducedMotion(override?: boolean)` — reads no `process.env`
  flag; a boolean override returns as-is without consulting `matchMedia`, and with no override
  the hook tracks `prefers-reduced-motion: reduce` including change events and listener cleanup
  ([validated by](../../tests/useReducedMotion.test.tsx#L42),
  [L62](../../tests/useReducedMotion.test.tsx#L62),
  [L75](../../tests/useReducedMotion.test.tsx#L75),
  [L97](../../tests/useReducedMotion.test.tsx#L97)).
- `useSidebarState(key, {storagePrefix, defaultOpen})` — `storagePrefix` is
  required with no default; the stored key is `${storagePrefix}${key}`, a stored
  value wins over `defaultOpen`, and storage access
  that throws degrades to in-memory state instead of crashing. Omitting `storagePrefix` does not
  compile, via `tests/types/hooks-type-assertions.tsx`
  ([validated by](../../tests/useSidebarState.test.tsx#L37),
  [L61](../../tests/useSidebarState.test.tsx#L61),
  [L69](../../tests/useSidebarState.test.tsx#L69),
  [types](../../tests/hooks-dist.test.ts#L16)).
  - `isHydrated` is `false` in a server render and `true` once the client has hydrated, and a
    server render ignores any stored value and reports `defaultOpen`, so a consumer can avoid a
    flash of the wrong state
    ([validated by](../../tests/useSidebarState.test.tsx#L125),
    [L23](../../tests/useSidebarState.test.tsx#L23)).
  - A window `storage` event whose key is the stored key, or `null` (a whole-store clear),
    re-reads storage, so a cross-tab write is reflected while the consumer has not yet set the
    value locally (the post-set half is issue 169's job); an event for any other key is ignored
    ([validated by](../../tests/useSidebarState.test.tsx#L87),
    [L100](../../tests/useSidebarState.test.tsx#L100),
    [L114](../../tests/useSidebarState.test.tsx#L114)).
- `useFocusTrap` — verbatim: first-element focus on open, Tab/Shift+Tab wrap at the ends while
  focus is inside, and pull focus back to an end when it sits outside the open trap (the
  2026-08-26 review's modal-only hardening), Escape closes, and focus returns to the trigger ref
  or the previously active element
  ([validated by](../../tests/useFocusTrap.test.tsx#L57),
  [L63](../../tests/useFocusTrap.test.tsx#L63),
  [L72](../../tests/useFocusTrap.test.tsx#L72), [L81](../../tests/useFocusTrap.test.tsx#L81),
  [L130](../../tests/useFocusTrap.test.tsx#L130),
  [L203](../../tests/useFocusTrap.test.tsx#L203),
  [L211](../../tests/useFocusTrap.test.tsx#L211),
  [L99](../../tests/useFocusTrap.test.tsx#L99),
  [L109](../../tests/useFocusTrap.test.tsx#L109),
  [L117](../../tests/useFocusTrap.test.tsx#L117)).
- `useFocusGroups({announce})` — the hardcoded English `Moved to ${groupName}` and the Tailwind
  `sr-only` class are both gone from the contract: `announce` maps a group name to the
  announcement (English default preserved, `null` suppresses), and the live region is hidden
  by the package's own `bowman-sr-only` class from `./styles.css`, never Tailwind's `sr-only`,
  so it needs no consumer Tailwind build. F6 order semantics pinned, including
  the fall-back-to-DOM-order quirk where the first F6 lands on the second group
  ([validated by](../../tests/useFocusGroups.test.tsx#L120),
  [L144](../../tests/useFocusGroups.test.tsx#L144),
  [L83](../../tests/useFocusGroups.test.tsx#L83),
  [L53](../../tests/useFocusGroups.test.tsx#L53),
  [L61](../../tests/useFocusGroups.test.tsx#L61),
  [L75](../../tests/useFocusGroups.test.tsx#L75)).
- `ErrorBoundary` — the `console.error` call is gone: `onError` is the only reporting channel,
  and rendering a thrown error writes nothing to the console and nothing to localStorage — the
  GDPR zero-retention rider on the error text. The three English strings became
  `labels?: Partial<ErrorBoundaryLabels>` merged over English defaults; a `fallback` node wins
  over labels; retry re-renders children and moves focus to the first focusable element among
  them - the nodes standing where the fallback stood, its former siblings excluded, the host
  node React reuses for a same-typed child included - so a keyboard user whose retry button
  just unmounted does not land on `body`; recovered content with no focusable element leaves
  focus where the browser put it and writes no `tabindex` into the consumer's DOM
  ([validated by](../../tests/ErrorBoundary.test.tsx#L205),
  [L65](../../tests/ErrorBoundary.test.tsx#L65),
  [L140](../../tests/ErrorBoundary.test.tsx#L140),
  [L152](../../tests/ErrorBoundary.test.tsx#L152),
  [L243](../../tests/ErrorBoundary.test.tsx#L243),
  [L273](../../tests/ErrorBoundary.test.tsx#L273),
  [L254](../../tests/ErrorBoundary.test.tsx#L254),
  [L160](../../tests/ErrorBoundary.test.tsx#L160),
  [L262](../../tests/ErrorBoundary.test.tsx#L262)).
- The error icon circle and glyph read the danger role - `--bowman-danger-soft` background,
  `--bowman-danger` glyph - rather than the `red-*` palette classes, the circle's dark fill
  joining the collapsed `rgba()` soft-dark fallback per § Theming decision 6
  ([validated by](../../tests/ErrorBoundary.test.tsx#L91),
  [readers](../../tests/theming-tokens-dist.test.ts#L245)).

No built file reads `process.env`, and no `NEXT_PUBLIC_FLAG_ANIMATIONS`
string survives in `src/`
([validated by](../../tests/hooks-dist.test.ts#L58)).

## Recorded decisions and limitations

- **Env flag → argument.** `useReducedMotion` reads no
  `process.env.NEXT_PUBLIC_FLAG_ANIMATIONS` flag - a `process.env` read throws under
  non-Next bundlers. The flag
  plumbing stays in the consumer; the hook takes the already-resolved boolean.
- **Storage prefix is consumer-owned.** No default: two apps on one origin must not collide, and
  a baked-in default would silently brand the package's storage keys.
- **Dead `typeof window === "undefined"` guards dropped.** Every file is `"use client"`; the
  guards could never fire in the environments the directive admits (`useReducedMotion` keeps
  its guard: see issue 170).
- **English strings stay as per-component props for now.** The repo-wide labels convention
  (defaults + `resolveLabels`) is issue 022's contract; these components adopt it there.
- **Directive-checker gap closed.** `scripts/check-client-directives.mjs`'s class rule matches
  `extends Component`/`PureComponent`, bare or through a namespace import (docs/design-notes.md
  decision 1, rule 3; the
  [client-API trigger-list spec](../bowman-ui-client-api-trigger-list/spec.md) owns the
  statement), so a class component such as `ErrorBoundary` needs no `onClick=` handler to be
  caught ([validated by](../../tests/client-directives.test.ts#L50)).
- **Visibility test.** `useFocusTrap` treats `display: none` and `visibility: hidden` as hidden (the states that also leave the tab order) and deliberately not opacity: an `opacity-0` element stays tabbable in browsers, and the package's own reveal-on-focus buttons rely on that. Where `checkVisibility` is missing, the `offsetParent` fallback misreports fixed-position descendants as hidden; it is all older engines offer.
- **Retry refocus targets the recovered children only.** `handleRetry` reads the fallback
  root's neighbours, commits the recovery with `flushSync`, and focuses the first
  `FOCUSABLE_SELECTOR` match inside the nodes now standing between those neighbours (issue 152).
  A set difference of the container's children would miss the host node React reuses when the
  recovered content is rooted in a `<div>` like the fallback. The happy-path DOM gains no
  wrapper, and - unlike `useFocusGroups`' transient `tabindex="-1"` - the boundary writes
  nothing into a consumer's element when the recovered content has no focusable: that case
  stays on `body` until issue 199 decides otherwise, and an `autoFocus` element among the
  recovered children keeps the focus it took during the commit. A child that throws again
  lands focus on the freshly rendered retry button, since the new fallback stands in the same
  range. Known limitation: the range is bounded by the fallback's former siblings, so a consumer
  that unmounts one of them in the same commit as the retry (a banner shown only while errored)
  shortens or empties the range; no test pins that shape. A custom `fallback` drives its own
  recovery and is untouched.
- **jsdom limits.** jsdom reports `offsetParent: null` for everything (stubbed in the focus
  tests) and performs no real focus traversal; these tests pin the handler contract and DOM
  effects. Verification against a real assistive technology is issue 071's job. A `storage`
  event never reaches the document that wrote the value, so the sidebar tests dispatch it by
  hand; a real second tab is not exercised.
