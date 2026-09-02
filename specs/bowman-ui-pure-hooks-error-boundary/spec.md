# bowman-ui pure hooks and ErrorBoundary

Issue: re-cinq/Otto#71 (`021-bowman-ui-pure-hooks-error-boundary`). Every test here is written
fresh against the shipped code.

## What ships

Five hooks under `src/hooks/` and `src/components/ErrorBoundary.tsx`, all exported from the root
barrel with their option types (`FocusGroupsOptions`, `SidebarStateOptions`,
`ErrorBoundaryLabels`). Every file carries `"use client"` as its first statement, verified on the
built output, ships in the tarball with its `.d.ts` and resolves through the `"."`
exports entry for a consumer ([validated by](../../tests/hooks-dist.test.ts#L65),
[L52](../../tests/hooks-dist.test.ts#L52),
[L28](../../tests/hooks-dist.test.ts#L28)).

- `useDebounce` — carries its own `"use client"` directive rather than inheriting it from its
  importers (the directive-inheritance failure docs/design-notes.md decision 1 records). Timing
  pinned at the 299/301ms edges
  with restart-on-change
  ([validated by](../../tests/useDebounce.test.tsx#L19),
  [L36](../../tests/useDebounce.test.tsx#L36)).
- `useReducedMotion(override?: boolean)` — reads no `process.env`
  flag; a boolean override returns as-is without consulting `matchMedia`, and with no override
  the hook tracks `prefers-reduced-motion: reduce` including change events and listener cleanup
  ([validated by](../../tests/useReducedMotion.test.tsx#L34),
  [L47](../../tests/useReducedMotion.test.tsx#L54),
  [L59](../../tests/useReducedMotion.test.tsx#L66),
  [L79](../../tests/useReducedMotion.test.tsx#L86)).
- `useSidebarState(key, {storagePrefix, defaultOpen})` — `storagePrefix` is
  required with no default; the stored key is `${storagePrefix}${key}`, a stored
  value wins over `defaultOpen`, and storage access
  that throws degrades to in-memory state instead of crashing. Omitting `storagePrefix` does not
  compile, via `tests/types/hooks-type-assertions.tsx`
  ([validated by](../../tests/useSidebarState.test.tsx#L33),
  [L51](../../tests/useSidebarState.test.tsx#L57),
  [L59](../../tests/useSidebarState.test.tsx#L65),
  [types](../../tests/hooks-dist.test.ts#L28)).
- `useFocusTrap` — verbatim: first-element focus on open, Tab/Shift+Tab wrap at the ends while
  focus is inside, and pull focus back to an end when it sits outside the open trap (the
  2026-08-26 review's modal-only hardening), Escape closes, and focus returns to the trigger ref
  or the previously active element
  ([validated by](../../tests/useFocusTrap.test.tsx#L72),
  [L78](../../tests/useFocusTrap.test.tsx#L78),
  [L87](../../tests/useFocusTrap.test.tsx#L87), [L96](../../tests/useFocusTrap.test.tsx#L96),
  [L133](../../tests/useFocusTrap.test.tsx#L133),
  [L201](../../tests/useFocusTrap.test.tsx#L201),
  [L211](../../tests/useFocusTrap.test.tsx#L211),
  [L105](../../tests/useFocusTrap.test.tsx#L105),
  [L114](../../tests/useFocusTrap.test.tsx#L114),
  [L122](../../tests/useFocusTrap.test.tsx#L122)).
- `useFocusGroups({announce})` — the hardcoded English `Moved to ${groupName}` and the Tailwind
  `sr-only` class are both gone from the contract: `announce` maps a group name to the
  announcement (English default preserved, `null` suppresses), and the live region is visually
  hidden with
  inline styles and carries no class attribute. F6 order semantics pinned, including
  the fall-back-to-DOM-order quirk where the first F6 lands on the second group
  ([validated by](../../tests/useFocusGroups.test.tsx#L95),
  [L128](../../tests/useFocusGroups.test.tsx#L128),
  [L71](../../tests/useFocusGroups.test.tsx#L71),
  [L41](../../tests/useFocusGroups.test.tsx#L41),
  [L49](../../tests/useFocusGroups.test.tsx#L49),
  [L63](../../tests/useFocusGroups.test.tsx#L63)).
- `ErrorBoundary` — the `console.error` call is gone: `onError` is the only reporting channel,
  and rendering a thrown error writes nothing to the console and nothing to localStorage — the
  GDPR zero-retention rider on the error text. The three English strings became
  `labels?: Partial<ErrorBoundaryLabels>` merged over English defaults; a `fallback` node wins
  over labels; retry re-renders children
  ([validated by](../../tests/ErrorBoundary.test.tsx#L148),
  [L44](../../tests/ErrorBoundary.test.tsx#L44),
  [L58](../../tests/ErrorBoundary.test.tsx#L58),
  [L88](../../tests/ErrorBoundary.test.tsx#L92),
  [L100](../../tests/ErrorBoundary.test.tsx#L104)).

No built file reads `process.env`, and no `NEXT_PUBLIC_FLAG_ANIMATIONS`
string survives in `src/`
([validated by](../../tests/hooks-dist.test.ts#L74)).

## Recorded decisions and limitations

- **Env flag → argument.** `useReducedMotion` reads no
  `process.env.NEXT_PUBLIC_FLAG_ANIMATIONS` flag - a `process.env` read throws under
  non-Next bundlers. The flag
  plumbing stays in the consumer; the hook takes the already-resolved boolean.
- **Storage prefix is consumer-owned.** No default: two apps on one origin must not collide, and
  a baked-in default would silently brand the package's storage keys.
- **Dead `typeof window === "undefined"` guards dropped.** Every file is `"use client"`; the
  guards could never fire in the environments the directive admits.
- **English strings stay as per-component props for now.** The repo-wide labels convention
  (defaults + `resolveLabels`) is issue 022's contract; these components adopt it there.
- **Directive-checker gap recorded.** `scripts/check-client-directives.mjs`'s client-API regex
  matches hooks and `createContext` but not class-component APIs; `ErrorBoundary` is caught only
  via its `onClick=` JSX handler. Widening the trigger list is issue 128's job.
- **jsdom limits.** jsdom reports `offsetParent: null` for everything (stubbed in the focus
  tests) and performs no real focus traversal; these tests pin the handler contract and DOM
  effects. Verification against a real assistive technology is issue 071's job.
