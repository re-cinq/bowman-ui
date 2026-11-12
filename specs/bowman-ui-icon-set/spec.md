# bowman-ui icon set

| Field  | Value                               |
| ------ | ----------------------------------- |
| Issue  | issue 70 (`020-bowman-ui-icon-set`) |
| Status | In Progress                         |

The local SVG icon set lives in `src/icons/Icon.tsx` and `src/icons/index.tsx`,
re-exported from the root
barrel `src/index.ts` - no `./icons` subpath, since `014` pinned `exports` to a
single `"."` entry. `src/icons/index.tsx` exports exactly 24 icon components,
enumerated by name so a dropped icon fails the build rather than the consumer
([validated by exports exactly the 24 icon components plus IconWrapper and getAccessibleIconProps @52b2a89a](../../tests/icons.test.tsx#L57),
[validated by tsc accepts icon-type-assertions.tsx against dist via the '.' exports entry @2d24baec](../../tests/icons-dist.test.ts#L51)). Path data is pinned
byte-for-byte, asserted attribute-by-attribute against a golden-master
fixture copy rather than by `outerHTML` string - attribute order in `outerHTML`
follows JSX order and changes when the element moves into `IconWrapper`
([validated by @310f2b03](../../tests/icons.test.tsx#L167), oracle at
[tests/fixtures/golden-icons.tsx](../../tests/fixtures/golden-icons.tsx)).

## IconWrapper is the render path

The 23 uniform icons render `<IconWrapper {...svgProps}>` through a
single `createUniformIcon(displayName, pathData, defaultStrokeWidth?)`
path-table factory, each call `/*#__PURE__*/`-annotated so a bundler can
tree-shake unused icons - issue #50 collapsed the 22 repeated shells into one
render site and #55 re-pinned the structure characterization on the
PURE-annotated calls accordingly
([validated by @7b06dc18](../../tests/icons.test.tsx#L66)). The factory stamps each
icon's own `displayName` and `Function.name`, the two properties React
DevTools and ErrorBoundary componentStack frames read component names from
([validated by @9e062957](../../tests/icons.test.tsx#L340)). Each root
`<svg>` carries
`fill="none"`, `viewBox="0 0 24 24"` and, for the 23, `stroke="currentColor"`.
`forwardRef` stays exactly as-is per
docs/design-notes.md decision 4 - rewriting it away would turn the `^19.0.0` peer range from a
testing claim into a hard React 19 floor; the icons still take no `ref` prop
([validated by tsc accepts icon-type-assertions.tsx against dist via the '.' exports entry @2d24baec](../../tests/icons-dist.test.ts#L51),
[L141@310f2b03](../../tests/icons.test.tsx#L141),
[L151@cf59f97b](../../tests/icons.test.tsx#L151),
[validated by IconWrapper is a forwardRef<SVGSVGElement, ...> component in src/icons/Icon.tsx - never ref-as-prop @95ba3009](../../tests/icons.test.tsx#L354),
[validated by a ref passed to IconWrapper reaches the root <svg> @d2b072cd](../../tests/icons.test.tsx#L361)).

`LoadingIcon` is the explicit exception and keeps its own `<svg>`:
`IconWrapper` hardcodes `stroke="currentColor"` on the root, which would put a
stroke on the deliberately strokeless spinner path, and `LoadingIcon` composes
its `className` (`` `animate-spin ${className || ""}` ``) rather than passing
it through ([validated by `renders its own strokeless <svg>: no root stroke, animate-spin, fill=currentColor path without stroke` @7cf73792](../../tests/icons.test.tsx#L283),
[validated by composes className after animate-spin @b7234639](../../tests/icons.test.tsx#L295)). The would-be regression is pinned: no root `stroke` attribute,
`class` containing `animate-spin`, `<path fill="currentColor">` with no stroke.
`animate-spin` is a Tailwind
core utility, not one of the four keyframes the package stylesheet ships (019's three plus
025's `bowman-toast-fade-in`) ([validated by declares exactly the four keyframes bowman-fade-in, bowman-toast-fade-in, bowman-fade-dot and bowman-pulse-subtle @4d80b735](../../tests/styles.test.ts#L32)). No rule for it
lands in `src/styles.css`; a consumer's Tailwind build generates it by scanning the installed `dist`.
`LoadingIcon`'s English `ariaLabel` default `"Loading"`
is the icon set's only user-visible string, prop-overridable per
call site; the icon set needs no `labels` prop and the `labels` issue does
not touch it ([validated by has default ariaLabel 'Loading' @7d0d969e](../../tests/icons.test.tsx#L259),
[validated by accepts custom ariaLabel @899ca956](../../tests/icons.test.tsx#L264),
[validated by has animation class @f99244cd](../../tests/icons.test.tsx#L276),
[validated by src/styles.css gains no rule for animate-spin - it is Tailwind's core utility @25b76a5b](../../tests/icons.test.tsx#L133)).

## The public props type: `IconProps`

The icons share one public, exported `IconProps = {className?: string;
ariaLabel?: string;
strokeWidth?: number}`, and every one of the 24 icons is typed with it
([validated by tsc accepts icon-type-assertions.tsx against dist via the '.' exports entry @2d24baec](../../tests/icons-dist.test.ts#L51)). A
type-level test compiles `const Wrapped = (p: IconProps) => <SendIcon {...p} />`
against the built `dist` types through the self-referencing package import
([validated by tsc accepts icon-type-assertions.tsx against dist via the '.' exports entry @2d24baec](../../tests/icons-dist.test.ts#L51), assertions at
[tests/types/icon-type-assertions.tsx@79b4350f](../../tests/types/icon-type-assertions.tsx#L15)).

No `{name: string}` registry-lookup `IconProps` shape exists in `src/` -
icons are imported directly by name, never resolved through a registry
component
([validated by the registry-lookup {name: string} IconProps shape is absent from src/ @3986a6c8](../../tests/icons.test.tsx#L79)).

`IconWrapper` and `getAccessibleIconProps` are exported from the root barrel
and `IconSvgProps` as a type - `getAccessibleIconProps` returns a `Pick` of it
([validated by exports exactly the 24 icon components plus IconWrapper and getAccessibleIconProps @52b2a89a](../../tests/icons.test.tsx#L57)).
All four resolve through the `"."` exports entry. `npm pack --dry-run`
ships `dist/icons/Icon.{js,d.ts}` and `dist/icons/index.{js,d.ts}`
([validated by npm pack --dry-run ships dist/icons/Icon and dist/icons/index with their d.ts files @52639f5e](../../tests/icons-dist.test.ts#L55),
[validated by tsc accepts icon-type-assertions.tsx against dist via the '.' exports entry @2d24baec](../../tests/icons-dist.test.ts#L51)).

## Accessibility contract

The tested accessibility behaviour holds for every icon: no label →
`aria-hidden="true"` and no
`role`; a label → `aria-hidden="false"`, `role="img"`, `aria-label` set
([validated by @97eea666](../../tests/icons.test.tsx#L180),
[L198@2767e51a](../../tests/icons.test.tsx#L198),
[L214@472e3fa8](../../tests/icons.test.tsx#L214),
[L225@532553f9](../../tests/icons.test.tsx#L225),
[L236@69715c2b](../../tests/icons.test.tsx#L236),
[L247@b8375a85](../../tests/icons.test.tsx#L247)). The
`getAttribute`-based class assertions work around `SVGAnimatedString`
([validated by has animation class @f99244cd](../../tests/icons.test.tsx#L276),
[validated by applies className to svg element @da72535a](../../tests/icons.test.tsx#L331)).

`strokeWidth` defaults to `2` and reaches both the `<svg>` and the `<path>`.
`<SearchIcon strokeWidth={1.5} />` renders `stroke-width="1.5"` on the path
([validated by @c17e77f3](../../tests/icons.test.tsx#L310)). `DatabaseIcon` defaults to
`1.5` ([validated by @a365d120](../../tests/icons.test.tsx#L316),
[validated by `uses default strokeWidth of 2 on both the <svg> and the <path>` @36c4c909](../../tests/icons.test.tsx#L303)).

## No brand mark ships

No `LogoIcon` exists in the set: a brand mark is structurally unlike the 24
icons (no stroke, a `fill="currentColor"`
path, `strokeWidth` ignored), and docs/design-notes.md decision 3 forbids a bundled default
mark. `grep -rn "LogoIcon" src/` returns nothing
([validated by grep for "LogoIcon" in src/ returns nothing @a89a0ad4](../../tests/icons.test.tsx#L71)). The README points a
consumer wanting a brand mark at the `assistantAvatar` slot from `docs/design-notes.md`
([validated by README points a consumer wanting a brand mark at the assistantAvatar slot @5cafe8ab](../../tests/icons.test.tsx#L108)).

## Client boundary

No file under `src/icons/` carries `"use client"` - the icons use no
client-only React API. `scripts/check-client-directives.mjs`
passes against every file under `src/icons/`, per docs/design-notes.md
decision 1
([validated by exits zero against src/ and dist/ @9fb125f7](../../tests/client-directives.test.ts#L90),
[validated by no file under src/icons carries "use client" @f17fda4f](../../tests/icons.test.tsx#L127)).
Every relative import under `src/icons/` ends in `.js` and no file contains
`"@/` ([validated by every relative import under src/icons ends in .js and no file contains "@/ @37e39e34](../../tests/icons.test.tsx#L115)).
