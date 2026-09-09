# bowman-ui icon set

| Field  | Value                               |
| ------ | ----------------------------------- |
| Issue  | issue 70 (`020-bowman-ui-icon-set`) |
| Status | In Progress                         |

The local SVG icon set lives in `src/icons/Icon.tsx` and `src/icons/index.tsx`,
re-exported from the root
barrel `src/index.ts` - no `./icons` subpath, since `014` pinned `exports` to a
single `"."` entry. `src/icons/index.tsx` exports exactly 23 icon components,
enumerated by name so a dropped icon fails the build rather than the consumer
([validated by](../../tests/icons.test.tsx#L56),
[L52](../../tests/icons-dist.test.ts#L52)). Path data is pinned
byte-for-byte, asserted attribute-by-attribute against a golden-master
fixture copy rather than by `outerHTML` string - attribute order in `outerHTML`
follows JSX order and changes when the element moves into `IconWrapper`
([validated by](../../tests/icons.test.tsx#L162), oracle at
[tests/fixtures/golden-icons.tsx](../../tests/fixtures/golden-icons.tsx)).

## IconWrapper is the render path

The 22 uniform icons render `<IconWrapper {...svgProps}>` through a
single `createUniformIcon(displayName, pathData, defaultStrokeWidth?)`
path-table factory, each call `/*#__PURE__*/`-annotated so a bundler can
tree-shake unused icons - issue #50 collapsed the 22 repeated shells into one
render site and #55 re-pinned the structure characterization on the
PURE-annotated calls accordingly
([validated by](../../tests/icons.test.tsx#L65)). The factory stamps each
icon's own `displayName` and `Function.name`, the two properties React
DevTools and ErrorBoundary componentStack frames read component names from
([validated by](../../tests/icons.test.tsx#L337)). Each root
`<svg>` carries
`fill="none"`, `viewBox="0 0 24 24"` and, for the 22, `stroke="currentColor"`.
`forwardRef` stays exactly as-is per
docs/design-notes.md decision 4 - rewriting it away would turn the `^19.0.0` peer range from a
testing claim into a hard React 19 floor; the icons still take no `ref` prop
([validated by](../../tests/icons-dist.test.ts#L52),
[L138](../../tests/icons.test.tsx#L138),
[L148](../../tests/icons.test.tsx#L148)).

`LoadingIcon` is the explicit exception and keeps its own `<svg>`:
`IconWrapper` hardcodes `stroke="currentColor"` on the root, which would put a
stroke on the deliberately strokeless spinner path, and `LoadingIcon` composes
its `className` (`` `animate-spin ${className || ""}` ``) rather than passing
it through ([validated by](../../tests/icons.test.tsx#L280),
[L292](../../tests/icons.test.tsx#L292)). The would-be regression is pinned: no root `stroke` attribute,
`class` containing `animate-spin`, `<path fill="currentColor">` with no stroke.
`animate-spin` is a Tailwind
core utility, not one of the three keyframes `019` ships - `src/styles.css`
gains no rule for it; a consumer's Tailwind build generates it by scanning
the installed `dist`.
`LoadingIcon`'s English `ariaLabel` default `"Loading"`
is the icon set's only user-visible string, prop-overridable per
call site; the icon set needs no `labels` prop and the `labels` issue does
not touch it ([validated by](../../tests/icons.test.tsx#L256),
[L261](../../tests/icons.test.tsx#L261),
[L273](../../tests/icons.test.tsx#L273),
[L130](../../tests/icons.test.tsx#L130)).

## The public props type: `IconProps`

The icons share one public, exported `IconProps = {className?: string;
ariaLabel?: string;
strokeWidth?: number}`, and every one of the 23 icons is typed with it
([validated by](../../tests/icons-dist.test.ts#L52)). A
type-level test compiles `const Wrapped = (p: IconProps) => <SendIcon {...p} />`
against the built `dist` types through the self-referencing package import
([validated by](../../tests/icons-dist.test.ts#L52), assertions at
[tests/types/icon-type-assertions.tsx](../../tests/types/icon-type-assertions.tsx#L15)).

No `{name: string}` registry-lookup `IconProps` shape exists in `src/` -
icons are imported directly by name, never resolved through a registry
component
([validated by](../../tests/icons.test.tsx#L78)).

`IconWrapper` and `getAccessibleIconProps` are exported from the root barrel
and `IconSvgProps` as a type - `getAccessibleIconProps` returns a `Pick` of it
([validated by](../../tests/icons.test.tsx#L56)).
All four resolve through the `"."` exports entry. `npm pack --dry-run`
ships `dist/icons/Icon.{js,d.ts}` and `dist/icons/index.{js,d.ts}`
([validated by](../../tests/icons-dist.test.ts#L77),
[L52](../../tests/icons-dist.test.ts#L52)).

## Accessibility contract

The tested accessibility behaviour holds for every icon: no label →
`aria-hidden="true"` and no
`role`; a label → `aria-hidden="false"`, `role="img"`, `aria-label` set
([validated by](../../tests/icons.test.tsx#L177),
[L195](../../tests/icons.test.tsx#L195),
[L211](../../tests/icons.test.tsx#L211),
[L222](../../tests/icons.test.tsx#L222),
[L233](../../tests/icons.test.tsx#L233),
[L244](../../tests/icons.test.tsx#L244)). The
`getAttribute`-based class assertions work around `SVGAnimatedString`
([validated by](../../tests/icons.test.tsx#L267),
[L321](../../tests/icons.test.tsx#L321)).

`strokeWidth` defaults to `2` and reaches both the `<svg>` and the `<path>`.
`<SearchIcon strokeWidth={1.5} />` renders `stroke-width="1.5"` on the path
([validated by](../../tests/icons.test.tsx#L307)). `DatabaseIcon` defaults to
`1.5` ([validated by](../../tests/icons.test.tsx#L313),
[L300](../../tests/icons.test.tsx#L300)).

## No brand mark ships

No `LogoIcon` exists in the set: a brand mark is structurally unlike the 23
icons (no stroke, a `fill="currentColor"`
path, `strokeWidth` ignored), and docs/design-notes.md decision 3 forbids a bundled default
mark. `grep -rn "LogoIcon" src/` returns nothing
([validated by](../../tests/icons.test.tsx#L70)). The README points a
consumer wanting a brand mark at the `assistantAvatar` slot from `docs/design-notes.md`
([validated by](../../tests/icons.test.tsx#L105)).

## Client boundary

No file under `src/icons/` carries `"use client"` - the icons use no
client-only React API. `scripts/check-client-directives.mjs`
passes against every file under `src/icons/`, per docs/design-notes.md
decision 1
([validated by](../../tests/client-directives.test.ts#L90),
[L124](../../tests/icons.test.tsx#L124)).
Every relative import under `src/icons/` ends in `.js` and no file contains
`"@/` ([validated by](../../tests/icons.test.tsx#L112)).
