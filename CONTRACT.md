# Build contract

Five decisions, settled before the first component moves. Every later E3 issue
cites this file instead of re-deriving them. Evidence paths reference
`re-cinq/Discovery` at `apps/web/` unless stated otherwise.

## 1. `"use client"` is per-file

The directive is added only to files that use a client-only React API
(`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useReducer`,
`useContext`, `useLayoutEffect`, `useSyncExternalStore`, `createContext`) or an
`on[A-Z]` JSX handler. It must be the built file's first **statement**, not its
literal first line - a leading docblock or comment may sit above it.

Evidence:

- `hooks/useDebounce.ts` is the genuine directive-inheritance failure in
  Discovery: it calls `useState` and `useEffect`, carries no directive of its
  own, and works today only because every importer is already a `"use client"`
  file. Imported from a consumer's own server component, it breaks. In this
  package it carries the directive itself.
- `components/icons/Icon.tsx` and `components/icons/index.tsx` are client-free
  by design: `forwardRef` is server-safe, and neither file uses a client-only
  API or handler. They get **no** directive - and neither do the 24 icons,
  which are pure SVG; stamping a directive on them would push needless JS into
  consumers' browser bundles. If the icon extraction (issue 019) finds an icon
  file that does use a client-only API, that file carries the directive and
  this section records the exception.
- `src/index.ts` carries no directive; `dist/index.js` stays a plain
  re-export.

Enforcement: `scripts/check-client-directives.mjs` fails the build when a
`src/` file references a client-only API or handler without the directive as
its first statement, and asserts every marked source file's `dist/**/*.js`
counterpart opens with `"use client";` as its first statement (leading
comments and blank lines ignored). It runs in `ci.yml` as the named step
"Client directive check". This check is static; only a Next.js consumer
importing from a server component proves the boundary holds - that
verification is its own later issue.

## 2. One icon system: the local 24-icon set

`lucide-react` does not come along, in any dependency field. In Discovery it is
used in only three files - `app/chat/page.tsx`, `app/chat/[id]/page.tsx`, and
`components/chat/DevInfoCollapsible.tsx` (which never moves) - three of its
four glyphs already exist locally, and the local set has a tested
accessibility contract (`getAccessibleIconProps`, WCAG 2.1 AA) lucide has no
equivalent for.

Consequences, recorded so no extraction PR "fixes" them:

- `SendIcon` exists locally but is unused - the chat pages send with lucide's
  `ArrowUp` today. Matching that visual is left to whoever adopts the library.
- There is no paperclip icon in the local set and none gets authored: the
  attach button is decorative everywhere it appears today. The composer takes
  an attachment slot instead.

The exported prop type for the 24 icons must be public.
`components/icons/index.tsx:25` declares `BaseIconProps` module-private while
every icon takes it, and the currently-exported `IconProps` (`Icon.tsx:21`, a
`{name: string}` registry-lookup shape) is referenced by nothing else. A
public props type must exist; the icon extraction issue (020) names it.

## 3. The avatar slot is the glyph, not the circle

`assistantAvatar?: ReactNode` fills the circle around what is `LogoIcon` in
Discovery today. The circle itself, its border, and its streaming-state pulse
stay in the library, because the circle's classes carry `message.isStreaming`
state (`animate-pulse-subtle`, the blue border/background swap) that every
consumer would otherwise have to reimplement.

Evidence: `components/chat/ChatMessage.tsx:172-180` on Discovery `main` (the
`AI Avatar` comment, the circle `div` whose classes switch on
`message.isStreaming`, and the `LogoIcon` glyph inside it) and
`components/chat/ThinkingIndicator.tsx:15-18`. Line numbers cite Discovery
`main`; measure against `main`, not a working branch.

No bundled default mark: a component library that ships a fallback logo
silently brands every consumer that forgets the prop. `userInitials: string`,
the user-side avatar fallback, is unaffected and stays required. Implementing
the prop on `ChatMessage` and `ThinkingIndicator` belongs to the component
extraction issues; this file only fixes its shape.

## 4. Peers stay at `^19.0.0` - a testing claim, not a technical floor

Nothing in the extraction set requires React 19: it uses `forwardRef`, the
pre-19 idiom, throughout. React 19.2.0 is what Discovery runs, what CI
installs, and the only version tested - that is what the range claims.
Widening to include React 18 requires a CI matrix that actually installs and
runs green against it, not a manifest edit.

- The icon extraction may **not** rewrite `forwardRef` away as a cleanup: that
  would turn this testing claim into a hard React 19 floor.
- `next` is not a dependency, peer, or dev dependency anywhere -
  `"use client"` is the package's entire Next-facing surface. CI proves the
  installed tree contains no `node_modules/next` (named step "next must be
  absent").
- `@types/react` and `@types/react-dom` are `devDependencies` only. No
  `peerDependenciesMeta`.

## 5. No path aliases survive the move

Discovery's `@/components/...`, `@/hooks/...` and `@/lib/...` imports become
relative specifiers with explicit `.js` extensions. `tsconfig.json` declares
no `compilerOptions.paths`, and no file under `src/` contains the string
`"@/`. Enforcement is the compiler: `moduleResolution: NodeNext` makes
`npm run typecheck` fail on any extensionless or aliased relative import.

## Seams left open on purpose

- `package.json` declares `"sideEffects": ["*.css"]` now, so the stylesheet
  issue (entry point, `@theme` tokens, keyframes, the `prose` decision) can
  land its CSS without a manifest change and without bundlers tree-shaking it
  away.
- The public icon props type is required to exist by this contract; issue 020
  names it (decision 2 above).
