# Build contract

Five decisions, settled before the first component moves. Every later E3 issue
cites this file instead of re-deriving them. Evidence paths reference
`re-cinq/Discovery` at `apps/web/` unless stated otherwise.

## 1. `"use client"` is per-file

The directive is added only to files that trigger a client-only rule. Since
issue 137 the trigger list is measured off the AST, not a hand-written hook
enumeration; the four rules, plus the JSX-handler rule, are:

1. **A hook-shaped import**: a named or default import whose imported or
   local name matches `/^use[A-Z]/`, from **any** module specifier - React's
   own hooks, `usePathname` from `next/navigation`, a re-exported Clerk hook,
   a relative `./useWidgetState.js` alike - or a hook-shaped **member access**,
   `React.useState` being the motivating namespace-import form. The member
   rule looks only at the property name, whatever the receiver, so an
   unrelated `config.useLegacyPaths` fires too: the check's fail-safe
   direction, and cheaper than resolving receivers.
2. **A named import of `createContext`**, or a member access named
   `createContext` (`React.createContext`) on the same any-receiver terms.
3. **A class extending `Component` or `PureComponent`**, bare or through a
   namespace import (`React.Component`).
4. **A value-position reference to a measured browser global.** The list is
   the eighteen names probed `undefined` on server Node (`window`,
   `document`, `navigator`, `localStorage`, `sessionStorage`, `matchMedia`,
   `requestAnimationFrame`, `cancelAnimationFrame`, `IntersectionObserver`,
   `ResizeObserver`, `MutationObserver`, `getComputedStyle`, `alert`,
   `history`, `location`, `WebSocket`, `FileReader`, `XMLHttpRequest`);
   `navigator` and `WebSocket` are defined on the Node 22 CI runtime and are
   kept as silent-divergence cases - a server render reaching them throws
   nothing, which is exactly why the static check must carry them. DOM
   **type** names (`HTMLElement`, `Element`, `Node`, `SVGSVGElement`) are
   excluded outright: they are erased at compile time and appear all over
   server-safe code - `Icon.tsx`'s `forwardRef<SVGSVGElement>` is the
   evidence, and an `implements WebSocket` clause on a test double is a type
   position that never fires. A `typeof window` guard still triggers (021 dropped the dead
   guards; this package's policy is directives, not isomorphic guards), and
   a value-position use of a listed name still triggers even where a local
   binding shadows it (the shadowing declaration itself does not) - both are
   the check's fail-safe direction, over-requiring rather than missing a real
   boundary.
5. **An `on[A-Z]` JSX handler**, matched as an AST attribute node - the same
   name inside a comment or a string literal does not fire.

**No escape-hatch pragma.** Following `032`/`078`'s no-opt-out precedent: a
false positive gets the file a directive, or the rule gets narrowed with the
motivating file named in the narrowing PR. A comment that silences the check
would decay into ambient noise the way every lint-disable does.

**Known non-triggers.** Bare `use` is not a trigger, and `use(SomeContext)` -
client-only in practice - is unmatched by every rule here; `078`'s RSC
fixture build is the executable backstop that covers it. A destructured
namespace (`const { useState } = React`) is likewise unmatched: the binding
name is a declaration, not a reference. So are the shapes that put a listed
name in a property or string position rather than a value one -
`React["useState"]`, `globalThis.localStorage`, a handler passed through a
JSX spread (`{...{ onClick: fire }}`). A file whose only client-ness is
rendering an imported client component (a Clerk widget, a pure-JSX
presentational wrapper) is equally invisible to static per-file rules and
belongs to `078` and to `032`'s forbidden-import question.

The directive must be the built file's first **statement**, not its literal
first line - a leading docblock or comment may sit above it.

Evidence:

- `hooks/useDebounce.ts` is the genuine directive-inheritance failure in
  Discovery: it calls `useState` and `useEffect`, carries no directive of its
  own, and works today only because every importer is already a `"use client"`
  file. Imported from a consumer's own server component, it breaks. In this
  package it carries the directive itself.
- `components/icons/Icon.tsx` and `components/icons/index.tsx` are client-free
  by design: `forwardRef` is server-safe, and neither file uses a client-only
  API or handler. They get **no** directive - and neither do the 23 icons,
  which are pure SVG; stamping a directive on them would push needless JS into
  consumers' browser bundles. If the icon extraction (issue 019) finds an icon
  file that does use a client-only API, that file carries the directive and
  this section records the exception.
- `src/index.ts` carries no directive; `dist/index.js` stays a plain
  re-export.
- Recorded exception (023, widened by 024): presentational components of the
  chat surface and the private subcomponents they compose carry the directive
  even when the file happens to reference no client-only API today -
  `InlineThinkingIndicator` shipped that way in 023, and 024 pins
  `ThinkingIndicator` and `ThinkingDots` to the same shape - so a consumer
  importing them from a server component gets a working client boundary
  regardless of which internal a later edit adds state to. The "only" rule
  above reads subject to this exception.

Enforcement: `scripts/check-client-directives.mjs` parses every `src/` file
with `ts.createSourceFile` and fails the build when a file fires any rule
above without the directive as its first statement, and asserts every marked
source file's `dist/**/*.js` counterpart opens with `"use client";` as its
first statement (leading comments and blank lines ignored). Reading imports
off the AST is what lets `src/index.ts` re-export client-only names with no
directive of its own: `export ... from` is not a reference. It runs in
`ci.yml` as the named step "Client directive check". This check is static;
only a Next.js consumer importing from a server component proves the boundary
holds - that verification is `078`'s RSC fixture build.

## 2. One icon system: the local 23-icon set

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

The exported prop type for the 23 icons must be public.
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
- `next` is not a dependency, peer, or dev dependency of the published
  package, and the repo's own installed tree stays free of it -
  `"use client"` is the package's entire Next-facing surface. CI proves the
  installed tree contains no `node_modules/next` (named step "next must be
  absent"). The sole exception is the private, unpublished
  `examples/rsc-fixture` (§ RSC fixture below); both probes read the repo
  root only, which is what keeps the exception scoped.
- `@types/react` and `@types/react-dom` are `devDependencies` only. No
  `peerDependenciesMeta`.

## 5. No path aliases survive the move

Discovery's `@/components/...`, `@/hooks/...` and `@/lib/...` imports become
relative specifiers with explicit `.js` extensions. `tsconfig.json` declares
no `compilerOptions.paths`, and no file under `src/` contains the string
`"@/`. Enforcement is the compiler: `moduleResolution: NodeNext` makes
`npm run typecheck` fail on any extensionless or aliased relative import.

## Labels

How every user-visible or assistive string in the package works, settled by
issue 022 before any string-carrying component beyond `ErrorBoundary` moves.
The default app locale the package serves is Danish, nobody on the delivery
team can review Danish copy, and the client's stated priority is
Danish-specific nuance - so the package ships strings only as overridable
English defaults and the Danish catalogue lives with the consumer that can
review it.

Decisions:

1. **No locale catalogue ships.** No `da.json`, no `locales/`, no `Intl`
   message format, no i18n runtime dependency (`next-intl` is lint-banned).
   English defaults exist purely so a consumer can render a screen before
   writing a catalogue; Danish strings belong to the consumer app, the only
   place anyone can review them.
2. **One prop shape: `labels?: Partial<XLabels>`.** Never `strings`, `texts`,
   `t`, `messages`, `i18n`, `translations`, or a render prop (the alternates
   are lint-banned as prop names). Each component co-locates its type
   `XLabels` and `defaultXLabels: Readonly<Required<XLabels>>`, so a key added
   without a default is a compile error rather than `undefined` in the DOM.
   The merge helper is
   `resolveLabels<T extends object>(defaults: Required<T>, overrides?: Partial<T>): Required<T>`
   - a shallow merge that treats an explicit `undefined` override the same as
     a missing one, since that is what a consumer's own optional-chained
     catalogue lookup produces. `ErrorBoundary`
     (`ErrorBoundaryLabels`/`defaultErrorBoundaryLabels`) is the worked example
     every later component copies.
3. **Composites take a flat union, forwarded as slices.** A component that
   renders another labelled component takes the flat union of its own keys and
   its children's - no nesting, no deep merge, no context provider. Key names
   are therefore unique across the package by _concept_, not by component: two
   different "close" actions become `closeMenu` and `dismissToast`, never two
   keys both named `close`.
4. **A label that interpolates a value is a function** -
   `deletedCount: (count: number) => string` - never a template string with
   placeholders. Danish word order and plural rules differ from English, and a
   placeholder syntax would force the package to own a message-format runtime.
   `useFocusGroups({ announce })` already uses this form; it generalises to
   every interpolated label.
5. **A label may be declared required** - present in `XLabels`, absent from
   `defaultXLabels` - when a plausible English default would itself be the
   defect. Enforcement of all of the above is static and at test time (the
   export-partition test, the sentinel render test, and the
   `no-restricted-syntax`/`no-restricted-imports` entries in
   `eslint.config.mjs`), never a runtime console warning: the package writes
   nothing to the console, per 021's GDPR rider.

**Required label: `aiDisclosure`.** The message-list container's AI-disclosure
line is declared required with **no default**. The EU AI Act obliges telling
users they are talking to an AI, and the Act applies because the agent serves
EU users regardless of where it is hosted - so a consumer cannot render the
chat surface without supplying the sentence, and no plausible English default
may paper over the omission. The label is declared here; the component that
renders it and its Danish wording belong to the message-list issue and to the
consumer's catalogue. Because the label is required, `ChatMessageList` (078)
is the one component whose `labels` prop is itself required, typed
`Partial<ChatMessageListLabels> & Required<Pick<ChatMessageListLabels, "aiDisclosure">>`.
Decision 2's optional `labels?` shape reads subject to that single
exception; every other key still defaults per key.

**The three `stringPropOnly` exceptions** (every other string-carrying export
takes `labels`):

- **The icons' `ariaLabel` prop** (all 23 icons). An icon carries at most one
  assistive string and is decorative - `aria-hidden` - unless the call site
  supplies one, so a one-key labels object would add ceremony without adding
  safety. `LoadingIcon`'s `"Loading"` destructuring default is the icon set's
  only English string and is overridable per call site (020's shipped
  precedent, re-pinned by 022's tests).
- **`useFocusGroups`' `announce` option.** A hook has no JSX props surface;
  its single announcement string already arrives as the function-form label of
  decision 4, with an overridable English default and `null` to suppress
  (021's shipped precedent).
- **`Toast`'s `message` prop.** The message is caller-supplied content with
  nothing to default - the toast exists to display whatever transient
  sentence the consumer already owns, so a one-key labels wrapper would add
  ceremony without adding safety, the same shape as the icons' `ariaLabel`
  and `useFocusGroups`' `announce`. Added by issue 025, which amended this
  list in the same PR per the closed-list rule in
  `specs/bowman-ui-labels-convention/spec.md`.

**Factories carrying strings sit in `labelsProp` too.** Issue 076's
`createMarkdownComponents(options)` is not a component, but its result renders
the `linkOpensInNewTab` notice, so it takes the convention's shape -
`options.labels?: Partial<MarkdownComponentsLabels>` over frozen English
defaults - and lives in the `labelsProp` partition bucket with its own
sentinel harness, not in the closed `stringPropOnly` list. `ChatMessage`
forwards its resolved `linkOpensInNewTab` slice to the factory, decision 3's
flat-union forwarding.

## Toast (issue 025)

- The component has **zero reachable call sites in Discovery**: `Toast` is
  rendered only behind `{toastMessage && ...}`, and `setToastMessage` is
  called only with `null` inside the toast's own `onClose` - the inline
  "Copied!" span at `ChatMessage.tsx:214` replaced it. It has never rendered
  in Discovery's production; it shipped on the thin-call-site-evidence
  precedent 021's Why section set for
  `useReducedMotion`/`useSidebarState`/`ErrorBoundary`, and `025` named the
  escalation and failover paths as its future users. Both declined it
  (`054` renders the escalation hand-off in the transcript; `064` keeps a
  successful failover silent, reporting failure through `044`'s error
  frame), so the component is dead in the app it came from and live in the
  app it was extracted for: its only consumer in the org, measured by
  `097`, is `044-support-agent-chat-wiring`'s `ChatScreen.tsx` in the
  support agent, which mounts it twice - a reconnect notice and a
  connection-failed notice.
- Both of `044`'s uses are conditions that persist, not messages that fade,
  and pass `duration={null}` once `098` lands - the persistence rule `064`
  settled, applied at both `ChatScreen.tsx` call sites by
  `098-support-agent-persistent-connection-notices` (`044` shipped the
  notices on the default; `098`, open as this correction lands, sets the
  prop). No consumer passes a number, so once `098` lands the 2000ms default
  has no shipped caller; the default stays only because `015`'s
  characterization suite pins it.
- `duration={null}` disables auto-dismiss entirely: `setTimeout` is never
  invoked, the library ships no close button, and dismissal is therefore
  entirely the consumer's - unmounting the element is the only way out in
  that mode, and a toast a consumer forgets to unmount occupies the
  `fixed bottom-8 left-1/2 z-50` overlay for the life of the page.
- The close-button question `025` left open pending a real consumer is
  closed by `097`, not re-opened: both of `044`'s uses are persistent
  states, so a close button would let a customer dismiss a condition that is
  still true, and the `dismissToast` label it would need (§ Labels
  decision 3's key-naming example) would pull `Toast` out of the
  `stringPropOnly` partition.
- The toast positions itself with a fixed `z-50` overlay
  (`fixed bottom-8 left-1/2 z-50 -translate-x-1/2`), and takes no
  `className`: the positioning and the fade animation's restated `-50%`
  translate are one decision that stays together. A consumer needing
  different placement renders its own element instead of overriding this
  one.

## renderLink (issue 029)

`ConversationList`'s `renderLink(item, props)` slot is the package's routing
seam: the org has two conversation lists and two routers (`next/link` in
Discovery, Ember's `LinkTo` in the-expert-ui), so the row's interactive element
is the consumer's. The consumer's element must spread **every** prop it is
handed - `className`, `children`, `onClick` and `aria-current` alike. Dropping
`onClick` silently breaks `onSelect` (and any consumer behaviour hung on it,
such as Discovery's mobile-sidebar-closing `onNavigate`); dropping
`aria-current` silences the active row for assistive tech. The default, when
no `renderLink` is passed, is `<button type="button" {...props} />`.

## renderNavLink (issue 031)

`AppSidebar`'s `renderNavLink(item, props)` slot is the same routing seam for
the navigation map: the item plus a fully formed props object. The consumer's
element must spread **every** prop it is handed - `className`, `children`,
`onClick` and `aria-current` alike. Dropping `onClick` silently breaks
`onNavigate` (and any consumer behaviour hung on it, such as closing the
mobile drawer); dropping `aria-current` silences the active item for
assistive tech. The default, when no `renderNavLink` is passed, is
`<button type="button" {...props} />`. A nav item carries its resolved
`label` and no `href` - routing belongs entirely to the consumer's
`renderNavLink`.

## AppShell (issue 030)

- **A consumer controlling `mobileSidebarOpen` owns closing it on
  navigation.** The source app closed the drawer in a `usePathname` effect;
  that behaviour is app-router-specific and cannot ship in the library. In
  uncontrolled mode the drawer closes itself on the close button, `Escape`,
  the backdrop, and the `close()` handed to the `"mobile"` sidebar slot -
  route changes are invisible to it either way.
- **Landmark ruling.** AppShell's drawer and rail wrappers are non-landmark
  `div`s: the sidebar content that `renderSidebar` returns (issue 031's
  `AppSidebar`) supplies the only `aside`/`nav` landmarks. Discovery's third
  `aria-label` string, `"Mobile navigation"` on the drawer `aside`, is
  deliberately dropped - keeping it would nest a labelled landmark around the
  sidebar's own and double up in the rotor.
- The two mobile-drawer accessibility defects are fixed in the extracted
  copy, not the source: the closed drawer gets `inert` instead of
  `aria-hidden` over still-tabbable content, and the body scroll lock
  restores the prior `document.body.style.overflow` value instead of
  clobbering it to `""`.

Third deliberate fix: the mobile header stacks at `z-40` beneath the
drawer/backdrop's `z-50` (the source gave both `z-50` and relied on DOM
order).

Fourth deliberate fix (the 2026-08-26 review): the open drawer is a modal
dialog to assistive tech - `role="dialog"`, `aria-modal="true"`, named by the
`sidebarDialog` label ("Menu") - and the hamburger carries
`aria-expanded`/`aria-controls`. This does not revisit the landmark ruling:
`dialog` is not a landmark role, so the sidebar's own `aside`/`nav` still
supply the only rotor entries. The same review scoped the body scroll lock to
the mobile breakpoint: at `min-width: 768px`, where `md:hidden` hides the
drawer, the lock lifts and re-applies if the viewport narrows again.

## Tool activity (issue 108)

`ToolActivity` (108) renders a `ToolChatEntry` - a call the model requested on
the customer's behalf - and it is deliberately the safe default rather than a
faithful dump. `entry.toolInput` is **model-authored data**: it may carry a
booking reference, a customer name, or any other identifier the model chose to
pass, and `entry.toolName` is an English machine identifier in a Danish-first
product. So `showToolName` and `showToolInput` both default **`false`**: the
default render is one caller-supplied sentence (`describeTool`, or the
`activity`/`activityDone` label) and an optional icon, with neither the tool
name nor the arguments in the DOM. When `showToolInput` is on, the arguments
render as `JSON.stringify(entry.toolInput, null, 2)` inside a `<pre>` behind a
native `<details>` - never markdown or HTML, so nothing model-authored is
interpreted. Whether a given consumer may turn either flag on is a data-flow
decision recorded by `003-support-conversation-data-flow-record`, not one the
library makes. `ToolActivity` is not a message: it carries no avatar, copy or
feedback affordance, and no `renderEntry` escape hatch exists - the
data-boundary default stays in the library rather than one deadline from a raw
entry dump.

## Layout

`ChatMessageList` (078) owns its scroll region: its root is
`flex min-h-0 flex-1 flex-col` and the transcript scrolls inside
`overflow-y-auto`. That only works when **the parent renders it inside a
bounded flex column** - a chain of `flex` containers with a fixed height at
the top (`h-screen`, `h-dvh`, or an explicit height) and `min-h-0` on every
flex child down to the list. Without `min-h-0` a flex child never shrinks
below its content, the region never overflows, and the page scrolls instead
of the transcript. The library does not set the outer height; that is the
consumer's layout decision.

## RSC fixture (issue 078, Otto#100)

`examples/rsc-fixture` is the executable proof that the `"use client"`
boundary holds for the one consumer shape the package is built for: a Next.js
App Router build compiling the packed tarball with Turbopack. It is the
**only path in the repo where `next` may appear** - in any dependency field or
import. The three checks that keep `next` out everywhere else are unchanged
by this exemption and say so where they run: `check-forbidden-imports.mjs`
reads `src/` only, the "next must be absent" CI step reads the repo root
only, and `scan-forbidden-node-modules.sh` (shared by `consumer-app.sh` and
the `rsc` job) reads the given install tree. All three run beside the fixture
in the `rsc` CI job. A
future edit that widens this exemption beyond `examples/rsc-fixture` must
amend this section first.

**No `"react-server"` export condition.** The package manifest's `exports`
gains no `"react-server"` entry, refused on purpose: the package has no
server-specific build to point it at, and mapping the condition anywhere
would replace Next's own build-time diagnostics - which name the offending
file and hook - with a less informative runtime throw, defeating the
fixture's purpose. The boundary ships as per-file directives (decision 1)
and nothing else.

**Function-valued props do not cross the server boundary.** Measured on
Next 16.3.3 (Turbopack): a server component passing `renderSidebar` to
`AppShell` fails `next build` while prerendering the page, verbatim:

```
Error: Functions cannot be passed directly to Client Components unless you
explicitly expose it by marking it with "use server". Or maybe you meant to
call this function rather than return it.
  {renderSidebar: function renderSidebar, children: ...}
                  ^^^^^^^^^^^^^^^^^^^^^^
```

The rule, recorded in README.md in the same words: a React server component
cannot pass a function across the client boundary - `AppShell`
(`renderSidebar`, `onMobileSidebarOpenChange`), `AppSidebar`
(`renderNavLink`, `onNavigate`, a `SidebarNavItem`'s `icon`), `ChatComposer`
(`onSubmit`), `ChatMessage` and `ChatMessageList` (`onCopy`, `onFeedback`),
`ConversationList` (`renderLink`, `onSelect`, `onDelete`, the
`deleteConversation` label), `ErrorBoundary` (`onError`) and `Toast`
(`onClose`) accept function-valued props, so an App Router consumer supplies
those props from a `"use client"` file. Functions are the case the fixture
exercises; the constraint is React's serialization boundary, which rejects
any non-serializable prop the same way. The fixture's
`app/compose/page.tsx` ships under `"use client"` for exactly this reason,
and `app/client/page.tsx` is the control proving the composition itself is
sound.

## Seams left open on purpose

- `package.json` declares `"sideEffects": ["*.css"]` now, so the stylesheet
  issue (entry point, `@theme` tokens, keyframes, the `prose` decision) can
  land its CSS without a manifest change and without bundlers tree-shaking it
  away.
- The public icon props type is required to exist by this contract; issue 020
  names it (decision 2 above).
