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
