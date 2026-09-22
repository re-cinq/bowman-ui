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
exports entry for a consumer ([validated by each built hook and ErrorBoundary opens with "use client"; as its first statement](../../tests/hooks-dist.test.ts#L23),
[validated by npm pack --dry-run ships the five hooks and ErrorBoundary with their d.ts files](../../tests/hooks-dist.test.ts#L19),
[validated by tsc accepts hooks-type-assertions.tsx against dist via the '.' exports entry](../../tests/hooks-dist.test.ts#L15)).

- `useDebounce` — carries its own `"use client"` directive rather than inheriting it from its
  importers (the directive-inheritance failure docs/design-notes.md decision 1 records). Timing
  pinned at the 299/301ms edges
  with restart-on-change
  ([validated by still returns the previous value 299ms after a change and the new one at 301ms](../../tests/useDebounce.test.tsx#L22),
  [validated by a change before the deadline restarts the delay instead of firing the stale value](../../tests/useDebounce.test.tsx#L37)).
- `useReducedMotion(override?: boolean)` — reads no `process.env`
  flag; a boolean override returns as-is without consulting `matchMedia`, and with no override
  the hook tracks `prefers-reduced-motion: reduce` including change events and listener cleanup
  ([validated by returns the boolean override as-is and never consults matchMedia](../../tests/useReducedMotion.test.tsx#L42),
  [validated by follows a change event from the media query](../../tests/useReducedMotion.test.tsx#L62),
  [validated by reports the preference on the very first render - no flash frame](../../tests/useReducedMotion.test.tsx#L75),
  [validated by removes the change listener on unmount](../../tests/useReducedMotion.test.tsx#L97)).
- `useSidebarState(key, {storagePrefix, defaultOpen})` — `storagePrefix` is
  required with no default; the stored key is `${storagePrefix}${key}`, a stored
  value wins over `defaultOpen`, and storage access
  that throws degrades to in-memory state instead of crashing. Omitting `storagePrefix` does not
  compile, via `tests/types/hooks-type-assertions.tsx`
  ([validated by persists toggles under the exact key "olt-chat"](../../tests/useSidebarState.test.tsx#L37),
  [validated by a stored "false" wins over defaultOpen on mount](../../tests/useSidebarState.test.tsx#L61),
  [validated by degrades to in-memory state when storage access throws](../../tests/useSidebarState.test.tsx#L69),
  [types](../../tests/hooks-dist.test.ts#L15)).
  - `isHydrated` is `false` in a server render and `true` once the client has hydrated, and a
    server render ignores any stored value and reports `defaultOpen`, so a consumer can avoid a
    flash of the wrong state
    ([validated by server render falls back to the default and reports not hydrated](../../tests/useSidebarState.test.tsx#L125),
    [validated by starts open by default and reports hydrated after mount](../../tests/useSidebarState.test.tsx#L23)).
  - A window `storage` event whose key is the stored key, or `null` (a whole-store clear),
    re-reads storage, so a cross-tab write is reflected while the consumer has not yet set the
    value locally (the post-set half is issue 169's job); an event for any other key is ignored
    ([validated by reflects a cross-tab write when the storage event key matches](../../tests/useSidebarState.test.tsx#L87),
    [L100](../../tests/useSidebarState.test.tsx#L100),
    [validated by ignores a storage event for an unrelated key](../../tests/useSidebarState.test.tsx#L114)).
- `useFocusTrap` — verbatim: first-element focus on open, Tab/Shift+Tab wrap at the ends while
  focus is inside, and pull focus back to an end when it sits outside the open trap (the
  2026-08-26 review's modal-only hardening), Escape closes, and focus returns to the trigger ref
  or the previously active element
  ([validated by focuses the first focusable element when opened](../../tests/useFocusTrap.test.tsx#L57),
  [validated by Tab on the last element wraps to the first](../../tests/useFocusTrap.test.tsx#L63),
  [validated by Shift+Tab on the first element wraps to the last](../../tests/useFocusTrap.test.tsx#L72), [validated by Tab in the middle of the list is not intercepted](../../tests/useFocusTrap.test.tsx#L81),
  [validated by Shift+Tab in the middle of the list is not intercepted](../../tests/useFocusTrap.test.tsx#L130),
  [validated by Tab while focus sits outside the open trap pulls it to the first element](../../tests/useFocusTrap.test.tsx#L203),
  [validated by Shift+Tab while focus sits outside the open trap pulls it to the last element](../../tests/useFocusTrap.test.tsx#L211),
  [validated by Escape calls onClose](../../tests/useFocusTrap.test.tsx#L99),
  [validated by closing returns focus to the trigger ref when one is given](../../tests/useFocusTrap.test.tsx#L109),
  [validated by closing returns focus to the previously active element without a trigger ref](../../tests/useFocusTrap.test.tsx#L117)).
- `useFocusGroups({announce})` — the hardcoded English `Moved to ${groupName}` and the Tailwind
  `sr-only` class are both gone from the contract: `announce` maps a group name to the
  announcement (English default preserved, `null` suppresses), and the live region is hidden
  by the package's own `bowman-sr-only` class from `./styles.css`, never Tailwind's `sr-only`,
  so it needs no consumer Tailwind build. F6 order semantics pinned, including
  the fall-back-to-DOM-order quirk where the first F6 lands on the second group
  ([validated by announces "Moved to main" in a role=status live region hidden by the bowman-sr-only class](../../tests/useFocusGroups.test.tsx#L120),
  [validated by announce returning null suppresses the live region entirely](../../tests/useFocusGroups.test.tsx#L144),
  [validated by twelve unordered groups are visited in DOM order, wrapping back to the first](../../tests/useFocusGroups.test.tsx#L83),
  [validated by F6 follows data-focus-group-order, not DOM order](../../tests/useFocusGroups.test.tsx#L53),
  [validated by F6 wraps forward past the last group and Shift+F6 wraps backward past the first](../../tests/useFocusGroups.test.tsx#L61),
  [validated by equal orders fall back to DOM order, so the first F6 lands on the second group](../../tests/useFocusGroups.test.tsx#L75)).
- `ErrorBoundary` — the `console.error` call is gone: `onError` is the only reporting channel,
  and rendering a thrown error writes nothing to the console and nothing to localStorage — the
  GDPR zero-retention rider on the error text. The three English strings became
  `labels?: Partial<ErrorBoundaryLabels>` merged over English defaults; a `fallback` node wins
  over labels; retry re-renders children and moves focus to the first focusable element among
  them - the nodes standing where the fallback stood, its former siblings excluded, the host
  node React reuses for a same-typed child included - so a keyboard user whose retry button
  just unmounted does not land on `body`; recovered content with no focusable element leaves
  focus where the browser put it and writes no `tabindex` into the consumer's DOM
  ([validated by reports only through onError and writes nothing to the console or localStorage](../../tests/ErrorBoundary.test.tsx#L205),
  [validated by a throwing child renders the role=alert fallback with the three English defaults](../../tests/ErrorBoundary.test.tsx#L65),
  [validated by a fallback node wins over labels](../../tests/ErrorBoundary.test.tsx#L140),
  [validated by the retry button re-renders children](../../tests/ErrorBoundary.test.tsx#L152),
  [validated by clicking "Try again" moves focus to the first focusable element of the recovered children, past the focusable siblings before and after the boundary](../../tests/ErrorBoundary.test.tsx#L243),
  [validated by `recovered children rooted in a <div> - the host node React reuses from the fallback - still get the focus`](../../tests/ErrorBoundary.test.tsx#L297),
  [validated by a sibling after the boundary that unmounts in the same commit does not extend the range: the consumer's later button stays unfocused](../../tests/ErrorBoundary.test.tsx#L273),
  [validated by recovered children without a focusable element leave document.activeElement on body and write no tabindex into the consumer's DOM](../../tests/ErrorBoundary.test.tsx#L254),
  [validated by the retry button inside a consumer form retries without submitting it, and a child that throws again leaves focus on the fresh retry button](../../tests/ErrorBoundary.test.tsx#L160),
  [validated by an autoFocus input among the recovered children keeps the focus it took during the commit](../../tests/ErrorBoundary.test.tsx#L262)).
- The error icon circle and glyph read the danger role - `--bowman-danger-soft` background,
  `--bowman-danger` glyph - rather than the `red-*` palette classes, the circle's dark fill
  joining the collapsed `rgba()` soft-dark fallback per § Theming decision 6
  ([validated by the error icon circle and glyph read the danger role, not the red palette classes](../../tests/ErrorBoundary.test.tsx#L91),
  [readers](../../tests/theming-tokens-dist.test.ts#L245)).

No built file reads `process.env`, and no `NEXT_PUBLIC_FLAG_ANIMATIONS`
string survives in `src/`
([validated by `no built file reads process.env and no NEXT_PUBLIC flag string survives in src/`](../../tests/hooks-dist.test.ts#L36)).

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
  caught ([validated by exits non-zero when a class extends Component with no hook and no handler](../../tests/client-directives.test.ts#L50)).
- **Visibility test.** `useFocusTrap` treats `display: none` and `visibility: hidden` as hidden (the states that also leave the tab order) and deliberately not opacity: an `opacity-0` element stays tabbable in browsers, and the package's own reveal-on-focus buttons rely on that. Where `checkVisibility` is missing, the `offsetParent` fallback misreports fixed-position descendants as hidden; it is all older engines offer.
- **Retry refocus targets the recovered children only.** `handleRetry` reads the fallback
  root's previous sibling and the set of its siblings, commits the recovery with `flushSync`,
  and focuses the first `FOCUSABLE_SELECTOR` match inside the nodes now standing after that
  previous sibling and before the first sibling that outlived the swap (issue 152).
  A set difference of the container's children would miss the host node React reuses when the
  recovered content is rooted in a `<div>` like the fallback. The happy-path DOM gains no
  wrapper, and - unlike `useFocusGroups`' transient `tabindex="-1"` - the boundary writes
  nothing into a consumer's element when the recovered content has no focusable: that case
  stays on `body` until issue 199 decides otherwise, and an `autoFocus` element among the
  recovered children keeps the focus it took during the commit. A child that throws again
  lands focus on the freshly rendered retry button, since the new fallback stands in the same
  range. A sibling after the boundary that unmounts in the same commit cannot extend the range
  past the boundary: the walk stops at the next surviving sibling or the container's end. Known
  limitation: the range starts at the fallback's former previous sibling, so a consumer that
  unmounts that one node in the same commit as the retry (a banner shown only while errored,
  placed directly before the boundary) empties the range and no focus moves; no test pins that
  shape. A custom `fallback` drives its own recovery and is untouched.
- **jsdom limits.** jsdom reports `offsetParent: null` for everything (stubbed in the focus
  tests) and performs no real focus traversal; these tests pin the handler contract and DOM
  effects. Verification against a real assistive technology is issue 071's job. A `storage`
  event never reaches the document that wrote the value, so the sidebar tests dispatch it by
  hand; a real second tab is not exercised.
