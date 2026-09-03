# bowman-ui pure hooks and ErrorBoundary

Issue: issue 71 (`021-bowman-ui-pure-hooks-error-boundary`). Every test here is written
fresh against the shipped code.

## What ships

Five hooks under `src/hooks/` and `src/components/ErrorBoundary.tsx`, all exported from the root
barrel with their option types (`FocusGroupsOptions`, `SidebarStateOptions`,
`ErrorBoundaryLabels`). Every file carries `"use client"` as its first statement, verified on the
built output, ships in the tarball with its `.d.ts` and resolves through the `"."`
exports entry for a consumer ([validated by](../../tests/hooks-dist.test.ts#L70),
[L52](../../tests/hooks-dist.test.ts#L56),
[L28](../../tests/hooks-dist.test.ts#L31)).

- `useDebounce` — carries its own `"use client"` directive rather than inheriting it from its
  importers (the directive-inheritance failure docs/design-notes.md decision 1 records). Timing
  pinned at the 299/301ms edges
  with restart-on-change
  ([validated by](../../tests/useDebounce.test.tsx#L19),
  [L36](../../tests/useDebounce.test.tsx#L36)).
- `useReducedMotion(override?: boolean)` — reads no `process.env`
  flag; a boolean override returns as-is without consulting `matchMedia`, and with no override
  the hook tracks `prefers-reduced-motion: reduce` including change events and listener cleanup
  ([validated by](../../tests/useReducedMotion.test.tsx#L42),
  [L47](../../tests/useReducedMotion.test.tsx#L62),
  [L59](../../tests/useReducedMotion.test.tsx#L75),
  [L79](../../tests/useReducedMotion.test.tsx#L97)).
- `useSidebarState(key, {storagePrefix, defaultOpen})` — `storagePrefix` is
  required with no default; the stored key is `${storagePrefix}${key}`, a stored
  value wins over `defaultOpen`, and storage access
  that throws degrades to in-memory state instead of crashing. Omitting `storagePrefix` does not
  compile, via `tests/types/hooks-type-assertions.tsx`
  ([validated by](../../tests/useSidebarState.test.tsx#L34),
  [L51](../../tests/useSidebarState.test.tsx#L58),
  [L59](../../tests/useSidebarState.test.tsx#L66),
  [types](../../tests/hooks-dist.test.ts#L31)).
- `useFocusTrap` — verbatim: first-element focus on open, Tab/Shift+Tab wrap at the ends while
  focus is inside, and pull focus back to an end when it sits outside the open trap (the
  2026-08-26 review's modal-only hardening), Escape closes, and focus returns to the trigger ref
  or the previously active element
  ([validated by](../../tests/useFocusTrap.test.tsx#L73),
  [L78](../../tests/useFocusTrap.test.tsx#L79),
  [L87](../../tests/useFocusTrap.test.tsx#L88), [L96](../../tests/useFocusTrap.test.tsx#L97),
  [L133](../../tests/useFocusTrap.test.tsx#L137),
  [L201](../../tests/useFocusTrap.test.tsx#L212),
  [L211](../../tests/useFocusTrap.test.tsx#L222),
  [L105](../../tests/useFocusTrap.test.tsx#L106),
  [L114](../../tests/useFocusTrap.test.tsx#L116),
  [L122](../../tests/useFocusTrap.test.tsx#L124)).
- `useFocusGroups({announce})` — the hardcoded English `Moved to ${groupName}` and the Tailwind
  `sr-only` class are both gone from the contract: `announce` maps a group name to the
  announcement (English default preserved, `null` suppresses), and the live region is visually
  hidden with
  inline styles and carries no class attribute. F6 order semantics pinned, including
  the fall-back-to-DOM-order quirk where the first F6 lands on the second group
  ([validated by](../../tests/useFocusGroups.test.tsx#L100),
  [L128](../../tests/useFocusGroups.test.tsx#L134),
  [L71](../../tests/useFocusGroups.test.tsx#L73),
  [L41](../../tests/useFocusGroups.test.tsx#L43),
  [L49](../../tests/useFocusGroups.test.tsx#L51),
  [L63](../../tests/useFocusGroups.test.tsx#L65)).
- `ErrorBoundary` — the `console.error` call is gone: `onError` is the only reporting channel,
  and rendering a thrown error writes nothing to the console and nothing to localStorage — the
  GDPR zero-retention rider on the error text. The three English strings became
  `labels?: Partial<ErrorBoundaryLabels>` merged over English defaults; a `fallback` node wins
  over labels; retry re-renders children
  ([validated by](../../tests/ErrorBoundary.test.tsx#L156),
  [L44](../../tests/ErrorBoundary.test.tsx#L46),
  [L58](../../tests/ErrorBoundary.test.tsx#L61),
  [L88](../../tests/ErrorBoundary.test.tsx#L97),
  [L100](../../tests/ErrorBoundary.test.tsx#L109)).

No built file reads `process.env`, and no `NEXT_PUBLIC_FLAG_ANIMATIONS`
string survives in `src/`
([validated by](../../tests/hooks-dist.test.ts#L80)).

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
