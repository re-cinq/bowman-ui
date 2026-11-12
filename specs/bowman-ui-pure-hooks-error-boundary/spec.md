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
exports entry for a consumer ([validated by each built hook and ErrorBoundary opens with "use client"; as its first statement @eda96026](../../tests/hooks-dist.test.ts#L27),
[validated by npm pack --dry-run ships the five hooks and ErrorBoundary with their d.ts files @a047bd66](../../tests/hooks-dist.test.ts#L23),
[validated by tsc accepts hooks-type-assertions.tsx against dist via the '.' exports entry @6ae71708](../../tests/hooks-dist.test.ts#L19)).

- `useDebounce` — carries its own `"use client"` directive rather than inheriting it from its
  importers (the directive-inheritance failure docs/design-notes.md decision 1 records). Timing
  pinned at the 299/301ms edges
  with restart-on-change
  ([validated by still returns the previous value 299ms after a change and the new one at 301ms @f624b5e8](../../tests/useDebounce.test.tsx#L22),
  [validated by a change before the deadline restarts the delay instead of firing the stale value @966ae210](../../tests/useDebounce.test.tsx#L37)).
- `useReducedMotion(override?: boolean)` — reads no `process.env`
  flag; a boolean override returns as-is without consulting `matchMedia`, and with no override
  the hook tracks `prefers-reduced-motion: reduce` including change events and listener cleanup
  ([validated by returns the boolean override as-is and never consults matchMedia @e23219e9](../../tests/useReducedMotion.test.tsx#L42),
  [validated by follows a change event from the media query @9399d0ff](../../tests/useReducedMotion.test.tsx#L62),
  [validated by reports the preference on the very first render - no flash frame @a6f11626](../../tests/useReducedMotion.test.tsx#L75),
  [validated by removes the change listener on unmount @3da58380](../../tests/useReducedMotion.test.tsx#L97)).
- `useSidebarState(key, {storagePrefix, defaultOpen})` — `storagePrefix` is
  required with no default; the stored key is `${storagePrefix}${key}`, a stored
  value wins over `defaultOpen`, and storage access
  that throws degrades to in-memory state instead of crashing. Omitting `storagePrefix` does not
  compile, via `tests/types/hooks-type-assertions.tsx`
  ([validated by persists toggles under the exact key "olt-chat" @4d4fe707](../../tests/useSidebarState.test.tsx#L37),
  [validated by a stored "false" wins over defaultOpen on mount @2bf50364](../../tests/useSidebarState.test.tsx#L61),
  [validated by degrades to in-memory state when storage access throws @0039b519](../../tests/useSidebarState.test.tsx#L69),
  [types@6ae71708](../../tests/hooks-dist.test.ts#L19)).
  - `isHydrated` is `false` in a server render and `true` once the client has hydrated, and a
    server render ignores any stored value and reports `defaultOpen`, so a consumer can avoid a
    flash of the wrong state
    ([validated by server render falls back to the default and reports not hydrated @9b92906e](../../tests/useSidebarState.test.tsx#L125),
    [validated by starts open by default and reports hydrated after mount @69ceb874](../../tests/useSidebarState.test.tsx#L23)).
  - A window `storage` event whose key is the stored key, or `null` (a whole-store clear),
    re-reads storage, so a cross-tab write is reflected until the consumer first sets the value
    locally; after a local set the local value wins, a later matching event no longer changes
    `isOpen`, and this tab does not write back to storage in response to the event; an event
    for any other key is ignored
    ([validated by reflects a cross-tab write when the storage event key matches @b28eb230](../../tests/useSidebarState.test.tsx#L87),
    [validated by re-reads on a whole-store clear (storage event with a null key) @0fea0f48](../../tests/useSidebarState.test.tsx#L100),
    [validated by ignores a storage event for an unrelated key @79889f66](../../tests/useSidebarState.test.tsx#L114),
    [validated by a matching storage event after a toggle changes neither isOpen nor the stored value @ff59fb64](../../tests/useSidebarState.test.tsx#L134)).
- `useFocusTrap` — verbatim: first-element focus on open, Tab/Shift+Tab wrap at the ends while
  focus is inside, and pull focus back to an end when it sits outside the open trap (the
  2026-08-26 review's modal-only hardening), Escape closes, and focus returns to the trigger ref
  or the previously active element
  ([validated by focuses the first focusable element when opened @88c2e5f9](../../tests/useFocusTrap.test.tsx#L94),
  [validated by Tab on the last element wraps to the first @77102a40](../../tests/useFocusTrap.test.tsx#L100),
  [validated by Shift+Tab on the first element wraps to the last @ece39e41](../../tests/useFocusTrap.test.tsx#L109), [validated by Tab in the middle of the list is not intercepted @ffe0bca8](../../tests/useFocusTrap.test.tsx#L118),
  [validated by Shift+Tab in the middle of the list is not intercepted @19fc1cac](../../tests/useFocusTrap.test.tsx#L163),
  [validated by Tab while focus sits outside the open trap pulls it to the first element @f5f8ac6b](../../tests/useFocusTrap.test.tsx#L235),
  [validated by Shift+Tab while focus sits outside the open trap pulls it to the last element @f8683715](../../tests/useFocusTrap.test.tsx#L243),
  [validated by Escape calls onClose @03a2527a](../../tests/useFocusTrap.test.tsx#L136),
  [validated by closing returns focus to the trigger ref when one is given @aed68688](../../tests/useFocusTrap.test.tsx#L146),
  [validated by closing returns focus to the previously active element without a trigger ref @279280ed](../../tests/useFocusTrap.test.tsx#L154),
  [validated by `closing returns focus to a previously active <svg tabindex="0"> without a trigger ref` @bd707c95](../../tests/useFocusTrap.test.tsx#L383)).
- `useFocusTrap` gains three behaviours for modal panels, under
  [specs/bowman-ui-form-dialog-notice/spec.md](../bowman-ui-form-dialog-notice/spec.md), its
  signature unchanged: an open container with nothing focusable inside, which carries a
  `tabindex` and passes the visibility check, takes focus itself and Tab and Shift+Tab are
  prevented, pulling escaped focus back to it, while a container without a `tabindex` still
  leaves Tab alone; with focus on the container itself, Tab moves to the first element and
  Shift+Tab to the last; and unmounting while open returns focus as closing does, skipping a
  return target that is no longer connected, on close as on unmount ([validated by an empty container without a tabindex leaves Tab handling alone @49cfd3ce](../../tests/useFocusTrap.test.tsx#L251), [validated by an empty container with a tabindex takes focus on open and Tab from it is prevented @813cc857](../../tests/useFocusTrap.test.tsx#L262), [validated by an empty container with a tabindex that fails the visibility check takes no focus and leaves Tab alone @34858645](../../tests/useFocusTrap.test.tsx#L271), [validated by Tab with focus escaped from an empty focusable container is prevented and pulls focus back to the container @ac9e7de5](../../tests/useFocusTrap.test.tsx#L285), [validated by Tab from the focused container itself reaches the first element @a65768b2](../../tests/useFocusTrap.test.tsx#L294), [validated by Shift+Tab from the focused container itself reaches the last element @cdf7f8ae](../../tests/useFocusTrap.test.tsx#L302), [validated by unmounting while open returns focus to the element that held it before opening @52422c57](../../tests/useFocusTrap.test.tsx#L310), [validated by unmounting while open returns focus to the latest trigger ref when one is given @9e74453b](../../tests/useFocusTrap.test.tsx#L325), [validated by a close returns focus once and a later unmount while closed returns it no more @767b09a9](../../tests/useFocusTrap.test.tsx#L339), [validated by a new triggerRef while open never returns focus @84ab1609](../../tests/useFocusTrap.test.tsx#L350), [validated by a return target removed before the close is skipped and focus stays where it was @e3a91e71](../../tests/useFocusTrap.test.tsx#L368)).
- `useFocusGroups({announce})` — the hardcoded English `Moved to ${groupName}` and the Tailwind
  `sr-only` class are both gone from the contract: `announce` maps a group name to the
  announcement (English default preserved, `null` suppresses), and the live region is hidden
  by the package's own `bowman-sr-only` class from `./styles.css`, never Tailwind's `sr-only`,
  so it needs no consumer Tailwind build. F6 order semantics pinned, including
  the fall-back-to-DOM-order quirk where the first F6 lands on the second group
  ([validated by announces "Moved to main" in a role=status live region hidden by the bowman-sr-only class @2f92fb33](../../tests/useFocusGroups.test.tsx#L120),
  [validated by announce returning null suppresses the live region entirely @b81e1755](../../tests/useFocusGroups.test.tsx#L144),
  [validated by twelve unordered groups are visited in DOM order, wrapping back to the first @26f602e0](../../tests/useFocusGroups.test.tsx#L83),
  [validated by F6 follows data-focus-group-order, not DOM order @5d3836b0](../../tests/useFocusGroups.test.tsx#L53),
  [validated by F6 wraps forward past the last group and Shift+F6 wraps backward past the first @da279fe6](../../tests/useFocusGroups.test.tsx#L61),
  [validated by equal orders fall back to DOM order, so the first F6 lands on the second group @48c46ffc](../../tests/useFocusGroups.test.tsx#L75)).
- `ErrorBoundary` — the `console.error` call is gone: `onError` is the only reporting channel,
  and rendering a thrown error writes nothing to the console and nothing to localStorage — the
  GDPR zero-retention rider on the error text. The three English strings became
  `labels?: Partial<ErrorBoundaryLabels>` merged over English defaults; a `fallback` node wins
  over labels; retry re-renders children and moves focus to the first focusable element among
  them - the nodes standing where the fallback stood, its former siblings excluded, the host
  node React reuses for a same-typed child included - so a keyboard user whose retry button
  just unmounted does not land on `body`; recovered content with no focusable element gets
  focus on its first element node through a `tabindex="-1"` the next animation frame removes
  (or restores to the value the element carried) - the transient-tabindex idiom
  `useFocusGroups` uses, shared through `src/hooks/focusWithTransientTabIndex.ts` - a text
  node before that element is skipped, and text-only recovered content leaves focus where the
  browser put it and writes no `tabindex` into the consumer's DOM
  ([validated by reports only through onError and writes nothing to the console or localStorage @f94e25a6](../../tests/ErrorBoundary.test.tsx#L205),
  [validated by a throwing child renders the role=alert fallback with the three English defaults @71940e7e](../../tests/ErrorBoundary.test.tsx#L65),
  [validated by a fallback node wins over labels @73dd10b6](../../tests/ErrorBoundary.test.tsx#L140),
  [validated by the retry button re-renders children @298b95d5](../../tests/ErrorBoundary.test.tsx#L152),
  [validated by clicking "Try again" moves focus to the first focusable element of the recovered children, past the focusable siblings before and after the boundary @c30d8441](../../tests/ErrorBoundary.test.tsx#L264),
  [validated by `recovered children rooted in a <div> - the host node React reuses from the fallback - still get the focus` @54857920](../../tests/ErrorBoundary.test.tsx#L362),
  [validated by a sibling after the boundary that unmounts in the same commit does not extend the range: the consumer's later button stays unfocused @430aad3d](../../tests/ErrorBoundary.test.tsx#L337),
  [validated by `recovered children without a focusable element get focus on their first element node through a tabindex="-1" that the next frame removes` @8428cdb0](../../tests/ErrorBoundary.test.tsx#L275),
  [validated by a text node before the first recovered element is skipped: the element, not the text, takes the transient tabindex @cd7e759e](../../tests/ErrorBoundary.test.tsx#L288),
  [validated by several recovered nodes without a focusable element: only the first element node gets the transient tabindex @ec9e72ad](../../tests/ErrorBoundary.test.tsx#L300),
  [validated by text-only recovered children leave document.activeElement on body and write no tabindex into the consumer's DOM @643b9894](../../tests/ErrorBoundary.test.tsx#L318),
  [validated by the retry button inside a consumer form retries without submitting it, and a child that throws again leaves focus on the fresh retry button @ef59b0c6](../../tests/ErrorBoundary.test.tsx#L160),
  [validated by an autoFocus input among the recovered children keeps the focus it took during the commit @fd1c9065](../../tests/ErrorBoundary.test.tsx#L326)).
- The error icon circle and glyph read the danger role - `--bowman-danger-soft` background,
  `--bowman-danger` glyph - rather than the `red-*` palette classes, the circle's dark fill
  joining the collapsed `rgba()` soft-dark fallback per § Theming decision 6
  ([validated by the error icon circle and glyph read the danger role, not the red palette classes @8de62178](../../tests/ErrorBoundary.test.tsx#L91),
  [readers@bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381)).

No built file reads `process.env`, and no `NEXT_PUBLIC_FLAG_ANIMATIONS`
string survives in `src/`
([validated by `no built file reads process.env and no NEXT_PUBLIC flag string survives in src/` @619c38bf](../../tests/hooks-dist.test.ts#L37)).

## Recorded decisions and limitations

- **Env flag → argument.** `useReducedMotion` reads no
  `process.env.NEXT_PUBLIC_FLAG_ANIMATIONS` flag - a `process.env` read throws under
  non-Next bundlers. The flag
  plumbing stays in the consumer; the hook takes the already-resolved boolean.
- **Storage prefix is consumer-owned.** No default: two apps on one origin must not collide, and
  a baked-in default would silently brand the package's storage keys.
- **Browser reads sit behind server snapshots or a capability check.** A `"use client"` file
  still prerenders once on the server, so `useSidebarState` hands `useSyncExternalStore` a
  server snapshot and reads storage only on the client, and `useReducedMotion` keeps a
  `matchMedia` capability check and reports `false` where the environment lacks it, instead of
  throwing
  ([validated by server render falls back to the default and reports not hydrated @9b92906e](../../tests/useSidebarState.test.tsx#L125),
  [validated by an environment without matchMedia reports false and does not throw @2867b75d](../../tests/useReducedMotion.test.tsx#L89)).
- **English strings stay as per-component props for now.** The repo-wide labels convention
  (defaults + `resolveLabels`) is issue 022's contract; these components adopt it there.
- **Directive-checker gap closed.** `scripts/check-client-directives.mjs`'s class rule matches
  `extends Component`/`PureComponent`, bare or through a namespace import (docs/design-notes.md
  decision 1, rule 3; the
  [client-API trigger-list spec](../bowman-ui-client-api-trigger-list/spec.md) owns the
  statement), so a class component such as `ErrorBoundary` needs no `onClick=` handler to be
  caught ([validated by exits non-zero when a class extends Component with no hook and no handler @9e4b3f64](../../tests/client-directives.test.ts#L50)).
- **Visibility test.** `useFocusTrap` treats `display: none` and `visibility: hidden` as hidden (the states that also leave the tab order) and deliberately not opacity: an `opacity-0` element stays tabbable in browsers, and the package's own reveal-on-focus buttons rely on that. Where `checkVisibility` is missing, the `offsetParent` fallback misreports fixed-position descendants as hidden; it is all older engines offer.
- **Retry refocus targets the recovered children only.** `handleRetry` reads the fallback
  root's previous sibling and the set of its siblings, commits the recovery with `flushSync`,
  and focuses the first `FOCUSABLE_SELECTOR` match inside the nodes now standing after that
  previous sibling and before the first sibling that outlived the swap (issue 152).
  A set difference of the container's children would miss the host node React reuses when the
  recovered content is rooted in a `<div>` like the fallback. The happy-path DOM gains no
  wrapper. When the recovered content has no focusable, the boundary focuses the first
  element node of the range - a leading text node is skipped, later nodes are untouched - with
  the transient `tabindex="-1"` that `useFocusGroups` gives a group with no focusable (issue
  199, option A): the attribute is removed on the next animation frame, or restored to its
  prior value when the element carried one, so a screen reader lands on the new content and
  nothing permanent is written into the consumer's DOM. The idiom lives once in
  `src/hooks/focusWithTransientTabIndex.ts`, an internal `"use client"` module both sites
  import and the barrel does not export. Text-only recovered content has no element node to
  focus and leaves focus where the browser put it. An `autoFocus` element among the
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
