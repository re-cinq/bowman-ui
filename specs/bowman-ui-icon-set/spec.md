# bowman-ui icon set

Issue: re-cinq/Otto#70 (`020-bowman-ui-icon-set`)

The local SVG icon set moves from Discovery (`apps/web/components/icons/Icon.tsx`
and `index.tsx` on `main` at `1aa3647fa5f75997ceea6bdc11f3fa66cea79b29`) into
`src/icons/Icon.tsx` and `src/icons/index.tsx`, re-exported from the root
barrel `src/index.ts` - no `./icons` subpath, since `014` pinned `exports` to a
single `"."` entry ([validated by](../../tests/icons-dist.test.ts#L4)). `src/icons/index.tsx` exports exactly 23 icon components,
enumerated by name so a dropped icon fails the build rather than the consumer
([validated by](../../tests/icons.test.tsx#L58)), with path data byte-identical
to the source, asserted attribute-by-attribute against a verbatim pre-move
fixture copy rather than by `outerHTML` string - attribute order in `outerHTML`
follows JSX order and changes when the element moves into `IconWrapper`
([validated by](../../tests/icons.test.tsx#L138), oracle at
[tests/fixtures/premove-icons.tsx](../../tests/fixtures/premove-icons.tsx)).

## IconWrapper becomes the render path

In Discovery, `IconWrapper` is dead code: declared at `Icon.tsx:46` and
re-exported at `index.tsx:23`, rendered by nothing - all 24 icons open a raw
`<svg>` themselves (evidence: `grep -rn "IconWrapper" apps/web` outside
`node_modules` hits only `Icon.tsx:46-47` and the `index.tsx:23` re-export).
Here the 22 uniform icons render `<IconWrapper {...svgProps}>`
([validated by](../../tests/icons.test.tsx#L64)), each root `<svg>` carrying
`fill="none"`, `viewBox="0 0 24 24"` and, for the 22, `stroke="currentColor"`
([validated by](../../tests/icons.test.tsx#L116),
[L125](../../tests/icons.test.tsx#L125)). `forwardRef` stays exactly as-is per
`018` Decision 4 - rewriting it away would turn the `^19.0.0` peer range from a
testing claim into a hard React 19 floor; the icons still take no `ref` prop
([validated by](../../tests/icons-dist.test.ts#L4)).

`LoadingIcon` is the explicit exception and keeps its own `<svg>`:
`IconWrapper` hardcodes `stroke="currentColor"` on the root, which would put a
stroke on the deliberately strokeless spinner path, and `LoadingIcon` composes
its `className` (`` `animate-spin ${className || ""}` ``) rather than passing
it through ([validated by](../../tests/icons.test.tsx#L247),
[L257](../../tests/icons.test.tsx#L257)). The would-be regression is pinned: no root `stroke` attribute,
`class` containing `animate-spin`, `<path fill="currentColor">` with no stroke
([validated by](../../tests/icons.test.tsx#L241)). `animate-spin` is a Tailwind
core utility, not one of the three keyframes `019` ships - `src/styles.css`
gains no rule for it; a consumer's Tailwind build generates it by scanning
the installed `dist` ([validated by](../../tests/icons.test.tsx#L108)).
`LoadingIcon`'s English `ariaLabel` default `"Loading"` (source `index.tsx:354`)
is preserved as the icon set's only user-visible string, prop-overridable per
call site; the icon set needs no `labels` prop and the `labels` issue does
not touch it ([validated by](../../tests/icons.test.tsx#L225),
[L230](../../tests/icons.test.tsx#L230)).

## The public props type: `IconProps`

The module-private `BaseIconProps` (source `index.tsx:25`) is promoted to the
public, exported `IconProps = {className?: string; ariaLabel?: string;
strokeWidth?: number}`, and every one of the 23 icons is typed with it
([validated by](../../tests/icons-dist.test.ts#L4)). A
type-level test compiles `const Wrapped = (p: IconProps) => <SendIcon {...p} />`
against the built `dist` types through the self-referencing package import -
the case `018` recorded as impossible before this issue
([validated by](../../tests/icons-dist.test.ts#L4), assertions at
[tests/types/icon-type-assertions.tsx](../../tests/types/icon-type-assertions.tsx#L14)).

The previously-exported `IconProps` at `Icon.tsx:21` - a `{name: string}`
registry-lookup shape for an `<Icon name="...">` component the file never
exported - is absent from `src/`
([validated by](../../tests/icons.test.tsx#L77)). Grep evidence that it has no
consumers in Discovery (`main` at `1aa3647`): `grep -rn "IconProps" apps/web`
outside `node_modules` hits only its declaration (`Icon.tsx:21`), the
`index.tsx:22` re-export, and `BaseIconProps`/`IconSvgProps` matches; the
`<Icon ` occurrences in `AppSidebar.tsx:60` and `AppMobileSidebar.tsx:117` are
locally-renamed component variables, not the registry component, and the test
suite imports only `getAccessibleIconProps`.

`IconWrapper` and `getAccessibleIconProps` are exported from the root barrel
and `IconSvgProps` as a type - `getAccessibleIconProps` returns a `Pick` of it
([validated by](../../tests/icons.test.tsx#L58)).
All four resolve through the `"."` exports entry
([validated by](../../tests/icons-dist.test.ts#L4)) and `npm pack --dry-run`
ships `dist/icons/Icon.{js,d.ts}` and `dist/icons/index.{js,d.ts}`
([validated by](../../tests/icons-dist.test.ts#L28)).

## Accessibility contract

The ported Discovery suite (`apps/web/tests/components/icons.test.tsx`, 155
lines) passes unchanged in meaning: no label → `aria-hidden="true"` and no
`role`; a label → `aria-hidden="false"`, `role="img"`, `aria-label` set
([validated by](../../tests/icons.test.tsx#L150),
[L166](../../tests/icons.test.tsx#L166),
[L180](../../tests/icons.test.tsx#L180),
[L191](../../tests/icons.test.tsx#L191),
[L202](../../tests/icons.test.tsx#L202),
[L213](../../tests/icons.test.tsx#L213)), including the
`getAttribute`-based class assertions working around `SVGAnimatedString`
([validated by](../../tests/icons.test.tsx#L235),
[L282](../../tests/icons.test.tsx#L282)).

`strokeWidth` defaults to `2` and reaches both the `<svg>` and the `<path>`
([validated by](../../tests/icons.test.tsx#L258));
`<SearchIcon strokeWidth={1.5} />` renders `stroke-width="1.5"` on the path
([validated by](../../tests/icons.test.tsx#L264)); `DatabaseIcon` defaults to
`1.5` (source `index.tsx:374`,
[validated by](../../tests/icons.test.tsx#L275)).

## What does not move

`LogoIcon` (source `index.tsx:158-169`) does not move: it is Discovery's sparkle
mark, structurally unlike its 23 neighbours (no stroke, `fill="currentColor"`
path, `strokeWidth` ignored), and `018` Decision 3 forbids a bundled default
mark ([validated by](../../tests/icons.test.tsx#L70)). `grep -rn "LogoIcon" src/` returns nothing
([validated by](../../tests/icons.test.tsx#L70)) and the README points a
consumer wanting a brand mark at the `assistantAvatar` slot from `CONTRACT.md`
([validated by](../../tests/icons.test.tsx#L85)).

## Client boundary

No file under `src/icons/` carries `"use client"`
([validated by](../../tests/icons.test.tsx#L102)) - the icons use no
client-only React API - and `scripts/check-client-directives.mjs` passes
against the new files, the first exercise of `018`'s contract requirement
against real extracted code
([validated by](../../tests/client-directives.test.ts#L80)).
Every relative import under `src/icons/` ends in `.js` and no file contains
`"@/` ([validated by](../../tests/icons.test.tsx#L91)).

## Spec-vs-source notes

- Every line number the issue cites checks out against Discovery `main` at
  `1aa3647`: `BaseIconProps` at `index.tsx:25`, `LogoIcon` at `:158-169`,
  `LoadingIcon`'s default at `:354`, `DatabaseIcon`'s `?? 1.5` at `:374`, the
  dead `IconProps` at `Icon.tsx:21`, `IconSvgProps` at `:35`, `IconWrapper` at
  `:46`, `getAccessibleIconProps` at `:72`, and the 155-line test suite. No
  discrepancy found.
- `src/Placeholder.tsx` carries a comment claiming "the first real extraction
  PR deletes Placeholder.tsx". This issue's acceptance criteria do not include
  that deletion, and Placeholder is currently the only directive-carrying file
  proving the `"use client"` dist-emission pipeline
  (`tests/build-contract.test.ts`), so it stays until a component extraction
  lands a real `"use client"` file to take over that role.
