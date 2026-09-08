# bowman-ui stylesheet entry

| Field  | Value                                              |
| ------ | -------------------------------------------------- |
| Issue  | issue 69 (`019-bowman-ui-stylesheet-entry`) |
| Status | In Progress                                        |

`src/styles.css` is the package's only stylesheet: it ships what a consumer's
Tailwind v4 build cannot generate from a class name, and nothing else
([validated by](../../tests/styles.test.ts#L31)). The
`"./styles.css"` export resolves to `dist/styles.css`, which the build script
copies verbatim (`tsc` emits no assets, so `build` is
`tsc -p tsconfig.json && cp src/styles.css dist/styles.css` - `cp` was chosen
over a node script because CI and development both run on POSIX shells).
`dist/styles.css` ships in the tarball under the `sideEffects:
["*.css"]` seam `018` left open - already present, not re-added
([validated by](../../tests/styles.test.ts#L108),
[L100](../../tests/styles.test.ts#L100),
[L93](../../tests/styles.test.ts#L93)).

## What ships

Exactly three keyframes with their utility rules - `bowman-fade-in`,
`bowman-fade-dot`, `bowman-pulse-subtle` - plus the `bowman-md-*` markdown
element styling and an unconditional reduced-motion rule
([validated by](../../tests/styles.test.ts#L31),
[L42](../../tests/styles.test.ts#L42)). All class and
keyframe names carry the `bowman-` prefix so they cannot collide with a
consumer's own `animate-*` utilities; the issue prescribed `.bowman-fade-in`
for the split fade and the other two follow the same convention
([validated by](../../tests/styles.test.ts#L31)). All rules are
unlayered, so they win on plain specificity without depending on a
consumer's `@layer` order.

Absent on purpose: no `pulse-icon` keyframe, no `.no-scrollbar` utility and
no `@theme` tokens - none has a consumer in this package. The file contains no `@theme`, no
`@import` of any kind and no `@plugin`, so a non-Tailwind consumer can import
it as plain CSS ([validated by](../../tests/styles.test.ts#L55)).

## The fadeIn split

A single `fadeIn` keyframe animating
`translateX(-50%) translateY(10px)` would restate the toast's static
`-translate-x-1/2` centring, and for the
uncentred confirmation spans in `ChatMessage` it would make them slide half
their
width left and snap back. `bowman-fade-in` animates opacity and `translateY`
only; `Toast` keeps its centring in its own dedicated rule
([validated by](../../tests/styles.test.ts#L63)).

## Reduced motion

`@media (prefers-reduced-motion: reduce)` sets `animation: none` on all three
utility classes, with no `data-animations` attribute in any selector
([validated by](../../tests/styles.test.ts#L80)). No
`NEXT_PUBLIC_FLAG_ANIMATIONS` escape hatch exists: flag plumbing belongs to
a consumer ([validated by](../../tests/hooks-dist.test.ts#L76)).

## The typography-plugin replacement

`@tailwindcss/typography` appears in no `package.json` field and no `src/`
file contains
the string the plugin's classes are built from
([validated by](../../tests/styles.test.ts#L104),
[L119](../../tests/styles.test.ts#L119)). Instead, `markdownComponents`
is a named export from the package root: a `react-markdown` `components` map
covering exactly `p`, `a`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`,
`h1`-`h3`, `table`, `thead`, `th`, `td`, `hr`, `strong`, `em`
([validated by](../../tests/markdown-components.test.tsx#L55)). Each element
carries its `bowman-md-<tag>` class when a fixture containing every tag renders
through `react-markdown` + `remark-gfm`, incoming
classes like `language-js` are merged rather than clobbered, and the
`node` prop `react-markdown` passes never reaches the DOM
([validated by](../../tests/markdown-components.test.tsx#L74),
[L80](../../tests/markdown-components.test.tsx#L80),
[L88](../../tests/markdown-components.test.tsx#L88)).

## Recorded decisions

- **The map is typed structurally; `react-markdown` is a devDependency only.**
  `src/markdown/components.tsx` imports nothing from `react-markdown` - its
  props type is `HTMLAttributes<HTMLElement> & {node?: unknown}`, a supertype
  of what `react-markdown` passes, so the package keeps zero runtime
  dependencies and consumers on any `react-markdown` v9/v10 stay compatible.
  `react-markdown` + `remark-gfm` were added as devDependencies for the
  rendering test above and for the compile-time proof that the map is
  assignable to `react-markdown`'s `Components`.
  **Superseded by 023:** the chat message component renders through
  `react-markdown` at runtime, so 023 promoted `react-markdown` and
  `remark-gfm` from devDependencies to `dependencies` - the zero-runtime-deps
  claim above no longer holds (see `specs/bowman-ui-chat-message/spec.md`).
  **Superseded by 076:** the frozen `markdownComponents` constant became the
  `createMarkdownComponents(options)` factory - the `a` renderer needs a link
  policy and a label - and the map gained an `img` entry for the image gate;
  the eighteen classed tags and their fixture test carry over unchanged (see
  `specs/bowman-ui-markdown-link-policy/spec.md`;
  [validated by](../../tests/markdown-components.test.tsx#L93),
  [tags](../../tests/markdown-components.test.tsx#L55)).
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
  of the tarball ([validated by](../../tests/tailwind-build.test.ts#L75)).

## The real-build verification the issue demanded

Both results, from Tailwind v4.3.3 compiling the fixture consumer:

- **With** `@source "./node_modules/@re-cinq/bowman-ui/dist";` the compiled
  CSS contains
  `.bg-slate-800 { background-color: var(--color-slate-800); }`
  ([validated by](../../tests/tailwind-build.test.ts#L75)).
- **Without** the `@source` line the identical build emits no `.bg-slate-800`
  rule at all - v4 does not scan `node_modules` by default
  ([validated by](../../tests/tailwind-build.test.ts#L79)).
- In both builds `@import "@re-cinq/bowman-ui/styles.css"` resolves through
  the package `exports` map and inlines the three keyframes
  ([validated by](../../tests/tailwind-build.test.ts#L83)).

The README's Styles section documents the two consumer lines, names Tailwind
v4 as required and says why (the package ships only what Tailwind cannot
generate; the utilities on the components come from the consumer's own build
scanning the installed `dist`)
([validated by](../../tests/tailwind-build.test.ts#L75)).
