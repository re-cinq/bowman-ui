# chat-demo

A standalone Vite + React app that consumes `@re-cinq/bowman-ui` exactly as an
outside consumer would: the bare specifier, the packed tarball, no path alias
into `src/`. It is the worked example behind `scripts/consumer-app.sh` and the
screen the Playwright suite in `tests/` drives.

## Running it

```sh
npm install
npm run dev
```

`npm run build` then `npm run preview` serves the production build, which is
what the Playwright suite (`npm test`) runs against.

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
