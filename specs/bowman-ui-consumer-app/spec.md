# bowman-ui consumer app

Issue: issue 82 (`082-bowman-ui-consumer-app`)

`examples/chat-demo` is the worked consumer: a standalone Vite + React app
that installs `@re-cinq/bowman-ui` from a freshly packed tarball - never the
source tree, never the registry
([validated by](../../scripts/consumer-app.sh#L93)) - and renders a full
chat screen in a real Chromium. It proves what no jsdom test can: the
package's eight major components in one document, compiled by a real Tailwind v4
build, laid out by a real browser. The whole proof is one command,
`npm run consumer` ([validated by](../../package.json#L32)), documented in the
README's Worked consumer section ([validated by](../../README.md#L41)).

Anchor caveat: `scripts/repoint-spec-anchors.mjs` tracks
`(../)+tests/*.ts(x)` anchors and - since the composer-resize-browser change
widened its regex - `(../)+examples/*/tests/*.ts(x)` anchors, so this spec's
links into `examples/chat-demo/tests/` are repointed by CI. Its links into
other `examples/` files, `scripts/` and workflow files remain plain GitHub
links that CI never repoints - they were authored against this PR's tree and
drift silently if those files are later edited without updating this spec.

## The demo app

`examples/chat-demo/package.json` is `private: true`
([validated by](../../examples/chat-demo/package.json#L3)), `"type": "module"`
and declares no `@re-cinq/bowman-ui` dependency at all - the version under
test is always the tarball `npm pack` just produced
([validated by](../../scripts/consumer-app.sh#L93)). `react` and `react-dom`
are pinned at exactly `19.2.0`
([validated by](../../examples/chat-demo/package.json#L14)), the version
docs/design-notes.md decision 4 records as the one CI installs and the only one tested.
Note recorded, not resolved here: the repo's own `package-lock.json` currently
resolves `^19.2.0` to `19.2.8`, so the recorded version and the lockfile have
drifted - a docs/design-notes.md staleness, tracked in its own issue, not a reason for
this pin to chase the lockfile.

The Tailwind dependency is `tailwindcss@4.3.3` with the matching
`@tailwindcss/vite@4.3.3` Vite adapter
([validated by](../../examples/chat-demo/package.json#L19),
[L24](../../examples/chat-demo/package.json#L24)) - the major (v4) the
package requires of consumers, at the
exact version this repo's own devDependencies resolve. Every demo dependency
is an exact pin and the demo lockfile is committed, so `npm ci` installs the
exact recorded tree ([validated by](../../scripts/consumer-app.sh#L91)). The
tarball install runs with `--no-save`, so the per-version tarball path never
enters the committed manifest or lockfile
([validated by](../../scripts/consumer-app.sh#L94)).

`src/styles.css` contains exactly the three documented lines -
`@import "tailwindcss";`, `@import "@re-cinq/bowman-ui/styles.css";` and
`@source "../node_modules/@re-cinq/bowman-ui/dist";` - and nothing else
([validated by](../../examples/chat-demo/src/styles.css#L1)). Those lines were
sufficient to render the screen, so the README's Styles section needed no
amendment.

### Composition

`App.tsx` imports `AppShell`, `AppSidebar`, `ConversationList`,
`ChatMessageList`, `ChatComposer` and `Toast` as value imports from the bare
specifier `@re-cinq/bowman-ui`
([validated by](../../examples/chat-demo/src/App.tsx#L2)). All state lives in
`App.tsx` `useState` hooks
([validated by](../../examples/chat-demo/src/App.tsx#L32)); the assistant
reply is a `setTimeout` appending a fixture entry - no fetch, no WebSocket, no
engine ([validated by](../../examples/chat-demo/src/App.tsx#L56)).

`renderSidebar` returns `AppSidebar` with the brand passed as a plain text
node, two nav items, `ConversationList` as `children` and a button in `footer`
([validated by](../../examples/chat-demo/src/App.tsx#L63)).
`ChatMessageList` sits above `ChatComposer` inside the shell's `children`,
wrapped in the bounded flex column (`flex h-full min-h-0 flex-col`) that
docs/design-notes.md § Layout requires of consumers
([validated by](../../examples/chat-demo/src/App.tsx#L97)), and copy shows a
`Toast` ([validated by](../../examples/chat-demo/src/App.tsx#L109)).

### Fixtures (GDPR)

`src/fixtures.ts` contains invented names and invented order references
only (`MB-4821-XQ`, `Marginalia Books`, `The Cartographer's Atlas`,
"Margot") - no real customer data, no real order identifiers, no content
copied from a support email (`003-support-conversation-data-flow-record`).
The repo is public, so a fixture file is a publication. The link target is
the whole file
([validated by](../../examples/chat-demo/src/fixtures.ts#L1)).

### Labels

The demo ships English only (the Marginalia Books re-theme collapsed the
original Danish catalogue and the `VITE_DEMO_LOCALE` build-time switch into
one module). `src/labels.ts` is the single catalogue, and it is deliberately
thin: every component exports a complete English default label set, so the
module reuses those defaults and writes out only the strings no default can
supply - the required `aiDisclosure` (docs/design-notes.md § Labels decision 5) and
the demo's own screen copy
([validated by](../../examples/chat-demo/src/labels.ts#L1)).

## The consumer script

`scripts/consumer-app.sh` is `chmod +x`, opens `#!/usr/bin/env bash` with
`set -euo pipefail` ([validated by](../../scripts/consumer-app.sh#L1)), and
(since issue 100 factored the shared pack-and-copy preamble into
`scripts/pack-to-temp.sh`, sourced by this script and `rsc-fixture.sh` alike -
see `specs/bowman-ui-rsc-fixture/spec.md`):

- builds and packs the package through `pack_library`, which runs
  `npm run build` then `npm pack --pack-destination "$TMPDIR"` (`TMPDIR`
  defaulted first, for runners that leave it unset)
  ([validated by](../../scripts/pack-to-temp.sh#L7))
- then asserts `npm pack --dry-run` lists `dist/` (including
  `dist/styles.css`), `package.json`, `LICENSE` and `README.md` and nothing
  from `examples/`, `src/` or `tests/`
  ([validated by](../../scripts/consumer-app.sh#L51))
- asserts the committed demo manifest declares no `@re-cinq/bowman-ui`
  dependency and the Playwright config no `executablePath`, so neither claim
  rests on prose alone ([validated by](../../scripts/consumer-app.sh#L76))
- copies `examples/chat-demo/` to a `mktemp -d` directory, excluding any
  local `node_modules`, `dist` and reports so the temp tree is exactly the
  committed demo, lockfile included
  ([validated by](../../scripts/pack-to-temp.sh#L22))
- asserts the install directory is not inside the repo working tree and exits
  non-zero naming both paths if it is
  ([validated by](../../scripts/pack-to-temp.sh#L15))
- installs the `.tgz` by file path
  ([validated by](../../scripts/consumer-app.sh#L93)), which also matters
  for styling: a tarball install unpacks a real directory for the `@source`
  scan, where a `file:` directory dependency would only symlink
- runs `scripts/scan-forbidden-node-modules.sh` (issue 100 moved the
  `find` into this script so the `rsc` CI job could share one copy) over the
  temp install's `node_modules` for the forbidden packages at any depth,
  naming the matched path on failure
  ([validated by](../../scripts/scan-forbidden-node-modules.sh#L14))
- runs `tsc --noEmit` in the temp copy under `"strict": true` and
  `"moduleResolution": "bundler"`
  ([validated by](../../scripts/consumer-app.sh#L115),
  [tsconfig](../../examples/chat-demo/tsconfig.json#L5))
- runs `vite build` ([validated by](../../scripts/consumer-app.sh#L118)),
  installs the Chromium build matching the demo's pinned `@playwright/test`
  with `--with-deps` so a Linux runner gets its system libraries from the
  same pinned version ([validated by](../../scripts/consumer-app.sh#L121)),
  and runs the suite against `vite preview` (started by Playwright's
  `webServer`), never `vite dev`
  ([validated by](../../scripts/consumer-app.sh#L124),
  [webServer](../../examples/chat-demo/playwright.config.ts#L14))
- removes its temp directory and tarball on exit including failure, and
  `--keep` retains both and prints their paths
  ([validated by](../../scripts/consumer-app.sh#L29)).

`examples/chat-demo/playwright.config.ts` contains no `executablePath` and no
per-user machine path of any kind, executable-asserted on every run
([validated by](../../scripts/consumer-app.sh#L81)) - a deliberately
minimal Playwright config. On CI the suite runs with one
worker and two retries; the reply and toast timings race a contended runner
otherwise ([validated by](../../examples/chat-demo/playwright.config.ts#L8)).

## The Playwright suite

All statements below executed green on 2026-09-01 against the packed tarball
(22 passed across the chat and docs suites, exit 0), re-run for the
Marginalia Books English-only re-theme.

The rendered screen exposes, by role query rather than CSS selector: one
`aside` ([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L32)),
one `nav` with two items
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L33)), three
conversation list items
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L40)), one
`main` ([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L42)),
user and assistant entries
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L43)), and
the composer textarea
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L50)).
`AppShell` renders `renderSidebar` twice (desktop rail and mobile drawer);
the counts are exact because role queries exclude the `display: none` copy at
each viewport
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L32)).

Typing into the composer and pressing Enter appends a user entry, and the
fixture reply appends an assistant entry, with no data layer between the
composer's submit handler and the list's entries
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L66)).

Clicking copy on an assistant entry shows the toast
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L179)), and
it disappears on its own - a real timer in a real event loop, no fake timers
anywhere in the suite
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L181)). The
toast is located via its visible pill and its unmount, because `Toast`
deliberately renders the message twice (an `aria-hidden` pill and a
visually-hidden live region).

One `getComputedStyle` assertion proves the consumer's Tailwind build scanned
the installed `dist`: the `aside`'s `lg:w-72` - a class only the library's
built files carry, never written by the demo - resolves to a computed width
of `288px`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L61)).

### Zero English (superseded)

The original suite swept the rendered document to prove no English default
label string survived under the Danish catalogue - the end-to-end proof of
the label-substitution mechanism. The English-only re-theme removed that
sweep along with the Danish catalogue: the demo now renders the library's
own English defaults on purpose, so absence-of-defaults is no longer a
meaningful assertion. Label substitution itself remains covered by the
library's jsdom suites (`tests/labelled-exports.test.tsx` and the
per-component label tests), which render non-default catalogues against
every labelled export.

### EU AI Act

The resolved `aiDisclosure` is visible by exact text with entries
present ([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L193))
and in the empty state
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L210)). The
obligation applies regardless of server location because the agent serves EU
users. The disclosure sits outside the scrollable region - it is not a
descendant of the `role="log"` region
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L197)) and
stays in the viewport with the transcript scrolled to either end
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L202)).

### Mobile drawer focus trap

At a 375x667 viewport the drawer starts closed
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L233)), the
hamburger opens it
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L237)),
`Tab` from the last focusable element inside it returns to the first
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L245)), and
`Escape` closes it and returns focus to the hamburger
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L248)) - the
first execution of the focus trap where `offsetParent` is a real value rather
than the jsdom shim.

## The static import ban

`scripts/check-forbidden-imports.mjs` parses every file under `src/` with
`ts.createSourceFile` and exits non-zero on any import, re-export, dynamic
`import()` or `require()` whose non-relative specifier does not resolve to
a package declared in `package.json`
([validated by](../../scripts/check-forbidden-imports.mjs#L118)). The
allowlist is read at runtime from `dependencies` plus `peerDependencies`
([validated by](../../scripts/check-forbidden-imports.mjs#L30)), and a
subpath of a declared package counts as the package
([validated by](../../scripts/check-forbidden-imports.mjs#L42)). This
inverts the issue's name blocklist (`@clerk/*`, `swr`, `next-intl`,
`next`/`next/*`, plus `lucide-react` per docs/design-notes.md decision 2, the `@/`
path alias per docs/design-notes.md decision 5, and any internal source-app
package): every one of those names stays banned because none is declared,
and a copy-paste arriving under a name no blocklist ever listed now fails
too.

The red fixture `tests/fixtures/forbidden-imports/red.tsx` carries only
specifiers outside the allowlist, and the script's built-in self-test fails
unless every specifier the fixture carries trips - one allowed specifier
sneaking in would rot the fixture's proof
([validated by](../../scripts/check-forbidden-imports.mjs#L106)). The check
runs as the named `ci.yml` step "Forbidden import check"
([validated by](../../.github/workflows/ci.yml#L56)). It is static on top of,
not instead of, the dynamic `node_modules` scan in `consumer-app.sh`: a grep
misses a transitively pulled-in package, and a `node_modules` scan misses a
source import a bundler tree-shakes away.

## CI and publish wiring

The `consumer` job in `ci.yml` runs on every pull request (the workflow's
unfiltered `pull_request` trigger), pins its actions to the same commit SHAs
as the existing job with `persist-credentials: false`
([validated by](../../.github/workflows/ci.yml#L86)), sets
`node-version: "22"` ([validated by](../../.github/workflows/ci.yml#L91)),
runs `npm ci --ignore-scripts`
([validated by](../../.github/workflows/ci.yml#L94)) and an explicit
`npm run build` before packing
([validated by](../../.github/workflows/ci.yml#L96)), and installs Chromium
with `npx playwright install --with-deps chromium`
([validated by](../../.github/workflows/ci.yml#L100)). It omits
`fetch-depth: 0` on purpose: that exists for the spec anchor check, which
this job does not run.

`publish.yml` runs `scripts/consumer-app.sh` after the Build step and before
`npm publish`, against the tarball the script packs from the tagged commit
([validated by](../../.github/workflows/publish.yml#L63)).

## Gates preserved

- `tsconfig.json` excludes `examples/`
  ([validated by](../../tsconfig.json#L17)).
- The coverage `include` still scopes to `src/**` at the unchanged
  100/100/100/90 thresholds ([validated by](../../vitest.config.ts#L24));
  vitest's `exclude` gains `examples/**` so the Playwright suite - which
  matches the default spec glob - never runs under vitest
  ([validated by](../../vitest.config.ts#L12)).
- `npm pack --dry-run` ships `dist/`, `package.json`, `LICENSE`, `README.md`
  and nothing else, now executable-asserted on every consumer run
  ([validated by](../../scripts/consumer-app.sh#L60)).
- No file under `src/` changed in this PR - the one statement here with no
  executable anchor: its proof is the PR diff itself, reviewable but not
  re-runnable.

## Out of scope

Per the issue: proving the `@source` line strictly required (stylesheet-entry
issue), real assistive technology, the RSC/Next fixture, registry publishing,
engine wiring, the real Danish catalogue and disclosure wording
(issue 32), source-app adoption, and visual regression testing.
