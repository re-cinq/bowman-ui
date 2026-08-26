# bowman-ui stylesheet entry

Issue: issue 69 (`019-bowman-ui-stylesheet-entry`)

`src/styles.css` is the package's only stylesheet: it ships what a consumer's
Tailwind v4 build cannot generate from a class name, and nothing else
([validated by](../../tests/styles.test.ts#L28)). The
`"./styles.css"` export resolves to `dist/styles.css`, which the build script
copies verbatim (`tsc` emits no assets, so `build` is
`tsc -p tsconfig.json && cp src/styles.css dist/styles.css` - `cp` was chosen
over a node script because CI and development both run on POSIX shells)
([validated by](../../tests/styles.test.ts#L84)).
`dist/styles.css` ships in the tarball under the `sideEffects:
["*.css"]` seam `018` left open - already present, not re-added
([validated by](../../tests/styles.test.ts#L99),
[L91](../../tests/styles.test.ts#L91)).

## What ships

Exactly three keyframes with their utility rules - `bowman-fade-in`,
`bowman-fade-dot`, `bowman-pulse-subtle` - plus the `bowman-md-*` markdown
element styling and an unconditional reduced-motion rule
([validated by](../../tests/styles.test.ts#L28),
[L38](../../tests/styles.test.ts#L38)). All class and
keyframe names carry the `bowman-` prefix so they cannot collide with a
consumer's own `animate-*` utilities; the issue prescribed `.bowman-fade-in`
for the split fade and the other two follow the same convention
([validated by](../../tests/styles.test.ts#L28)). All rules are
unlayered, matching how `fade-dot` and `pulse-subtle` already win in Discovery's
`globals.css` (only `.animate-fade-in` sat inside `@layer utilities` there).

Absent on purpose, per the issue's reference table measured against Discovery
`main`: `pulse-icon` and `.no-scrollbar` (zero consumers -
`grep -rn "animate-pulse-icon\|no-scrollbar" apps/web/{app,components,hooks}`
outside `globals.css` itself returns nothing) and the ten `@theme` tokens
(referenced nowhere outside `globals.css`). The file contains no `@theme`, no
`@import` of any kind and no `@plugin`, so a non-Tailwind consumer can import
it as plain CSS ([validated by](../../tests/styles.test.ts#L50)).

## The fadeIn split

Discovery's `fadeIn` keyframe animates
`translateX(-50%) translateY(10px)` - the `translateX` restates
`Toast.tsx:21`'s own static `-translate-x-1/2` centring hack, and for the
uncentred spans at `ChatMessage.tsx:214,248` it makes them slide half their
width left and snap back. `bowman-fade-in` animates opacity and `translateY`
only; Toast keeps its centring in its own rule when it is extracted
([validated by](../../tests/styles.test.ts#L57)).

## Reduced motion

`@media (prefers-reduced-motion: reduce)` sets `animation: none` on all three
utility classes, with no `data-animations` attribute in any selector
([validated by](../../tests/styles.test.ts#L72)). The
`NEXT_PUBLIC_FLAG_ANIMATIONS` escape hatch is Discovery plumbing and stays
there ([validated by](../../tests/hooks-dist.test.ts#L73)).

## The typography-plugin replacement

`@tailwindcss/typography` appears in no `package.json` field and no `src/`
file contains
the string the plugin's classes are built from
([validated by](../../tests/styles.test.ts#L95),
[L115](../../tests/styles.test.ts#L115)). Instead, `markdownComponents`
is a named export from the package root: a `react-markdown` `components` map
covering exactly `p`, `a`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`,
`h1`-`h3`, `table`, `thead`, `th`, `td`, `hr`, `strong`, `em`
([validated by](../../tests/markdown-components.test.tsx#L55)). Each element
carries its `bowman-md-<tag>` class when a fixture containing every tag renders
through `react-markdown` + `remark-gfm`, incoming
classes like `language-js` are merged rather than clobbered, and the
`node` prop `react-markdown` passes never reaches the DOM
([validated by](../../tests/markdown-components.test.tsx#L74),
[L79](../../tests/markdown-components.test.tsx#L79),
[L87](../../tests/markdown-components.test.tsx#L87)).

**Correction to the issue text**: "the one `prose` wrapper site
(`ChatMessage.tsx:182`)" undercounts - `components/comparison/MessageList.tsx:381`
and `components/comparison/ChatWindow.tsx:211` also carry `prose` classes on
Discovery `main`. Only `ChatMessage` is slated for extraction, so the
replacement decision stands unchanged; the count is recorded here so the
comparison components' non-extraction is a known fact, not an oversight.

## Recorded decisions

- **The map is typed structurally; `react-markdown` is a devDependency only.**
  `src/markdown/components.tsx` imports nothing from `react-markdown` - its
  props type is `HTMLAttributes<HTMLElement> & {node?: unknown}`, a supertype
  of what `react-markdown` passes, so the package keeps zero runtime
  dependencies and consumers on any `react-markdown` v9/v10 stay compatible.
  `react-markdown` + `remark-gfm` were added as devDependencies for the
  rendering test above and for the compile-time proof that the map is
  assignable to `react-markdown`'s `Components`.
  **Superseded by 023:** the chat message extraction renders through
  `react-markdown` at runtime, so 023 promoted `react-markdown` and
  `remark-gfm` from devDependencies to `dependencies` - the zero-runtime-deps
  claim above no longer holds (see `specs/bowman-ui-chat-message/spec.md`).
  **Superseded by 076:** the frozen `markdownComponents` constant became the
  `createMarkdownComponents(options)` factory - the `a` renderer needs a link
  policy and a label - and the map gained an `img` entry for the image gate;
  the eighteen classed tags and their fixture test carry over unchanged (see
  `specs/bowman-ui-markdown-link-policy/spec.md`;
  [validated by](../../tests/markdown-components.test.tsx#L92)).
- **Markdown styling is color-neutral.** The `bowman-md-*` rules use
  `currentColor` and `color-mix(...)` for backgrounds and borders instead of
  palette colors, so they work under either dark-mode strategy without the
  library taking a position - the dark decision stays with the consumer's
  build, per the issue's out-of-scope list.
- **The Tailwind fixture lives in `tests/`, outside the package.**
  `tests/fixtures/tailwind-consumer/` holds two CSS entries (with and without
  `@source`) and a stand-in built component carrying `bg-slate-800`;
  `tests/tailwind-build.test.ts` assembles a throwaway consumer in a temp
  directory (the real `package.json` and the real built `dist/styles.css`
  "installed" under `node_modules/@re-cinq/bowman-ui`, `tailwindcss`
  symlinked) and runs the real Tailwind v4 CLI (`tailwindcss` +
  `@tailwindcss/cli`, devDependencies). `files: ["dist"]` keeps all of it out
  of the tarball ([validated by](../../tests/tailwind-build.test.ts#L71)).

## The real-build verification the issue demanded

Both results, from Tailwind v4.3.3 compiling the fixture consumer:

- **With** `@source "./node_modules/@re-cinq/bowman-ui/dist";` the compiled
  CSS contains
  `.bg-slate-800 { background-color: var(--color-slate-800); }`
  ([validated by](../../tests/tailwind-build.test.ts#L71)).
- **Without** the `@source` line the identical build emits no `.bg-slate-800`
  rule at all - v4 does not scan `node_modules` by default
  ([validated by](../../tests/tailwind-build.test.ts#L75)).
- In both builds `@import "@re-cinq/bowman-ui/styles.css"` resolves through
  the package `exports` map and inlines the three keyframes
  ([validated by](../../tests/tailwind-build.test.ts#L79)).

The README's Styles section documents the two consumer lines, names Tailwind
v4 as required and says why (the package ships only what Tailwind cannot
generate; the utilities on the components come from the consumer's own build
scanning the installed `dist`)
([validated by](../../tests/tailwind-build.test.ts#L71)).
