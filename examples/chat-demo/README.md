# chat-demo

A standalone Vite + React app that consumes `@re-cinq/bowman-ui` exactly as an
outside consumer would: the bare specifier, the packed tarball, no path alias
into `src/`. It is the worked example behind `scripts/consumer-app.sh` and the
surface the Playwright suite in `tests/` drives.

The landing at `/` is the component documentation - the page GitHub Pages
publishes. The chat is a local-test-only fixture at `/?view=chat` with no
on-page link to it: it is the surface `scripts/consumer-app.sh` proves the
packed tarball renders, and the target of the assistive-technology pass, but it
is no longer a published page.

## Running it

```sh
npm install
npm run dev
```

`npm run build` then `npm run preview` serves the production build, which is
what the Playwright suite (`npm test`) runs against.

## Component documentation

The landing view - bare `/`, with `/?view=docs` kept as an alias so existing
component links still resolve - is a reference page per public component, plus
an index that lists them all and an overview of the non-component surface at
`/?view=docs&component=overview`. The index opens with a hero screenshot of a
chat built with the library. Each component page carries, in order, a purpose
paragraph, the import line, a live example with its source, a props table, the
component's exported default labels and the states worth looking at.

Two of those sections cannot drift from the library:

- The usage listing is the example file's own text. Each example lives in
  `src/docs/examples/`, is imported twice - once as a component to render, once
  through Vite's built-in `?raw` suffix to read its source - and the page shows
  both. There is no second copy to forget.
- The props tables in `src/docs/propDocs.ts` are each closed with
  `satisfies Record<keyof XProps, PropDoc>`. A prop added upstream with no row
  is a missing-key error, and a row for a prop that no longer exists is an
  excess-property error. `npm run typecheck` is the gate, and
  `scripts/consumer-app.sh` runs it against the packed tarball in CI.

The labels table is `Object.entries` over the library's own exported defaults,
so it needs no maintenance either.

The documentation content itself - purposes, prop descriptions, snippets and
state captions - is English: it describes an English API, and translating it
twice would only give it somewhere to drift. The page chrome around it
(navigation, headings, table column names) is English too, unconditionally -
`src/docs-labels.ts` is the docs view's only label source, and it does not
read `VITE_DEMO_LOCALE`. Only the chat demo (the default view, no `?view`
parameter) honors that switch.

`src/App.tsx` renders the chat only for `?view=chat`; every other URL - bare
`/` and the `?view=docs` alias included - renders the documentation.

## The hero screenshot

The index's hero image is `src/docs/assets/chat-hero.png`, imported into
`src/docs/IndexPage.tsx` so Vite rewrites its URL for the Pages base path.
It is generated reproducibly, never edited by hand: `src/docs/hero-fixture.ts`
is an English houseplant-care conversation, `src/docs/HeroPreview.tsx` renders
it through the real `ChatMessageList`, and `scripts/capture-hero.mjs`
screenshots it. To regenerate it (the library must be installed the way
`scripts/consumer-app.sh` installs it - the committed manifest declares no
`@re-cinq/bowman-ui` dependency):

```sh
npm install --no-save <path-to-bowman-ui-tarball>
node scripts/capture-hero.mjs
```

The capture script lives under `scripts/`, not `tests/`, so Playwright's
`testDir` never runs it in the gating suite.

## Publishing

`.github/workflows/pages.yml` builds this demo and deploys it to GitHub Pages
on every push to `main`, so the documentation at `/` (the published landing)
and the chat fixture at `?view=chat` are reachable without checking the
repository out. The published chat renders in English: the workflow's build
step sets `VITE_DEMO_LOCALE=en`. Local runs and `ci.yml` leave it unset and get
the Danish default the Playwright suite asserts against.

This is a static build with no backend: the chat's replies are canned fixtures
grown by `setTimeout` (`src/streaming.ts`), never a model call. A note on the
index and in the chat view says so plainly, so a visitor does not mistake the
demonstrated AI-disclosure band for a live model.

Pages is a repository setting, not something a workflow can switch on: until
this repository is public - or on a plan that allows Pages for private
repositories - and Pages is set to the "GitHub Actions" source, that workflow
fails at its configure step. It is committed ready for the day the repository
opens up.

A project site is served from `/bowman-ui/`, which the workflow passes to the
build as `VITE_BASE_PATH`; `vite.config.ts` adds the trailing slash Vite wants
and falls back to `/` when the variable is unset, so every local run and every
check in `ci.yml` is untouched by it.

## Language

The demo ships two label catalogues and defaults to Danish.

```sh
VITE_DEMO_LOCALE=en npm run dev
```

`VITE_DEMO_LOCALE` accepts `da` (the default, and the value used whenever the
variable is unset or unrecognised) and `en`. `src/activeLabels.ts` is the only
place the choice is made; `src/labels.ts` holds the Danish catalogue and
`src/labels.en.ts` the English one.

The English catalogue is deliberately thin: every component exports a complete
English default label set, so `labels.en.ts` reuses those defaults and writes
out only the strings no default can supply - the required `aiDisclosure` and
the demo's own screen copy.

Two things stay Danish under `VITE_DEMO_LOCALE=en`: the canned conversation
content in `src/fixtures.ts` and the streamed reply in `src/streaming.ts`.
They are fixture prose, not labels, and the locale switch is about proving the
label-substitution mechanism.

Danish is not just the default, it is the tested configuration. The Playwright
suite asserts Danish strings and sweeps the rendered document for the
library's English defaults, and the assistive-technology pass described in
`docs/accessibility/README.md` runs against the Danish catalogue. Neither runs
under `en`; verify that build by hand.

## Demonstration-only controls

The sidebar's settings nav item and the sign-out button in the sidebar footer
exist to show that `AppSidebar` accepts nav items and a footer slot. The demo
has no settings screen and no authentication, so both raise a toast reading
"Kun til demonstration - ikke en rigtig side." rather than pretending to
navigate.
