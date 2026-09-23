# bowman-ui consumer app

| Field  | Value                                   |
| ------ | --------------------------------------- |
| Issue  | issue 82 (`082-bowman-ui-consumer-app`) |
| Status | In Progress                             |

`examples/chat-demo` is the worked consumer: a standalone Vite + React app
that installs `@re-cinq/bowman-ui` from a freshly packed tarball - never the
source tree, never the registry
([validated by](../../scripts/consumer-app.sh#L99)) - and renders a full
chat screen in a real Chromium and a real WebKit. It proves what no jsdom test can: the
package's eight major components in one document, compiled by a real Tailwind v4
build, laid out by a real browser. The whole proof is one command,
`npm run consumer` ([validated by](../../package.json#L55)), documented in the
README's Worked consumer section ([validated by](../../README.md#L203)).

Anchor caveat: `scripts/reanchor-spec-links.mjs` tracks every `(../)+path#Lnn` link, so this
spec's links into `examples/`, `package.json` files, workflow files and root config files are
re-anchored and rot-checked by CI along with the rest. A link into a file that is not a test
is mapped through the diff hunks of that file since the merge base, so a line the branch
rewrites is reported for a manual fix rather than guessed at.

## The demo app

`examples/chat-demo/package.json` is `private: true`
([validated by](../../examples/chat-demo/package.json#L3)), `"type": "module"`
and declares no `@re-cinq/bowman-ui` dependency at all - the version under
test is always the tarball `npm pack` just produced
([validated by](../../scripts/consumer-app.sh#L99)). `react` and `react-dom`
are pinned at exactly `19.3.0`
([validated by](../../examples/chat-demo/package.json#L15)), the version
docs/design-notes.md decision 4 records as the one CI installs and the only one tested
([validated by is the same in decision 4, the README, the lockfile, the chat-demo pin and the rsc-fixture pin](../../tests/react-version-consistency.test.ts#L54)).

The Tailwind dependency is `tailwindcss@4.3.3` with the matching
`@tailwindcss/vite@4.3.3` Vite adapter
([validated by](../../examples/chat-demo/package.json#L19),
[L24](../../examples/chat-demo/package.json#L24)) - the major (v4) the
package requires of consumers, at the
exact version this repo's own devDependencies resolve. Every demo dependency
is an exact pin and the demo lockfile is committed, so `npm ci` installs the
exact recorded tree ([validated by](../../scripts/consumer-app.sh#L97)). The
tarball install runs with `--no-save`, so the per-version tarball path never
enters the committed manifest or lockfile
([validated by](../../scripts/consumer-app.sh#L100)).

`src/styles.css` contains exactly the three documented lines -
`@import "tailwindcss";`, `@import "@re-cinq/bowman-ui/styles.css";` and
`@source "../node_modules/@re-cinq/bowman-ui/dist";` - and nothing else
([validated by](../../examples/chat-demo/src/styles.css#L1)). Those lines were
sufficient to render the screen, so the README's Styles section needed no
amendment.

Since the theming tokens (issue 210) a second stylesheet,
`src/custom-theme.css`, sets every `--bowman-*` token the library exposes under
the `.custom-theme` wrapper - never `:root` - and `main.tsx` imports it after
`./styles.css`; the three-line entry stylesheet above is unchanged
([validated by](../../examples/chat-demo/src/main.tsx#L1)).

### Composition

`App.tsx` imports `AppShell`, `AppSidebar`, `ConversationList`,
`ChatMessageList`, `ChatComposer` and `Toast` as value imports from the bare
specifier `@re-cinq/bowman-ui`
([validated by](../../examples/chat-demo/src/App.tsx#L2)). All state lives in
`App.tsx` `useState` hooks
([validated by](../../examples/chat-demo/src/App.tsx#L64)); the assistant
reply is a `setTimeout` appending a fixture entry - no fetch, no WebSocket, no
engine ([validated by](../../examples/chat-demo/src/App.tsx#L128)).

`renderSidebar` returns `AppSidebar` with the brand passed as a plain text
node, two nav items, `ConversationList` as `children` and a button in `footer`
([validated by](../../examples/chat-demo/src/App.tsx#L169)).
`ChatMessageList` sits above `ChatComposer` inside the shell's `children`,
wrapped in the bounded flex column (`flex h-full min-h-0 flex-col`) that
docs/design-notes.md § Layout requires of consumers
([validated by](../../examples/chat-demo/src/App.tsx#L206)), and copy shows a
`Toast` ([validated by](../../examples/chat-demo/src/App.tsx#L228)).

`src/themes.tsx` adds the `&theme=copperline` dimension to `?view=chat`:
`resolveTheme` maps the query value to a theme - the Marginalia Books default,
or the invented Copperline Bicycles company - and `ChatScreen` wraps the whole
fragment, shell and toast alike, in the theme's `.custom-theme` wrapper and
passes its chainring mark as `ChatMessageList`'s `assistantAvatar`; an
unknown value falls back to the default
([validated by](../../examples/chat-demo/src/themes.tsx#L46)). The wrapper,
the tokens it sets and the browser proof are specified in
`specs/bowman-ui-theming-tokens/spec.md` § The demo, not restated here.

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
one module). `src/labels.ts` is the chat screen's catalogue, and it is
deliberately thin: every component exports a complete English default label
set, so the module reuses those defaults and writes out only the strings no
default can supply - the required `aiDisclosure` (docs/design-notes.md § Labels
decision 5) and the demo's own screen copy
([validated by](../../examples/chat-demo/src/labels.ts#L1)). "Single" is
looser than it was: the two theme names live with their themes in
`src/themes.tsx`, and the Theming section's explanatory copy with its previews
in `src/docs/ThemingSection.tsx`, beside the docs chrome's own
`src/docs-labels.ts` - none of them a second locale, all of them English.

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
  `dist/styles.css`), `package.json`, `LICENSE`, `README.md` and
  `THIRD-PARTY-NOTICES.md`, and nothing from `examples/`, `src/` or `tests/`
  ([validated by](../../scripts/consumer-app.sh#L51))
- asserts the committed demo manifest declares no `@re-cinq/bowman-ui`
  dependency, and the Playwright config no `executablePath` and both the
  `chromium` and the `webkit` project, so none of those claims rests on prose
  alone ([validated by](../../scripts/consumer-app.sh#L76))
- copies `examples/chat-demo/` to a `mktemp -d` directory, excluding any
  local `node_modules`, `dist` and reports so the temp tree is exactly the
  committed demo, lockfile included
  ([validated by](../../scripts/pack-to-temp.sh#L22))
- asserts the install directory is not inside the repo working tree and exits
  non-zero naming both paths if it is
  ([validated by](../../scripts/pack-to-temp.sh#L15))
- installs the `.tgz` by file path
  ([validated by](../../scripts/consumer-app.sh#L99)), which also matters
  for styling: a tarball install unpacks a real directory for the `@source`
  scan, where a `file:` directory dependency would only symlink
- runs `scripts/scan-forbidden-node-modules.sh` (issue 100 moved the
  `find` into this script so the `rsc` CI job could share one copy) over the
  temp install's `node_modules` for the forbidden packages at any depth,
  naming the matched path on failure
  ([validated by](../../scripts/scan-forbidden-node-modules.sh#L14))
- runs `tsc --noEmit` in the temp copy under `"strict": true` and
  `"moduleResolution": "bundler"`
  ([validated by](../../scripts/consumer-app.sh#L106),
  [tsconfig](../../examples/chat-demo/tsconfig.json#L5))
- runs `vite build` ([validated by](../../scripts/consumer-app.sh#L109)),
  installs the Chromium and WebKit builds matching the demo's pinned
  `@playwright/test` with `--with-deps` so a Linux runner gets their system
  libraries from the same pinned version (issue 200 added WebKit)
  ([validated by the install command](../../scripts/consumer-app.sh#L112)),
  and runs the suite against `vite preview` (started by Playwright's
  `webServer`), never `vite dev`
  ([validated by](../../scripts/consumer-app.sh#L115),
  [webServer](../../examples/chat-demo/playwright.config.ts#L17))
- removes its temp directory and tarball on exit including failure, and
  `--keep` retains both and prints their paths
  ([validated by](../../scripts/consumer-app.sh#L29)).

`examples/chat-demo/playwright.config.ts` contains no `executablePath` and no
per-user machine path of any kind, executable-asserted on every run
([validated by](../../scripts/consumer-app.sh#L81)) - a deliberately
minimal Playwright config. Its `projects` are the browser matrix: `chromium`
on the `Desktop Chrome` preset first, then `webkit` on `Desktop Safari`
(issue 200) - both a 1280x720 viewport, Safari's at device scale factor 2 -
and the script asserts both names are declared, so dropping a project cannot
pass silently
([validated by](../../examples/chat-demo/playwright.config.ts#L14),
[webkit](../../examples/chat-demo/playwright.config.ts#L15),
[validated by the projects guard](../../scripts/consumer-app.sh#L85)). On CI the suite
runs with one worker and two retries; the reply and toast timings race a
contended runner otherwise
([validated by](../../examples/chat-demo/playwright.config.ts#L8)).

## The Playwright suite

All statements below executed green on 2026-09-22 against the packed tarball
in both projects (102 passed - the 51 tests of the chat, docs and theming
suites in each of Chromium and WebKit - exit 0), re-run for the WebKit
project of issue 200; a statement holds in both engines unless it says
otherwise. See
`specs/bowman-ui-theming-tokens/spec.md` § The demo for the theming suite,
`tests/theming.spec.ts`, which this spec does not restate.

The rendered screen exposes, by role query rather than CSS selector: one
`aside`, one `nav` with two items, three conversation list items, one `main`,
user and assistant entries, and the composer textarea. `AppShell` renders
`renderSidebar` twice (desktop rail and mobile drawer); the counts are exact
because role queries exclude the `display: none` copy at each viewport
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L39),
[L40](../../examples/chat-demo/tests/chat-demo.spec.ts#L40),
[L47](../../examples/chat-demo/tests/chat-demo.spec.ts#L47),
[L49](../../examples/chat-demo/tests/chat-demo.spec.ts#L49),
[L50](../../examples/chat-demo/tests/chat-demo.spec.ts#L50),
[L57](../../examples/chat-demo/tests/chat-demo.spec.ts#L57)).

Typing into the composer and pressing Enter appends a user entry, and the
fixture reply appends an assistant entry, with no data layer between the
composer's submit handler and the list's entries
([validated by Enter appends the typed user entry and the fixture assistant reply follows](../../examples/chat-demo/tests/chat-demo.spec.ts#L73)).

Clicking copy on an assistant entry shows the toast, and it disappears on its
own - a real timer in a real event loop, no fake timers anywhere in the suite.
The dismissal is bounded on both sides against the screen's own
`toastDurationMs` (`examples/chat-demo/src/toastDuration.ts`, the one number
`App.tsx` mounts the `Toast` with): measured from the click, the toast lives
at least that long, and measured from the pill being visible it is gone less
than 2.5 s later - so a slow click on a contended runner cannot eat the slack -
and a toast dismissed at half the duration or lingering to twice it both fail
where the former
`toHaveCount(0, { timeout: 10_000 })` passed any duration under ten seconds
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L201),
[L202](../../examples/chat-demo/tests/chat-demo.spec.ts#L202),
[L188](../../examples/chat-demo/tests/chat-demo.spec.ts#L188)). The toast is
located via its visible pill and its unmount, because `Toast` deliberately
renders the message twice (an `aria-hidden` pill and a visually-hidden live
region).

One `getComputedStyle` assertion proves the consumer's Tailwind build scanned
the installed `dist`: the `aside`'s `lg:w-72` - a class only the library's
built files carry, never written by the demo - resolves to a computed width
of `288px`
([validated by the consumer Tailwind build scanned the installed dist](../../examples/chat-demo/tests/chat-demo.spec.ts#L68)).

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

The resolved `aiDisclosure` is visible by exact text with entries present and
in the empty state
([validated by the disclosure is visible in the empty state](../../examples/chat-demo/tests/chat-demo.spec.ts#L241),
[L214](../../examples/chat-demo/tests/chat-demo.spec.ts#L214)). The obligation
applies regardless of server location because the agent serves EU users. The
disclosure sits outside the scrollable region - it is not a descendant of the
`role="log"` region and stays in the viewport with the transcript scrolled to
either end
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L233),
[L218](../../examples/chat-demo/tests/chat-demo.spec.ts#L218)). The transcript
is first asserted to overflow (`scrollHeight > clientHeight`), so the two
`scrollTop` writes move something rather than being no-ops on a fixture that
fits the viewport
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L228)).

### Mobile drawer focus trap

At a 375x667 viewport the drawer starts closed, the hamburger opens it, `Tab`
from the last focusable element inside it returns to the first, and `Escape`
closes it and returns focus to the hamburger - the first execution of the focus
trap where `offsetParent` is a real value rather than the jsdom shim
([validated by the drawer starts closed, traps focus and closes on Escape](../../examples/chat-demo/tests/chat-demo.spec.ts#L265),
[validated by the drawer starts closed, traps focus and closes on Escape](../../examples/chat-demo/tests/chat-demo.spec.ts#L269),
[validated by the drawer starts closed, traps focus and closes on Escape](../../examples/chat-demo/tests/chat-demo.spec.ts#L280),
[validated by the drawer starts closed, traps focus and closes on Escape](../../examples/chat-demo/tests/chat-demo.spec.ts#L283)). The test waits
for the trap to have focused the close button before moving focus itself: the
trap focuses a frame after opening, and a test that focused the last element
before that frame let the trap's own focus land second and the `Tab` move on
past the close button - two of three local runs failed that way
([validated by the drawer starts closed, traps focus and closes on Escape](../../examples/chat-demo/tests/chat-demo.spec.ts#L275)).

### Browser-only behaviour (issue 151)

Behaviour that jsdom cannot exercise - layout, media queries, the browser's
own focus navigation and native controls - runs against the packed tarball in
Chromium and, since issue 200, in WebKit. Each statement's owning spec
carries the same anchor: sticky scroll
in `specs/bowman-ui-message-list/spec.md`, the skip link, the rotate and the
drawer's reduced motion in `specs/bowman-ui-app-shell/spec.md`, the dots'
reduced motion in `specs/bowman-ui-stylesheet-entry/spec.md`, the dark scheme
in `specs/bowman-ui-theming-tokens/spec.md`, the reveals in
`specs/bowman-ui-chat-message/spec.md` and
`specs/bowman-ui-conversation-list/spec.md`, and the search field in
`specs/bowman-ui-styled-primitives/spec.md`.

- A reader who scrolls the transcript to the top mid-stream is still at the
  top when the reply commits, and a reader left at the bottom is within a
  pixel of it - real `scrollHeight`, real `scrollTo`
  ([validated by a reader who scrolls to the top mid-stream is still at the top when the reply commits](../../examples/chat-demo/tests/chat-demo.spec.ts#L452),
  [validated by a reader left at the bottom is still at the bottom when the reply commits](../../examples/chat-demo/tests/chat-demo.spec.ts#L489)).
- An assistant entry's action row and a conversation row's delete button have
  computed opacity `0` at rest and `1` on hover or when focus enters them; the
  demo wires `ConversationList`'s `onDelete`, so `Enter` on the revealed
  delete button removes the row and its entries, and deleting the current
  conversation makes the first remaining one current ([validated by an assistant entry's action row is invisible at rest and revealed by hover or by focus](../../examples/chat-demo/tests/chat-demo.spec.ts#L510),
  [validated by the current conversation's delete button is invisible at rest, revealed on focus, and Enter removes the row and moves the current mark](../../examples/chat-demo/tests/chat-demo.spec.ts#L535),
  [App](../../examples/chat-demo/src/App.tsx#L196)).
- `Tab` on a fresh load reaches the skip link first, and `Enter` on it sends
  the next `Tab` inside `main`
  ([validated by Tab reaches the skip link first, and Enter on it sends the next Tab inside main](../../examples/chat-demo/tests/chat-demo.spec.ts#L570)).
- With the drawer open at 375px and the viewport then grown to 1024px, three
  `Tab`s each move focus forward through `main` and never into the hidden
  drawer
  ([validated by after the viewport grows to desktop, three Tabs advance through main, never the drawer](../../examples/chat-demo/tests/chat-demo.spec.ts#L609)).
- Under `prefers-reduced-motion: reduce` a thinking dot's computed
  `animation-name` is `none` and the drawer's `transition-duration` is `0s`,
  against `bowman-fade-dot` and `0.3s` without the emulation
  ([validated by the thinking dots animate by default and stop under prefers-reduced-motion](../../examples/chat-demo/tests/chat-demo.spec.ts#L646),
  [L660](../../examples/chat-demo/tests/chat-demo.spec.ts#L660)).
- Under the dark colour scheme the enabled send button and the composer
  surface resolve to the `-dark` fallbacks, which differ from the light shades
  ([validated by the send button and the composer's surface resolve to the dark palette fallbacks](../../examples/chat-demo/tests/theming.spec.ts#L310)).
- The documentation gains a `search-field` page with a `SearchFieldExample`,
  and the engine's native clear control empties the controlled field through
  `onChange("")` in both engines; `Escape` does so in Chromium only, and the
  test asserts that WebKit leaves the value (issue 218)
  ([validated by typing narrows the example's count, the native clear control empties the field through onChange, and Escape does so in Chromium only](../../examples/chat-demo/tests/docs.spec.ts#L176)).

Each of these was shown red against a deliberately broken condition before
this record (the unpin removed, the reveal classes dropped, the skip link's
`href` broken, the trap's visibility filter removed, the reduced-motion block
deleted, the `dark:` halves of two tokens dropped, the demo's toast mounted
at half and at twice its duration, `onDelete` unwired, the search input
swallowing the empty string, and a 2000px viewport for the overflow
precondition).

### The WebKit project (issue 200)

Since issue 200 the suite runs once per project and the proof is the union:
every statement in this spec holds in Chromium and in WebKit unless it says
otherwise. WebKit is a second-engine regression net for layout, focus
navigation, media queries and native controls. It is not a proof of the
Safari-specific lines in `src/` - this suite does not distinguish the
explicit `role="list"` or the `checkVisibility` branch from their absence -
and it is not the assistive-technology pass, which
`specs/bowman-ui-assistive-technology-pass/spec.md` keeps manual: headless
WebKit is neither Safari nor VoiceOver. Two divergences surfaced on the
first run and are recorded rather than hidden:

- WebKit's plain `Tab` skips links and buttons unless the Option modifier is
  held (the macOS keyboard-UI mode Playwright's WebKit runs under, with full
  keyboard access off; a host with it on tabs to them anyway), so the two
  tests that press `Tab` to reach a button or a link - focus after send
  (issue 131) and the skip link - press it through `tabForward`, which sends
  `Alt+Tab` under the `webkit` project and `Tab` elsewhere. The conditional
  keeps the Chromium project pressing the key its users press and never rests
  on how a non-Mac Chromium treats the modifier; the non-Mac WebKit ports
  ignore the modifier for focus navigation, so there `Alt+Tab` is `Tab`.
  `.focus()` was rejected because it would delete the tab-order proof in both
  engines. The
  trap-driven `Tab` of the mobile drawer and the three `Tab`s of the rotate
  test pass unchanged in both engines, as they are handled by the trap's own
  listener or land on a textarea
  ([validated by Tab to send then Enter or Space appends the entry and returns focus to the textarea](../../examples/chat-demo/tests/chat-demo.spec.ts#L408),
  [validated by Tab reaches the skip link first, and Enter on it sends the next Tab inside main](../../examples/chat-demo/tests/chat-demo.spec.ts#L570),
  [helper](../../examples/chat-demo/tests/chat-demo.spec.ts#L30)).
- WebKit's search input has no `Escape`-to-clear, so the search-field test
  expects `""` after `Escape` in Chromium and the typed value in WebKit - an
  executable record of issue 218 that goes red the day the engines agree,
  where a skip would decay silently
  ([validated by typing narrows the example's count, the native clear control empties the field through onChange, and Escape does so in Chromium only](../../examples/chat-demo/tests/docs.spec.ts#L176)).

The cost is one more browser download with its OS packages and a second pass
of the suite in the `consumer` job and in publish's `verify`, both of which
run the script unchanged
([validated by](../../scripts/consumer-app.sh#L112)).

## The static import ban

`scripts/check-forbidden-imports.mjs` parses every file under `src/` with
`ts.createSourceFile` and exits non-zero on any import, re-export, dynamic
`import()` or `require()` whose non-relative specifier does not resolve to
a package declared in `package.json`
([validated by](../../scripts/check-forbidden-imports.mjs#L100)). The
allowlist is read at runtime from `dependencies` plus `peerDependencies`
([validated by](../../scripts/check-forbidden-imports.mjs#L31)), and a
subpath of a declared package counts as the package
([validated by](../../scripts/check-forbidden-imports.mjs#L41)). This
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
([validated by](../../scripts/check-forbidden-imports.mjs#L88)). The check
runs as the named `ci.yml` step "Forbidden import check"
([validated by](../../.github/workflows/ci.yml#L54)). It is static on top of,
not instead of, the dynamic `node_modules` scan in `consumer-app.sh`: a grep
misses a transitively pulled-in package, and a `node_modules` scan misses a
source import a bundler tree-shakes away.

## CI and publish wiring

The `consumer` job in `ci.yml` runs on every pull request (the workflow's
unfiltered `pull_request` trigger), pins its actions to the same commit SHAs
as the existing job with `persist-credentials: false`
([validated by](../../.github/workflows/ci.yml#L135)), takes its setup from
the shared `setup-node-install` composite action, which sets
Node from `.nvmrc` via `node-version-file` ([validated by](../../.github/actions/setup-node-install/action.yml#L19)),
runs `npm ci --ignore-scripts`
([validated by](../../.github/actions/setup-node-install/action.yml#L23)) and, because the job passes
`build: "true"`, the one input the composite action's build step is gated on
([validated by](../../.github/actions/setup-node-install/action.yml#L25)), an explicit
`npm run build` before packing
([validated by](../../.github/actions/setup-node-install/action.yml#L27)), and runs the script as
its `Consumer app check` step with no browser install step of its own - the
script installs the demo's pinned Chromium and WebKit itself
([validated by](../../.github/workflows/ci.yml#L148)). It omits
`fetch-depth: 0` on purpose: that exists for the spec anchor check, which
this job does not run.

`publish.yml` runs `scripts/consumer-app.sh` in its credential-free `verify`
job, after `test:coverage` has built `dist/`; the `publish` job holds the
OIDC credential, runs no example-app code, and only `needs:` that green
result ([validated by](../../.github/workflows/publish.yml#L101)).

## Gates preserved

- `tsconfig.json` excludes `examples/`
  ([validated by](../../tsconfig.json#L17)).
- The coverage `include` still scopes to `src/**` at the unchanged
  100/100/100/100 thresholds ([validated by](../../vitest.config.ts#L26));
  vitest's `exclude` gains `examples/**` so the Playwright suite - which
  matches the default spec glob - never runs under vitest
  ([validated by](../../vitest.config.ts#L12)).
- `npm pack --dry-run` ships `dist/`, `package.json`, `LICENSE`, `README.md`,
  `THIRD-PARTY-NOTICES.md` and nothing else, now executable-asserted on every
  consumer run ([validated by](../../scripts/consumer-app.sh#L60)).
- No file under `src/` changed in the PR that introduced the demo - the one
  statement here with no executable anchor: its proof is that PR's diff
  itself, reviewable but not re-runnable.

## Out of scope

Per the issue: proving the `@source` line strictly required (stylesheet-entry
issue), real assistive technology, the RSC/Next fixture, registry publishing,
engine wiring, the real Danish catalogue and disclosure wording
(issue 32), source-app adoption, and visual regression testing.

Theming of the demo was outside this issue too; the
custom-themed variant and the tokens it proves are covered by
`specs/bowman-ui-theming-tokens/spec.md` (issue 210).
