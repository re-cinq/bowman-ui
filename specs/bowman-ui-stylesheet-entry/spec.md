# bowman-ui stylesheet entry

| Field  | Value                                       |
| ------ | ------------------------------------------- |
| Issue  | issue 69 (`019-bowman-ui-stylesheet-entry`) |
| Status | In Progress                                 |

`src/styles.css` is the package's only stylesheet: it ships what a consumer's
Tailwind v4 build cannot generate from a class name, and nothing else
([validated by](../../tests/styles.test.ts#L31)). The
`"./styles.css"` export resolves to `dist/styles.css`, which the build script
copies verbatim: `tsc` emits no assets, so `build` is
`rm -rf dist && node node_modules/typescript7/bin/tsc -p tsconfig.json && cp src/styles.css dist/styles.css`
(README § Development names the compiler alias), with `cp` chosen over
a node script because CI and development both run on POSIX shells.
`dist/styles.css` ships in the tarball under the `sideEffects:
["*.css"]` seam `018` left open - already present, not re-added
([validated by](../../tests/styles.test.ts#L121),
[L113](../../tests/styles.test.ts#L113),
[L106](../../tests/styles.test.ts#L106)). The leading `rm -rf dist` is
load-bearing - `tsc` never cleans, and `files: ["dist"]` would ship whatever
stale artifact survived - so every built file must trace back to a source
file ([validated by](../../tests/dist-is-clean.test.ts#L36)).

## What ships

Exactly four keyframes with their utility rules - `bowman-fade-in`,
`bowman-fade-dot` and `bowman-pulse-subtle` from this issue, plus
`bowman-toast-fade-in`, which 025 added for the toast's centred fade (see
`specs/bowman-ui-toast/spec.md` § The stylesheet) - alongside the `bowman-md-*`
markdown element styling, the `bowman-sr-only` rule and an unconditional
reduced-motion rule
([validated by](../../tests/styles.test.ts#L31),
[L42](../../tests/styles.test.ts#L42),
[L149](../../tests/styles.test.ts#L149)). All class and
keyframe names carry the `bowman-` prefix so they cannot collide with a
consumer's own `animate-*` utilities; the issue prescribed `.bowman-fade-in`
for the split fade and the other three follow the same convention
([validated by](../../tests/styles.test.ts#L31)). All rules are
unlayered, so they win on plain specificity without depending on a
consumer's `@layer` order. Since issue 210 the copied `dist/styles.css` opens with a
comment block declaring, one line per `--bowman-*` theming token, that token and
its default
([validated by](../../tests/theming-tokens-dist.test.ts#L189)). The 50 % stop of
`bowman-pulse-subtle` reads `--bowman-accent-glow` and `--bowman-pulse-outline` with today's
literals as fallbacks - the zero stop stays literal
([validated by](../../tests/styles.test.ts#L71)).

Absent on purpose: no `pulse-icon` keyframe, no `.no-scrollbar` utility and
no `@theme` tokens - the theming tokens are custom properties read through `var()` fallbacks
and declared nowhere (docs/design-notes.md § Theming decision 1), so the sentence still
holds. The file contains no `@theme`, no
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

`@media (prefers-reduced-motion: reduce)` sets `animation: none` on all four
utility classes, with no `data-animations` attribute in any selector
([validated by](../../tests/styles.test.ts#L89)). Rendered in Chromium under
that preference, a thinking dot's computed `animation-name` is `none`, against
`bowman-fade-dot` without the emulation (issue 151)
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L624)). No
`NEXT_PUBLIC_FLAG_ANIMATIONS` escape hatch exists: flag plumbing belongs to
a consumer ([validated by](../../tests/hooks-dist.test.ts#L66)).

## The typography-plugin replacement

`@tailwindcss/typography` appears in no `package.json` field and no `src/`
file contains
the string the plugin's classes are built from
([validated by](../../tests/styles.test.ts#L117),
[L132](../../tests/styles.test.ts#L132)). Instead, `markdownComponents`
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
- **Updated in place after 025 and the dist-clean guard.** 019 shipped three
  keyframes and a plain `tsc && cp` build; 025 added `bowman-toast-fade-in`
  (see `specs/bowman-ui-toast/spec.md`) and the guard pinned by
  `tests/dist-is-clean.test.ts` put `rm -rf dist` in front of the build.
  The counts and the build line above describe today's file rather than
  carrying a superseded three.
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
  the package `exports` map and inlines the stylesheet -
  `@keyframes bowman-fade-in` appears in both compiled outputs
  ([validated by](../../tests/tailwind-build.test.ts#L83)).

The README's Styles section documents the two consumer lines, names Tailwind
v4 as required and says why (the package ships only what Tailwind cannot
generate; the utilities on the components come from the consumer's own build
scanning the installed `dist`)
([validated by](../../tests/tailwind-build.test.ts#L75)).
