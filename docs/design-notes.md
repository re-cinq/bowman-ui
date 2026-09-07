# Design notes

The decisions that shape this package, recorded once so later changes cite
this file instead of re-deriving them. Five numbered decisions come first;
the named sections after them grew around individual components and slots.

## 1. `"use client"` is per-file

The directive is added only to files that trigger a client-only rule. The
trigger list is measured off the AST, not a hand-written hook enumeration;
the four rules, plus the JSX-handler rule, are:

1. **A hook-shaped import**: a named or default import whose imported or
   local name matches `/^use[A-Z]/`, from **any** module specifier - React's
   own hooks, a router hook, a re-exported third-party hook, a relative
   `./useWidgetState.js` alike - or a hook-shaped **member access**,
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
   position that never fires. A `typeof window` guard still triggers (this
   package's policy is directives, not isomorphic guards), and a
   value-position use of a listed name still triggers even where a local
   binding shadows it (the shadowing declaration itself does not) - both are
   the check's fail-safe direction, over-requiring rather than missing a real
   boundary.
5. **An `on[A-Z]` JSX handler**, matched as an AST attribute node - the same
   name inside a comment or a string literal does not fire.

**No escape-hatch pragma.** A false positive gets the file a directive, or
the rule gets narrowed with the motivating file named in the narrowing PR. A
comment that silences the check would decay into ambient noise the way every
lint-disable does.

**Known non-triggers.** Bare `use` is not a trigger, and `use(SomeContext)` -
client-only in practice - is unmatched by every rule here; the RSC fixture
build (§ RSC fixture) is the executable backstop that covers it. A
destructured namespace (`const { useState } = React`) is likewise unmatched:
the binding name is a declaration, not a reference. So are the shapes that
put a listed name in a property or string position rather than a value one -
`React["useState"]`, `globalThis.localStorage`, a handler passed through a
JSX spread (`{...{ onClick: fire }}`). A file whose only client-ness is
rendering an imported client component (a pure-JSX presentational wrapper)
is equally invisible to static per-file rules and belongs to the RSC fixture
and to the forbidden-import scan.

The directive must be the built file's first **statement**, not its literal
first line - a leading docblock or comment may sit above it.

Recorded shapes:

- `hooks/useDebounce.ts` carries the directive itself. A hook file that
  calls `useState` and `useEffect` without its own directive works only as
  long as every importer is already a `"use client"` file; imported from a
  consumer's own server component, it breaks. Directive inheritance is not a
  boundary.
- `icons/Icon.tsx` and `icons/index.tsx` are client-free by design:
  `forwardRef` is server-safe, and neither file uses a client-only API or
  handler. They get **no** directive - and neither do the 23 icons, which
  are pure SVG; stamping a directive on them would push needless JS into
  consumers' browser bundles. If an icon file ever does use a client-only
  API, that file carries the directive and this section records the
  exception.
- `src/index.ts` carries no directive; `dist/index.js` stays a plain
  re-export.
- Recorded exception: presentational components of the chat surface and the
  private subcomponents they compose carry the directive even when the file
  happens to reference no client-only API today - `InlineThinkingIndicator`,
  `ThinkingIndicator` and `ThinkingDots` ship that way - so a consumer
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
only a Next.js consumer importing from a server component proves the
boundary holds - that verification is the RSC fixture build.

## 2. One icon system: an in-repo 23-icon set, no icon dependency

Two facts hold at once and must not be collapsed into one.

First, the code dependency: `lucide-react` does not come along, in any
dependency field, and no `src/` file imports it.
`scripts/check-forbidden-imports.mjs` fails the build on a `lucide-react`
import and names this decision as the reason. The local set carries a tested
accessibility contract (`getAccessibleIconProps`, WCAG 2.1 AA) that an icon
dependency has no equivalent for.

Second, the artwork: the 23 glyphs are not original. Their SVG path data is
adapted from - and includes modified versions of - Lucide (ISC, with a
Feather-derived subset under MIT) and Heroicons v1/v2 (MIT, Tailwind Labs).
No runtime dependency contradicts this: only the path data was copied and
reshaped, then wrapped in the local accessibility layer. The upstream
copyright and license notices are reproduced in `THIRD-PARTY-NOTICES.md`,
which ships in the published package. Attribution is at the set level;
exact per-icon provenance is not tracked.

Consequences, recorded so no cleanup PR "fixes" them:

- `SendIcon` exists but no shipped component renders it. Which glyph a send
  button shows is a product choice; the set carries the icon so a consumer
  can make it without adding a dependency.
- There is no paperclip icon in the set and none gets authored: the attach
  affordance is decorative in the surfaces this package targets. The
  composer takes an attachment slot instead.

The exported prop type for the 23 icons is public: `IconProps`
(`{className?, ariaLabel?, strokeWidth?}`), exported from the package root.

## 3. The avatar slot is the glyph, not the circle

`assistantAvatar?: ReactNode` fills the circle around the assistant's mark.
The circle itself, its border, and its streaming-state pulse stay in the
library, because the circle's classes carry `message.isStreaming` state
(`animate-pulse-subtle`, the blue border/background swap) that every
consumer would otherwise have to reimplement.

No bundled default mark: a component library that ships a fallback logo
silently brands every consumer that forgets the prop. `userInitials: string`,
the user-side avatar fallback, is unaffected and stays required.

## 4. Peers stay at `^19.0.0` - a testing claim, not a technical floor

Nothing in the package requires React 19: it uses `forwardRef`, the pre-19
idiom, throughout. React 19.2.0 is what CI installs and the only version
tested - that is what the range claims. Widening to include React 18
requires a CI matrix that actually installs and runs green against it, not a
manifest edit.

- No cleanup may rewrite `forwardRef` away: that would turn this testing
  claim into a hard React 19 floor.
- `next` is not a dependency, peer, or dev dependency of the published
  package, and the repo's own installed tree stays free of it -
  `"use client"` is the package's entire Next-facing surface. CI proves the
  installed tree contains no `node_modules/next` (named step "next must be
  absent"). The sole exception is the private, unpublished
  `examples/rsc-fixture` (§ RSC fixture below); both probes read the repo
  root only, which is what keeps the exception scoped.
- `@types/react` and `@types/react-dom` are `devDependencies` only. No
  `peerDependenciesMeta`.

## 5. No path aliases

Every internal import is a relative specifier with an explicit `.js`
extension. `tsconfig.json` declares no `compilerOptions.paths`, and no file
under `src/` contains the string `"@/`. Enforcement is the compiler:
`moduleResolution: NodeNext` makes `npm run typecheck` fail on any
extensionless or aliased relative import.

## Labels

How every user-visible or assistive string in the package works. A component
library cannot review copy in the locales its consumers ship: only the
consumer app can put a reviewed sentence in front of its users. So the
package ships strings only as overridable English defaults, and every
reviewed catalogue - whatever the language - lives with the consumer that
can review it.

Decisions:

1. **No locale catalogue ships.** No `locales/`, no `Intl` message format,
   no i18n runtime dependency (`next-intl` is lint-banned). English defaults
   exist purely so a consumer can render a screen before writing a
   catalogue; reviewed translations belong to the consumer app, the only
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
     (`ErrorBoundaryLabels`/`defaultErrorBoundaryLabels`) is the worked
     example every other component copies.
3. **Composites take a flat union, forwarded as slices.** A component that
   renders another labelled component takes the flat union of its own keys and
   its children's - no nesting, no deep merge, no context provider. Key names
   are therefore unique across the package by _concept_, not by component: two
   different "close" actions become `closeMenu` and `dismissToast`, never two
   keys both named `close`.
4. **A label that interpolates a value is a function** -
   `deletedCount: (count: number) => string` - never a template string with
   placeholders. Word order and plural rules differ across languages, and a
   placeholder syntax would force the package to own a message-format
   runtime. `useFocusGroups({ announce })` already uses this form; it
   generalises to every interpolated label.
5. **A label may be declared required** - present in `XLabels`, absent from
   `defaultXLabels` - when a plausible English default would itself be the
   defect. Enforcement of all of the above is static and at test time (the
   export-partition test, the sentinel render test, and the
   `no-restricted-syntax`/`no-restricted-imports` entries in
   `eslint.config.mjs`), never a runtime console warning: the package writes
   nothing to the console, per the GDPR no-egress rule.

**Required label: `aiDisclosure`.** The message-list container's AI-disclosure
line is declared required with **no default**. The EU AI Act obliges telling
users they are talking to an AI, and the Act applies because a chat surface
built with this package can serve EU users regardless of where it is hosted -
so a consumer cannot render the chat surface without supplying the sentence,
and no plausible English default may paper over the omission. Because the
label is required, `ChatMessageList` is the one component whose `labels`
prop is itself required, typed
`Partial<ChatMessageListLabels> & Required<Pick<ChatMessageListLabels, "aiDisclosure">>`.
Decision 2's optional `labels?` shape reads subject to that single
exception; every other key still defaults per key.

**The three `stringPropOnly` exceptions** (every other string-carrying export
takes `labels`):

- **The icons' `ariaLabel` prop** (all 23 icons). An icon carries at most one
  assistive string and is decorative - `aria-hidden` - unless the call site
  supplies one, so a one-key labels object would add ceremony without adding
  safety. `LoadingIcon`'s `"Loading"` destructuring default is the icon set's
  only English string and is overridable per call site.
- **`useFocusGroups`' `announce` option.** A hook has no JSX props surface;
  its single announcement string already arrives as the function-form label of
  decision 4, with an overridable English default and `null` to suppress.
- **`Toast`'s `message` prop.** The message is caller-supplied content with
  nothing to default - the toast exists to display whatever transient
  sentence the consumer already owns, so a one-key labels wrapper would add
  ceremony without adding safety, the same shape as the icons' `ariaLabel`
  and `useFocusGroups`' `announce`. Adding a fourth member to this closed
  list requires amending it here, in the same PR, per the closed-list rule
  in `specs/bowman-ui-labels-convention/spec.md`.

**Factories carrying strings sit in `labelsProp` too.**
`createMarkdownComponents(options)` is not a component, but its result
renders the `linkOpensInNewTab` notice, so it takes the convention's shape -
`options.labels?: Partial<MarkdownComponentsLabels>` over frozen English
defaults - and lives in the `labelsProp` partition bucket with its own
sentinel harness, not in the closed `stringPropOnly` list. `ChatMessage`
forwards its resolved `linkOpensInNewTab` slice to the factory, decision 3's
flat-union forwarding.

## Toast

- The component targets conditions that persist - a reconnect notice, a
  connection-failed notice - not messages that fade. A consumer showing a
  persistent condition passes `duration={null}`; the 2000ms auto-dismiss
  default stays because the characterization suite pins it, not because any
  known consumer relies on it.
- `duration={null}` disables auto-dismiss entirely: `setTimeout` is never
  invoked, the library ships no close button, and dismissal is therefore
  entirely the consumer's - unmounting the element is the only way out in
  that mode, and a toast a consumer forgets to unmount occupies the
  `fixed bottom-8 left-1/2 z-50` overlay for the life of the page.
- No close button ships, on purpose: the component's uses are persistent
  states, so a close button would let a user dismiss a condition that is
  still true, and the `dismissToast` label it would need (§ Labels
  decision 3's key-naming example) would pull `Toast` out of the
  `stringPropOnly` partition.
- The toast positions itself with a fixed `z-50` overlay
  (`fixed bottom-8 left-1/2 z-50 -translate-x-1/2`), and takes no
  `className`: the positioning and the fade animation's restated `-50%`
  translate are one decision that stays together. A consumer needing
  different placement renders its own element instead of overriding this
  one.

## renderLink

`ConversationList`'s `renderLink(item, props)` slot is the package's routing
seam: routing belongs to the consumer, whichever router it uses, so the
row's interactive element is the consumer's. The consumer's element must
spread **every** prop it is handed - `className`, `children`, `onClick` and
`aria-current` alike. Dropping `onClick` silently breaks `onSelect` (and any
consumer behaviour hung on it, such as closing a mobile drawer on
navigation); dropping `aria-current` silences the active row for assistive
tech. The default, when no `renderLink` is passed, is
`<button type="button" {...props} />`.

## renderNavLink

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

## renderEntryFooter

`ChatMessageList`'s `renderEntryFooter(entry)` slot is the per-entry
extension point: whatever it returns is handed to that message's
`ChatMessage` as its existing `footer`, last in the message column under the
action row. Three consequences the consumer owns:

- **Nothing in a footer is announced.** It lands inside the transcript's
  `role="log"`/`aria-live="off"` region, so a screen reader reads it only
  when the reader walks there. A footer whose appearance matters - an error,
  a required disclosure - needs the consumer's own live region outside the
  list.
- **A growing footer does not re-scroll the transcript.** Auto-scroll keys on
  `entries`, not on layout, so a footer that expands after render (an async
  score, a disclosure the reader opens) can push the message above the fold.
  A consumer that wants the view to follow calls
  `ChatMessageListHandle.scrollToBottom()` itself.
- **The callback runs for every rendered entry, user rows included**, and the
  list stores nothing it returns - the node is read in the `ChatMessage` call
  position and nowhere else. `ChatMessage` renders `footer` under assistant
  messages only, so a node returned for a user entry is dropped; filtering by
  role in the callback is the consumer's choice, not the library's.

## AppShell

- **A consumer controlling `mobileSidebarOpen` owns closing it on
  navigation.** Closing the drawer on a route change is router-specific
  behaviour that cannot ship in a router-agnostic library. In uncontrolled
  mode the drawer closes itself on the close button, `Escape`, the backdrop,
  and the `close()` handed to the `"mobile"` sidebar slot - route changes
  are invisible to it either way.
- **Landmark ruling.** AppShell's drawer and rail wrappers are non-landmark
  `div`s: the sidebar content that `renderSidebar` returns (`AppSidebar`)
  supplies the only `aside`/`nav` landmarks. The drawer wrapper deliberately
  carries no landmark label of its own - labelling it would nest a labelled
  landmark around the sidebar's own and double up in the rotor.
- The closed drawer gets `inert` instead of `aria-hidden` over
  still-tabbable content, and the body scroll lock restores the prior
  `document.body.style.overflow` value instead of clobbering it to `""`.

The mobile header stacks at `z-40` beneath the drawer/backdrop's `z-50`, so
the stacking order never depends on DOM order.

The open drawer is a modal dialog to assistive tech - `role="dialog"`,
`aria-modal="true"`, named by the `sidebarDialog` label ("Menu") - and the
hamburger names the drawer through `aria-controls` but deliberately carries no
`aria-expanded`: it only opens, and the open drawer covers it. This does not
revisit the landmark ruling: `dialog` is not a landmark role, so the sidebar's
own `aside`/`nav` still supply the only rotor entries. The body scroll lock is
scoped to the mobile breakpoint: at `min-width: 768px`, where `md:hidden` hides
the drawer, the lock lifts and re-applies if the viewport narrows again.

## Tool activity

`ToolActivity` renders a `ToolChatEntry` - a call the model requested on
the user's behalf - and it is deliberately the safe default rather than a
faithful dump. `entry.toolInput` is **model-authored data**: it may carry a
booking reference, a customer name, or any other identifier the model chose
to pass, and `entry.toolName` is an English machine identifier that may not
match the product's locale. So `showToolName` and `showToolInput` both
default **`false`**: the default render is one caller-supplied sentence
(`describeTool`, or the `activity`/`activityDone` label) and an optional
icon, with neither the tool name nor the arguments in the DOM. When
`showToolInput` is on, the arguments render as
`JSON.stringify(entry.toolInput, null, 2)` inside a `<pre>` behind a native
`<details>` - never markdown or HTML, so nothing model-authored is
interpreted. Whether a given consumer may turn either flag on is a data-flow
decision for that consumer's own compliance record, not one the library
makes. `ToolActivity` is not a message: it carries no avatar, copy or
feedback affordance, and no `renderEntry` escape hatch exists - the
data-boundary default stays in the library rather than one deadline from a
raw entry dump.

`describeTool` is `(entry: ToolChatEntry, pending: boolean) => ReactNode`.
The second parameter is the component's own resolved `pending` prop - the
same value that picks between the `activity` and `activityDone` labels,
defaulting to **`false`** when the prop is omitted - so a caller-authored
sentence can be tensed the way the built-in ones are without re-deriving the
flag. Through `ChatMessageList` it is that list's own derivation,
`busy === true && index === entries.length - 1`: the callback sees exactly
what the list would have used for its own labels. The parameter is additive,
so a one-parameter callback stays assignable and no consumer breaks. It
changes what the callback knows, not what it controls: a supplied
`describeTool` still replaces the tensed labels entirely and suppresses
nothing else.

## Thinking trace

`ThinkingTrace` renders a `ThinkingChatEntry` - the model's own internal
reasoning, which an engine typically produces by parsing literal
`<thinking>` tags out of the model's output. That content is **unreviewed
model output**: nobody reviews its shape the way an assistant answer is
reviewed, and it routinely restates the user's question along with any
identifier the question carried - a booking reference, an order number, a
name. So `ChatMessageList`'s `showThinking` defaults **`false`**: with the
flag absent no `ThinkingTrace` is mounted at all, and none of the thinking
content reaches the DOM. Whether a given consumer may turn it on is a
data-flow decision for that consumer's own compliance record, not one the
library makes. When it is on, the content renders as `whitespace-pre-wrap`
plain text inside a native `<details>`/`<summary>` that is closed by default
and never auto-opens - never markdown or HTML, so nothing model-authored is
interpreted. The `<summary>` carries the `thinkingTrace` label alone, never
a preview of the content. `ThinkingTrace` is not a message: it declares no
`assistantAvatar`, `onCopy`, `onFeedback` or `showFeedback` - internal
deliberation is not an answer to copy or rate. It is also not a disclosure:
a list holding only thinking entries still renders the `aiDisclosure` band.

## Layout

`ChatMessageList` owns its scroll region: its root is
`flex min-h-0 flex-1 flex-col` and the transcript scrolls inside
`overflow-y-auto`. That only works when **the parent renders it inside a
bounded flex column** - a chain of `flex` containers with a fixed height at
the top (`h-screen`, `h-dvh`, or an explicit height) and `min-h-0` on every
flex child down to the list. Without `min-h-0` a flex child never shrinks
below its content, the region never overflows, and the page scrolls instead
of the transcript. The library does not set the outer height; that is the
consumer's layout decision.

## RSC fixture

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
(`onSubmit`), `ChatMessage` and `ChatMessageList` (`onCopy`, `onFeedback`, the
`assistantMessageFrom` label),
`ConversationList` (`renderLink`, `onSelect`, `onDelete`, the
`deleteConversation` label), `ErrorBoundary` (`onError`) and `Toast`
(`onClose`) accept function-valued props, so an App Router consumer supplies
those props from a `"use client"` file. Functions are the case the fixture
exercises; the constraint is React's serialization boundary, which rejects
any non-serializable prop the same way. The fixture's
`app/compose/page.tsx` ships under `"use client"` for exactly this reason,
and `app/client/page.tsx` is the control proving the composition itself is
sound.

## Attribution

`AssistantChatEntry.persona` is an **opaque identifier**, never free text and
never a sentence the reader sees. The package never resolves it, never
renders it, and attaches no meaning to it: it is a key into the consumer's
`ChatMessageList` `attribution` table and nothing else. An id absent from the
table renders the default `assistantAvatar` with no name - a persisted or
replayed session can name a persona the consumer has since retired, and the
raw id must never reach the DOM.

**GDPR.** `persona` is persisted, replayed and logged wherever the session
itself is, so it must not carry a customer name, a booking number, or any
other personal data - `"billing-support"`, not `"anna-vn-7305-kp"`. The
producer owns that rule; the package cannot enforce it, exactly as § Labels
decision 5 declines a runtime guard. `ChatAttribution`'s `name` and `avatar`
are consumer chrome - the persona's own display name and mark - and carry no
customer data either: they describe who answered, never who asked.

**EU AI Act.** A named, avatared persona is still an AI system. Giving an
answer a human first name and a face does not discharge the Article 50(1)
transparency obligation and does not soften it - it makes the disclosure more
necessary, not less. `ChatMessageList`'s required `aiDisclosure` band renders
in every state and no prop removes it, `attribution` included; the
disclosure's wording belongs to the consumer's reviewed catalogue.

## README screenshots

The three README screenshots are referenced by repository-relative path
(`docs/assets/*.png`), never by absolute `raw.githubusercontent.com` URL.
The repository is private, so anonymous fetches of raw content return 404
and GitHub's own renderer, which proxies absolute image URLs anonymously,
shows broken images; relative paths render through signed private-image
links. npm cannot show the images either way until the repository is public
(`docs/assets` is not in the package `files`), so the absolute form buys
nothing today. `tests/readme-images.test.ts` pins the list of sources and
that each file exists; when the repository goes public, that test is where
the switch to absolute URLs is decided deliberately (issue 36).

## Lint guardrails

Codified house conventions, enforced by two repo-local plugins loaded by
relative import in `eslint.config.mjs` (no package.json, no build, no
publish): `tools/eslint-plugin-bowman/` for this repo's own rules and
`tools/eslint-plugin-lore/` for verbatim mirrors of re-cinq/lore's generic
rules (decision 9), plus a handful of core-ESLint entries (decisions 1-7). Those are validated against committed
fixtures by `tests/eslint-house-rules.test.ts`, judged by the exact committed
config via `--no-ignore` (the same mechanism the Labels and duplication
fixtures use). Decision 8's third-party `react-hooks` rules carry no such
fixture: they are validated by the three exempt components' own behavioural
tests.

Decisions:

1. **Named exports only in `src/`.** The public surface is `export const`,
   so a rename is a compile error in every consumer instead of a silent
   aliasing. Enforced as an `ExportDefaultDeclaration` selector that rides
   in every `no-restricted-syntax` overlay - a later overlay replaces the
   whole array, so the selector is spread into each one rather than added as
   a fourth object.
2. **A condition chains at most two boolean operators at the sites where
   conditions live inline** (`bowman/max-boolean-operators`): `if`/loop
   tests, ternaries, JSX conditional renders, variable initialisers and
   assignments. Anything denser is lifted into a named predicate -
   `isCopyChord` and `hasModifier` in `ChatMessage.tsx` are the founding
   examples. Return statements and arrow-function bodies are deliberately
   NOT counted: they are where the named predicate lives, and the name is
   the fix - counting them would put the extraction itself over budget
   (`isCopyChord` legally chains four operators for exactly this reason).
   The accepted cost: a dense return inside a vaguely-named function passes,
   and the function name is the reviewable surface there. `??` is
   value-selection, not branching, and never counts.
3. **No catch-as-control-flow** (`bowman/no-catch-as-control-flow`). A catch
   that swallows the error and fabricates a return value from a call is an
   `if` in disguise. Sentinel fallbacks (`catch { return null; }`) stay
   legal.
4. **No network egress in component code** (`bowman/no-network-egress`). The
   privacy contract is enforced at runtime by the `tests/setup.ts` traps and
   at the dependency level by `scripts/check-forbidden-imports.mjs`; the
   lint rule is the review-time backstop that names the violation before a
   test ever runs. Denylisted channels: `fetch` (bare or via
   window/globalThis/self), `new WebSocket/EventSource/XMLHttpRequest`,
   `navigator.sendBeacon`.
5. **Props are read-only** (`bowman/no-prop-mutation`). Data flows down as
   arguments; changes flow up via callback props. Scope-based, so a local
   sharing a prop's name never trips it; only the first parameter is props,
   leaving a `forwardRef` second argument and its `.current` writes alone.
6. **Styling lives in the stylesheet** (`bowman/no-inline-styles`), with one
   passing shape - an object of nothing but CSS custom properties, because
   the styling rules then still live in the stylesheet reading the variable.
   Two components are exempted by path in `eslint.config.mjs`, each a
   recorded decision asserted by its tests, not tolerated drift:
   `ConversationList` (the per-character typewriter animation is data, one
   opacity per character) and `ThinkingDots` (the per-dot stagger is data,
   one delay per dot). Visually hidden text is one stylesheet rule,
   `.bowman-sr-only` in `src/styles.css`, shared by the markdown notice, the
   `Toast` live region, `ConversationList`'s plain title and
   `useFocusGroups`' announcement region; issue 5 retired the three inline
   copies and with them the "works with no consumer stylesheet" argument,
   since README already requires `./styles.css` of every consumer. The one
   other hiding idiom is `AppShell`'s skip link, which uses Tailwind's
   `sr-only` with `focus:not-sr-only` because it must become visible on
   focus. `tests/styles.test.ts` fails on a hand-written clip literal in `src/`
   and on the stylesheet losing the rule.
7. **House style is autofixable and repo-wide**: `curly` ("all") plus
   `@stylistic/padding-line-between-statements` (blank line before returns
   and control flow, after the import block and declaration groups).
   Prettier neither inserts nor removes single blank lines between
   statements, so `eslint --fix` followed by `prettier --write` reaches a
   fixed point. Pinned like every other guardrail: the house-style fixture
   in `tests/eslint-house-rules.test.ts` fails with both rule ids.
8. **`react-hooks`'s `refs` and `set-state-in-effect`.** The
   recommended-latest set fires exactly six times, all at three documented,
   test-asserted render patterns and nowhere else, so the two rules are
   adopted and those three sites are exempted by path in `eslint.config.mjs`,
   each a recorded decision rather than tolerated drift: `ChatMessage`'s
   monotonic entry-id thinking-indicator latch (a ref read and written during
   render, keyed by `entry.id` and idempotent) and `useSidebarState`'s
   `storedOpenRef` latest-value read are exempted from `refs`; `Toast`'s
   empty-then-filled live region, seeded in a mount effect so its text is
   reliably announced, is exempted from `set-state-in-effect`. As with
   decision 6 the exemption is file-wide, the accepted cost being that a
   genuinely unsafe ref or effect later added to one of these three files
   would pass.

9. **The generic subset of lore's lint plugin is mirrored verbatim.**
   `tools/eslint-plugin-lore/rules/` holds byte-for-byte copies of nine
   re-cinq/lore rules plus their two lib helpers, selected by the LOCAL
   `tools/eslint-plugin-lore/index.mjs` and policed in CI by
   `scripts/check-lore-plugin-sync.mjs`, which fetches each canonical file
   from lore's public main branch and fails on any byte difference (exit 2,
   not 1, on fetch failure - a network problem is not drift; `--write`
   refreshes). The gate also fails when lore ships a rule this repo has
   neither mirrored nor recorded as excluded, with the reason, in that
   script - a new upstream rule is a decision, not drift. Chosen over an
   npm or git-dependency install because lore's plugin is a private,
   unbuilt package inside a monorepo. Eight run at error over `src/**`:
   `no-forwarding-class`, `no-nested-if`, `no-nested-loop`,
   `no-vague-names`, `prefer-early-return`, `prefer-enforce-true` after an
   18-site sweep, `no-reexport-only-module` (adopted 2026-09-07 at zero
   sites - `index.ts` and `icons/index.tsx` are the exempt barrels; the
   same lore release also shipped `no-cross-layer-import`, recorded as
   excluded in the sync script: it reads monorepo layering from a
   layers.yaml and bowman is one flat package), and `max-comment-lines` at
   lore's `max: 1` after an 84-site sweep - a comment in `src/` is one line stating the constraint
   the code cannot show; rationale essays live in this file or the feature
   specs, and hook usage examples live in README § Hooks. The ninth,
   `no-dead-md-links`, runs at error over every `*.md` the linter reaches
   through `@eslint/markdown`'s `markdown/gfm` language (adopted
   2026-09-07 at zero live sites): a repo-relative markdown link must land
   on a file, because a rename sweep rewrites a dead link as faithfully as a
   live one. Its one recorded exception is a scoped disable in
   `specs/bowman-ui-assistive-technology-pass/spec.md` around the seven
   links to `docs/accessibility/at-pass-<date>.md`, the record a human
   writes after the pass - owed, not missing, as that spec says. Adopting a
   markdown-language block forced the JavaScript presets, parser options and
   react-hooks rules at the head of `eslint.config.mjs` under a script-file
   glob: a global config object also reaches the markdown block, where core
   JavaScript rules crash on a markdown source. The mirrors carry
   no local fixtures (they are tested upstream in lore), the same trade
   recorded for `react-hooks` in decision 8; the rule files are
   `.prettierignore`d and eslint-ignored so lore stays their format
   authority. Never edit a file under `tools/eslint-plugin-lore/rules/`.

10. **Lore's spec-segmentation domain is mirrored verbatim too, and
    `check:spec-links` runs it.** A statement's `([validated by](...))` link
    counts as coverage only when it sits in that statement's TRAILING
    parenthetical; lore's spec-coverage job reports every other test link as
    `non-trailing-link`, and with no local check the defect kept regenerating
    (issues 2 and 7). Rather than reimplement the segmentation and guess at
    agreement, `tools/lore-spec-domain/` holds byte-for-byte copies of the
    four pure domain files behind that verdict - `spec-segment.ts`,
    `spec-sentence-split.ts`, `spec-link-parser.ts`, `test-paths.ts` - policed
    by the same `scripts/check-lore-plugin-sync.mjs` on the same terms as the
    rule mirrors (exit 2 on fetch failure, `--write` refreshes), and
    `.prettierignore`d and eslint-ignored for the same reason. The domain
    library, not lore's `require-spec-link` rule family that wraps it: those
    rules import `the unpublished shared package` at runtime, an unpublished package
    inside lore's monorepo, so they stay recorded as excluded in the sync
    script while the pure part they wrap is mirrored here. The mirrors keep
    lore's `.js` relative imports untouched - editing them to `.ts` would
    break byte identity, which is the whole point - so
    `scripts/lib/lore-domain-resolve.mjs` maps those specifiers at load time,
    registered as a module-customization hook and scoped to parents inside
    the mirror directory; `npm run check:spec-links` runs the mirror under
    `--experimental-strip-types` (Node 22.6+) and Vitest resolves `.js` to
    `.ts` on its own, so a test needs no hook. It is the local counterpart of
    lore's spec-coverage-validate job: one line per misplaced citation, a
    `misplaced: N across M specs` summary, exit 1 on any finding. Never edit
    a file under `tools/lore-spec-domain/`.

Considered and rejected:

- **Type-aware rules** (`no-floating-promises`, `no-misused-promises`,
  `await-thenable`). They run à la carte under `parserOptions.projectService`
  without `recommendedTypeChecked` and report zero violations against the
  current tree - the async surface is timers only, no data-fetching. But the
  lint parser resolves types with `typescript` `~6.0.2` (typescript-eslint
  caps its peer below `6.1.0`) while the build and shipped types come from the
  aliased `typescript7` `~7.0.2`: a type-aware verdict from the wrong compiler
  would be worse than none, for a guard that catches nothing today and adds
  `projectService` cost to every lint run. Revisit when typescript-eslint's
  peer range admits TypeScript 7.
- **A "test must import its subject" rule.** The `*-dist.test.ts` suites
  import nothing from `src/` by design - they read `dist/` - so the rule
  contradicts the test architecture.
- **Replacing bowman's four overlapping ports with lore's originals**
  (`max-boolean-operators`, `no-catch-as-control-flow`, `no-inline-styles`,
  `no-prop-mutation`). Lore's `no-inline-styles` and `no-prop-mutation` fire
  only under a hardcoded `/apps/web-ui/` path marker, so mirrored here they
  would never fire - a silent loss of two guardrails - and lore's other two
  miss the JSX-chain and property-name detections the committed fixtures
  pin. The four stay bowman's own and are recorded as excluded in the sync
  gate; upstreaming the extensions to lore, with `files:` scoping instead
  of path markers, is the eventual fix.

## Seams left open on purpose

- `package.json` declares `"sideEffects": ["*.css"]`, so a stylesheet change
  (entry point, `@theme` tokens, keyframes) can land its CSS without a
  manifest change and without bundlers tree-shaking it away. This flag
  governs only module-level elimination - whether a whole module survives -
  and never reached the icon table: `createUniformIcon` does observable work
  (`Object.defineProperty`, `Object.assign`), so without a `/*#__PURE__*/`
  annotation on each call a bundler retains all 22 icons even when a
  consumer imports one. Icon tree-shaking rests on those annotations, not on
  `sideEffects`; both seams are pinned by tests - the source annotation by
  `tests/icons.test.tsx` and the bundle outcome by
  `tests/icons-dist.test.ts`.
- The public icon props type is required to exist by this record
  (decision 2 above).
