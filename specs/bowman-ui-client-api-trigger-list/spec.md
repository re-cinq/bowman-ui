# bowman-ui client-API trigger list

Issue: re-cinq/Otto#137 (widen `scripts/check-client-directives.mjs` to every client-only API).
The check's old shape was a ten-hook regex plus a textual `on[A-Z]=` pattern; this spec records
the AST rewrite, the measured browser-global table, and the re-run false-negative sweep. The
enforcement prose lives in CONTRACT.md decision 1; this file carries the measurements and the
per-rule pins.

## What ships

`scripts/check-client-directives.mjs` parses every `src/**/*.{ts,tsx}` file with
`ts.createSourceFile` (the `typescript` devDependency; `.tsx` as `ScriptKind.TSX`) and requires
`"use client"` as the first statement - an AST `ExpressionStatement` holding the string literal,
so leading comments stay allowed - whenever any trigger fires. A file that fails to parse is a
violation, never a silent pass. The directory-argument mode (check 1 only) is unchanged and is
what every fixture test uses.

### The four rules

1. **Hook-shaped import, any module specifier.** A named or default import whose imported or
   local name matches `/^use[A-Z]/` ([validated by](../../tests/client-directives.test.ts#L9),
   [L16](../../tests/client-directives.test.ts#L16)), including from a relative specifier - the
   clause that carries the widening
   ([validated by](../../tests/client-directives.test.ts#L23)). A hook-shaped namespace-member
   call (`React.useState(...)`) also fires
   ([validated by](../../tests/client-directives.test.ts#L30)), so the rewrite never narrows
   what the old textual matcher caught. Type-only hook imports are excluded in both the
   `import type {...}` and `import { type ... }` forms
   ([validated by](../../tests/client-directives.test.ts#L66)).
2. **Named import of `createContext`**, imported or local name, the same type-only exclusion
   ([validated by](../../tests/client-directives.test.ts#L37)).
3. **Class heritage `Component`/`PureComponent`**, bare or through a namespace import - both
   shapes pinned in one fixture ([validated by](../../tests/client-directives.test.ts#L44)).
4. **Value-position browser-global reference** from the measured list below
   ([validated by](../../tests/client-directives.test.ts#L52)), including a `typeof window`
   guard ([validated by](../../tests/client-directives.test.ts#L59)) - 021 dropped the dead
   guards, so a guard is evidence of client intent here, and over-requiring is the check's
   fail-safe direction. Type positions never fire; DOM type names are excluded outright (below).

The `on[A-Z]` JSX-handler trigger fires off `JsxAttribute` nodes; the same name inside a line
comment, block comment, or string literal does not fire
([validated by](../../tests/client-directives.test.ts#L66)). The root barrel `src/index.ts`
re-exports 021's six client-only names with no directive and passes, because
`export ... from` is not an import - pinned by the barrel green fixture
([validated by](../../tests/client-directives.test.ts#L66)) and by the full run against
`src/` and `dist/` ([validated by](../../tests/client-directives.test.ts#L71)), which also
holds the two delivered no-directive criteria in the same CI job: no file under `src/icons/`
is flagged (020) and `dist/index.js` stays a plain re-export (018), the latter now asserted as
"every statement is an `ExportDeclaration`" on the built AST.

## Browser-global table, measured on the CI Node

CI's `node-version: "22"` floats to the latest 22.x on every run; at measurement time it
resolved to **v22.23.2** (read from the CI setup-node log of the latest `main` run), and every
probe below was run with `node -e` on exactly v22.23.2, not a developer default. The float is
harmless to the trigger list: a name a future 22.x defines gets kept as a silent-divergence
case, which changes nothing in the list (see the rule).

| Name                    | Node v20.19.5 (issue baseline) | Node v22.23.2 (CI) | In trigger list         |
| ----------------------- | ------------------------------ | ------------------ | ----------------------- |
| `window`                | undefined                      | undefined          | yes                     |
| `document`              | undefined                      | undefined          | yes                     |
| `navigator`             | undefined                      | **defined**        | yes - silent divergence |
| `localStorage`          | undefined                      | undefined          | yes                     |
| `sessionStorage`        | undefined                      | undefined          | yes                     |
| `matchMedia`            | undefined                      | undefined          | yes                     |
| `requestAnimationFrame` | undefined                      | undefined          | yes                     |
| `cancelAnimationFrame`  | undefined                      | undefined          | yes                     |
| `IntersectionObserver`  | undefined                      | undefined          | yes                     |
| `ResizeObserver`        | undefined                      | undefined          | yes                     |
| `MutationObserver`      | undefined                      | undefined          | yes                     |
| `getComputedStyle`      | undefined                      | undefined          | yes                     |
| `alert`                 | undefined                      | undefined          | yes                     |
| `history`               | undefined                      | undefined          | yes                     |
| `location`              | undefined                      | undefined          | yes                     |
| `WebSocket`             | undefined                      | **defined**        | yes - silent divergence |
| `FileReader`            | undefined                      | undefined          | yes                     |
| `XMLHttpRequest`        | undefined                      | undefined          | yes                     |

The two divergences from the v20.19.5 baseline are exactly the two the issue predicted:
`navigator` (a global since Node 21) and `WebSocket` (enabled by default since Node 22). Both
are **kept and marked silent-divergence**: defined on the server runtime means a component that
wrongly renders on the server throws nothing at render, which is precisely why the static check
must carry them - the runtime stopped being able to catch the mistake. Probed defined and
therefore excluded, unchanged from the baseline: `fetch`, `crypto`, `URL`, `performance`,
`structuredClone`, `Blob`, `Event`, `CustomEvent`.

DOM **type** names (`HTMLElement`, `Element`, `Node`, `SVGSVGElement`) are excluded outright:
erased at compile time and used all over server-safe code - `src/icons/Icon.tsx`'s
`forwardRef<SVGSVGElement>` and `src/hooks/useFocusTrap.ts`'s type-only references are the
in-repo evidence.

## False-negative sweep, re-run under the new rules

Method: against `re-cinq/Discovery` `main` at `1aa3647fa5f75997ceea6bdc11f3fa66cea79b29` (the
same commit 021's spec cites), every `apps/web/components/` and `apps/web/hooks/` file carrying
`"use client"` - 52 files - was copied with the directive stripped and the check run against
the copies; a file the check then fails to flag is a false negative.

- **Old rules (re-measured): 9 of 52.** The issue's Why section says six; the same sweep on the
  same tree measures nine (`Header.tsx`, `SkipLink.tsx`, `app-shell/AppSidebar.tsx`,
  `auth/OrgSwitcher.tsx`, `auth/UserMenu.tsx`, `chat/ThinkingIndicator.tsx`,
  `clerk/AppOrganizationSwitcher.tsx`, `clerk/AppUserButton.tsx`, `hooks/useOrganization.ts` -
  each verified to match neither the ten-hook regex nor the textual `on[A-Z]=` pattern). The
  issue's figure undercounted; the direction of the finding stands either way.
- **New rules: 3 of 52**, every remaining miss named:
  - `components/chat/ThinkingIndicator.tsx` - pure JSX, no handler, no hook, no browser global.
  - `components/clerk/AppUserButton.tsx` - renders Clerk's `UserButton`; its client-ness lives
    entirely in the imported component.
  - `components/clerk/AppOrganizationSwitcher.tsx` - same shape.

  All three are composition-only files whose client requirement is invisible to per-file static
  rules; they are 078's territory (the RSC fixture build exercises the real boundary) and, for
  the Clerk pair, adjacent to 032's forbidden-import question. No static rule short of "every
  `.tsx` file is client" catches them, and that rule would wrongly flag the icons (020).

## Widening impact on src/

Zero files under `src/` turned red under the new rules: the full run exits 0 against `src/` and
`dist/` ([validated by](../../tests/client-directives.test.ts#L71)), so no file gains
`"use client"` in this change and no shipped issue is named - the expected count held.

## Recorded decisions and limitations

- **No escape-hatch pragma** (CONTRACT.md decision 1): a false positive gets the file a
  directive, or the rule gets narrowed with the motivating file named - 032/078's no-opt-out
  precedent.
- **Bare `use` is not a trigger**, and `use(SomeContext)` - client-only in practice - is
  unmatched by every rule here; 078's RSC fixture build covers it.
- **No scope analysis.** A local binding shadowing a listed global (`function f(location)`)
  still triggers. Deliberate: skipping file-wide declared names would let a shadow in one
  function silence a genuine global reference in another - a false negative in a check whose
  contract is fail-safe over-requiring. No file in `src/` or in the Discovery sweep set hits
  this; if one ever does, the no-pragma protocol applies.
- **`typeof window` triggers** ([validated by](../../tests/client-directives.test.ts#L59)) -
  see rule 4.
- **Parse failure is a violation, not a silent pass.** A wrong `ScriptKind` or a malformed
  file would otherwise yield an empty tree with zero triggers - the quietest possible false
  negative. No committed fixture pins this: a deliberately unparseable file would fail the
  repo-wide `eslint .` and `prettier --check .` gates it sat under.
