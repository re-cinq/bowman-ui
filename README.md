# bowman-ui

Presentational React components for AI chat interfaces.

`@re-cinq/bowman-ui` provides props-driven chat UI building blocks - message rendering, composer, conversation list, app shell - with no authentication, data-fetching, routing, or i18n dependencies. Consumers supply data and labels; the components render them.

The name follows the pairing the org chose: HAL Engine is the engine that thinks, Bowman is the face that talks to you.

## Install

```sh
npm install @re-cinq/bowman-ui
```

No version has been published yet; the install line above starts working with the first `v*` release.

## Requirements

- React and React DOM `^19.0.0` as peer dependencies. That range is what the components are tested against (React 19.2) - it is not a claim of React 18 support.
- Node.js `>=22` for development.

## Styles

Add two lines to your app's CSS entry:

```css
@import "@re-cinq/bowman-ui/styles.css";
@source "../node_modules/@re-cinq/bowman-ui/dist";
```

(Adjust the `@source` path so it points at the installed `dist` relative to your CSS file.)

Tailwind CSS v4 is required: the stylesheet ships only what Tailwind cannot generate from a class name - three animation keyframes (`bowman-fade-in`, `bowman-fade-dot`, `bowman-pulse-subtle`) with their utility rules, the `bowman-md-*` markdown element styling used by `markdownComponents`, and an unconditional `prefers-reduced-motion` rule. Everything else on the components - layout, color, `dark:` variants - is plain Tailwind utility class names in the built files, and your own Tailwind v4 build generates their CSS by scanning the installed `dist`. That is what the `@source` line is for: Tailwind v4 does not scan `node_modules` by default, so without it the components render unstyled. How `dark:` resolves (media query or class strategy) stays your build's decision.

`styles.css` itself is plain CSS - no Tailwind at-rules - so a non-Tailwind consumer can import it too, but must then supply the utility styles the components reference by other means.

## Icons

23 SVG icon components (`SearchIcon`, `ChatIcon`, `LoadingIcon`, ...) are exported from the package root, each typed with the public `IconProps` (`{className?, ariaLabel?, strokeWidth?}`). Omit `ariaLabel` for a decorative icon (`aria-hidden="true"`); pass it for a meaningful one (`role="img"` plus `aria-label`). `strokeWidth` defaults to `2` (`DatabaseIcon` to `1.5`). `LoadingIcon` spins via Tailwind's core `animate-spin` utility - your Tailwind build generates it when scanning the installed `dist` (see [Styles](#styles)); it needs nothing from `styles.css`. Its default `ariaLabel` of `"Loading"` is the icon set's only user-visible string, overridable per call site.

There is no brand mark in the set. A consumer who wants one supplies it through the `assistantAvatar` slot described in [CONTRACT.md](./CONTRACT.md) (decision 3) - the library does not ship a fallback logo.

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Two TypeScript installs exist on purpose: `typescript` (~6.x) feeds the lint stack, because `typescript-eslint` caps its peer range below TypeScript 7, while the `typescript7` alias (`npm:typescript@~7.0.2`) is the actual compiler that `build` and `typecheck` invoke. Do not "clean up" the alias, and do not enable type-aware linting (`recommendedTypeChecked`) without revisiting this split — the linter would type-check with a different compiler major than the build.

## License

Apache-2.0
