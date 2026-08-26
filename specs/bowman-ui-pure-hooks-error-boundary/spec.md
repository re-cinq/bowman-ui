# bowman-ui pure hooks and ErrorBoundary

Issue: issue 71 (`021-bowman-ui-pure-hooks-error-boundary`). Source: Discovery `main` at
`1aa3647`, read-only — nothing in Discovery changed. None of the six files had a test there; every
test here is written fresh against the extracted copy.

## What ships

Five hooks under `src/hooks/` and `src/components/ErrorBoundary.tsx`, all exported from the root
barrel with their option types (`FocusGroupsOptions`, `SidebarStateOptions`,
`ErrorBoundaryLabels`; [validated by](../../tests/hooks-dist.test.ts#L28)). Every file carries `"use client"` as its first statement, verified on the
built output ([validated by](../../tests/hooks-dist.test.ts#L65)), ships in the tarball with its
`.d.ts` ([validated by](../../tests/hooks-dist.test.ts#L52)) and resolves through the `"."`
exports entry for a consumer ([validated by](../../tests/hooks-dist.test.ts#L28)).

- `useDebounce` — verbatim copy plus the directive it previously inherited from its importers
  (Discovery's one genuine directive-inheritance failure). Timing pinned at the 299/301ms edges
  ([validated by](../../tests/useDebounce.test.tsx#L19)) with restart-on-change
  ([validated by](../../tests/useDebounce.test.tsx#L36)).
- `useReducedMotion(override?: boolean)` — the `process.env.NEXT_PUBLIC_FLAG_ANIMATIONS` read is
  gone; a boolean override returns as-is without consulting `matchMedia`
  ([validated by](../../tests/useReducedMotion.test.tsx#L27)), and with no override the hook
  tracks `prefers-reduced-motion: reduce` including change events and listener cleanup
  ([validated by](../../tests/useReducedMotion.test.tsx#L47),
  [L59](../../tests/useReducedMotion.test.tsx#L59)).
- `useSidebarState(key, {storagePrefix, defaultOpen})` — the `discovery-sidebar-` literal became a
  required `storagePrefix` with no default; the stored key is `${storagePrefix}${key}`
  ([validated by](../../tests/useSidebarState.test.tsx#L27)), a stored value wins over
  `defaultOpen` ([validated by](../../tests/useSidebarState.test.tsx#L51)), and storage access
  that throws degrades to in-memory state instead of crashing
  ([validated by](../../tests/useSidebarState.test.tsx#L59)). Omitting `storagePrefix` does not
  compile ([validated by](../../tests/hooks-dist.test.ts#L28) via
  `tests/types/hooks-type-assertions.tsx`).
- `useFocusTrap` — verbatim: first-element focus on open
  ([validated by](../../tests/useFocusTrap.test.tsx#L71)), Tab/Shift+Tab wrap at the ends only
  ([validated by](../../tests/useFocusTrap.test.tsx#L77),
  [L86](../../tests/useFocusTrap.test.tsx#L86), [L95](../../tests/useFocusTrap.test.tsx#L95),
  [L132](../../tests/useFocusTrap.test.tsx#L132)), Escape closes
  ([validated by](../../tests/useFocusTrap.test.tsx#L104)), and focus returns to the trigger ref
  or the previously active element ([validated by](../../tests/useFocusTrap.test.tsx#L113),
  [L121](../../tests/useFocusTrap.test.tsx#L121)).
- `useFocusGroups({announce})` — the hardcoded English `Moved to ${groupName}` and the Tailwind
  `sr-only` class are both gone from the contract: `announce` maps a group name to the
  announcement (English default preserved, `null` suppresses;
  [validated by](../../tests/useFocusGroups.test.tsx#L71),
  [L96](../../tests/useFocusGroups.test.tsx#L96),
  [L104](../../tests/useFocusGroups.test.tsx#L104)), and the live region is visually hidden with
  inline styles and carries no class attribute
  ([validated by](../../tests/useFocusGroups.test.tsx#L71)). F6 order semantics pinned, including
  the fall-back-to-DOM-order quirk where the first F6 lands on the second group
  ([validated by](../../tests/useFocusGroups.test.tsx#L41),
  [L49](../../tests/useFocusGroups.test.tsx#L49),
  [L63](../../tests/useFocusGroups.test.tsx#L63)).
- `ErrorBoundary` — the `console.error` call is gone: `onError` is the only reporting channel,
  and rendering a thrown error writes nothing to the console and nothing to localStorage — the
  GDPR zero-retention rider on the error text
  ([validated by](../../tests/ErrorBoundary.test.tsx#L113)). The three English strings became
  `labels?: Partial<ErrorBoundaryLabels>` merged over English defaults
  ([validated by](../../tests/ErrorBoundary.test.tsx#L44),
  [L58](../../tests/ErrorBoundary.test.tsx#L58)); a `fallback` node wins over labels
  ([validated by](../../tests/ErrorBoundary.test.tsx#L75)); retry re-renders children
  ([validated by](../../tests/ErrorBoundary.test.tsx#L87)).

No built file reads `process.env`, and neither `NEXT_PUBLIC_FLAG_ANIMATIONS` nor any
`discovery`-prefixed string survives in `src/`
([validated by](../../tests/hooks-dist.test.ts#L73)).

## Recorded decisions and limitations

- **Env flag → argument.** Discovery's `useReducedMotion` read
  `process.env.NEXT_PUBLIC_FLAG_ANIMATIONS`, which throws under any non-Next bundler. The flag
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
