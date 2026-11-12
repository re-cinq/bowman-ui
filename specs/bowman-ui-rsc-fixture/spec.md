# bowman-ui RSC fixture

| Field  | Value                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------- |
| Issue  | issue 100 (the RSC fixture build docs/design-notes.md decision 1 calls "078's RSC fixture build") |
| Status | In Progress                                                                                       |

`examples/rsc-fixture` is the executable proof of the `"use client"`
boundary: a standalone Next.js App Router app that installs
`@re-cinq/bowman-ui` from a freshly packed tarball - never the source tree,
never the registry ([validated by @6960dd7c](../../scripts/rsc-fixture.sh#L125)) - and
compiles it with `next build` under Turbopack. `018`'s directive check is
static and `032`'s Vite consumer does not share Next's server/client module
graph, so until this fixture nothing had ever compiled the package inside
the one consumer shape it is built for. The whole proof is one command,
`npm run rsc` ([validated by @62d083eb](../../package.json#L56)), documented in the
README's App Router consumer section ([validated by @93899a4b](../../README.md#L214)).

Anchor caveat (the consumer-app spec's precedent): `re-lint-reanchor` tracks
every `(../)+path#Lnn` link, so this spec's links into `examples/`, workflow files,
`package.json` and root config files are re-anchored and rot-checked by CI along with the rest.
A link into `ci.yml` or `publish.yml` is mapped through that file's diff hunks since the merge
base, so a cited line a branch rewrites is reported for a manual fix rather than guessed at.

## The fixture app

`examples/rsc-fixture/package.json` is `private: true`
([validated by @a3fa150e](../../examples/rsc-fixture/package.json#L3)),
`"type": "module"`, and declares no `@re-cinq/bowman-ui` dependency at all -
the version under test is always the tarball `npm pack` just produced,
executable-asserted before every run
([validated by @6632c540](../../scripts/rsc-fixture.sh#L54)). `react` and `react-dom`
are pinned at exactly `19.3.1`
([validated by the react pin @c3d91cad](../../examples/rsc-fixture/package.json#L11),
[validated by the react-dom pin @31b03e68](../../examples/rsc-fixture/package.json#L12)), the version
docs/design-notes.md decision 4 records as the one CI installs and the only
one tested; the pin is held equal to that record, the README's claim, the
root lockfile and the chat-demo pin by the version-consistency test
([validated by is the same in decision 4, the README, the lockfile, the chat-demo pin and the rsc-fixture pin @49c9589d](../../tests/react-version-consistency.test.ts#L54)). One
caveat recorded rather than papered over: Next substitutes its own vendored
React build for parts of the App Router render, so the pin is a claim about
what the fixture installs, not proof that stock `react@19.3.1` executed every
server frame.

`next` is pinned at exactly `16.4.3`
([validated by the next pin @0bbf4829](../../examples/rsc-fixture/package.json#L18)) - `16.3.3` at
implementation time, since moved by Dependabot's grouped bump, with no `^`.
Turbopack is Next 16's default bundler and the fixture does not opt out: the
measured build banner reads `Next.js 16.4.3 (Turbopack)`, and the config
carries no `--webpack`-equivalent nor any bundler key
([validated by @bcc033e8](../../examples/rsc-fixture/next.config.ts#L3)). `typescript` is
pinned at `7.0.2`, the same version `examples/chat-demo` pins; `next build`'s
own type-checking pass was measured running and finishing under it
("Running TypeScript ... Finished TypeScript"), so the native-port TS needed
no fallback to 5.x
([validated by @4d01de2b](../../examples/rsc-fixture/package.json#L19)).

`next.config.ts` sets neither `transpilePackages` nor
`serverExternalPackages` - the config object is empty, so the fixture proves
what a default consumer gets
([validated by @bcc033e8](../../examples/rsc-fixture/next.config.ts#L3)).

### The server pages

`app/layout.tsx` imports the package stylesheet from the bare specifier and
carries no `"use client"`
([validated by @b8dd1ec5](../../examples/rsc-fixture/app/layout.tsx#L2)).
`app/page.tsx` value-imports `SendIcon`, `CopyIcon`, `CheckIcon` and
`IconWrapper` from `@re-cinq/bowman-ui` and renders all four
([validated by](../../examples/rsc-fixture/app/page.tsx#L2)), and renders
`023`'s `ChatMessage` - a `"use client"` file in `dist/` - as a child of the
server page, the legal direction of the boundary
([validated by @474da2d8](../../examples/rsc-fixture/app/page.tsx#L43)). It also renders a
`KeyValueList`, whose built file carries no directive, and an `info` `Notice` without
`onDismiss`, a `"use client"` file handed only its tone and its text
([validated by](../../examples/rsc-fixture/app/page.tsx#L46)), and the script asserts the
response holds the `<dl>` opening onto its first pair's `<dt>`
([validated by](../../scripts/rsc-fixture.sh#L168)) and the notice's `role="status"` reaching
the notice's own text through markup alone, so another status element on the page cannot stand
in for it ([validated by](../../scripts/rsc-fixture.sh#L175)). Neither page
carries a directive, and no file above them does; the script asserts it
(`test -f` first, so a moved file cannot pass vacuously) over
`app/layout.tsx`, `app/page.tsx` and `src/fixtures.ts` on every run rather
than leaving it to a reviewer reading the diff
([validated by @ea17ddac](../../scripts/rsc-fixture.sh#L60)).

`app/page.tsx` also contains
`import * as bowman from "@re-cinq/bowman-ui"` and renders
`Object.keys(bowman).length`
([validated by @254b680b](../../examples/rsc-fixture/app/page.tsx#L1), the render at
[L36@e6199906](../../examples/rsc-fixture/app/page.tsx#L36)), so no bundler can elide
the namespace; the script asserts the rendered count is present and at
least 40 (53 measured), which is what proves the whole barrel - `useDebounce`
included - sat in the server module graph at render time
([validated by @bee09309](../../scripts/rsc-fixture.sh#L160)). Observation the issue
asked for: the narrow imports alone produced the same build result - with
the namespace import and its render removed, `next build` still exited 0 -
so the namespace import adds no compile-time signal today; it stays because
the rendered count is the only runtime evidence that nothing was elided,
and elision behaviour is the bundler's to change.

### GDPR

`src/fixtures.ts` contains invented data only: an invented customer
("Karla", initials "KT") and the invented order reference `VN-7305-KP` -
no OLT customer data, no real order identifiers, no content copied from a
support conversation. The repo is public-facing per `014`, so a fixture
file is a publication
([validated by @45ccd5b7](../../examples/rsc-fixture/src/fixtures.ts#L1)).

## The compose page: measured, rejected

`app/compose/page.tsx` was authored as a server component passing
`renderSidebar` to `AppShell` and built. The outcome is the rejected case,
read from the error text rather than the exit code alone: `next build`
(16.3.3, Turbopack) fails while prerendering `/compose`, verbatim in
docs/design-notes.md § RSC fixture:

```
Error: Functions cannot be passed directly to Client Components unless you
explicitly expose it by marking it with "use server". Or maybe you meant to
call this function rather than return it.
  {renderSidebar: function renderSidebar, children: ...}
```

Per the issue's rejected branch, the page now ships under `"use client"`
([validated by @dbaa958b](../../examples/rsc-fixture/app/compose/page.tsx#L1)); the
server-component version is this PR's build history, not its tree. The
design-notes rule lists every export with a function-valued prop, derived
mechanically with
`grep -rlE '^ +[A-Za-z"-]+\??: [^;]*=>' dist/components/*.d.ts`
(re-run it against a fresh build to audit the list): `AppShell`,
`AppSidebar`, `Button`, `ChatComposer`, `ChatMessage`, `ChatMessageList`,
`ConversationList`, `ErrorBoundary`, `IconButton`, `PromptChips`,
`SearchField`, `Toast`, `ToolActivity`
([validated by](../../docs/design-notes.md#L962)), and the same sentence appears in
the README ([validated by @11afad50](../../README.md#L226)). `app/client/page.tsx` is
the control: the same composition under `"use client"`, building green, so
the rejection is attributable to the boundary and not to the components
([validated by @dbaa958b](../../examples/rsc-fixture/app/client/page.tsx#L1)). The two
pages differ in content - the compose page renders `AppSidebar`
([validated by @40501f6f](../../examples/rsc-fixture/app/compose/page.tsx#L9)) where the
control renders a bare `nav`
([validated by @1bd608a1](../../examples/rsc-fixture/app/client/page.tsx#L9)) - so
neither is a copy of the other and the control's green build is a real
second data point.

Deliberate coverage gap recorded so a future reader does not "restore" it:
with the rejected outcome shipped, no page in the fixture passes a function
prop from a _server_ component any more - the only build that did so was the
one this PR observed failing and then moved under `"use client"`. That is
inherent to the issue-authorised rejected branch, not an oversight: the
server-boundary rejection is a build-time constant of React's serialization,
recorded in docs/design-notes.md rather than re-proven on every CI run. A future
regression here would surface the day a consumer tries the server idiom, not
in this fixture.

No `"react-server"` condition is added to `exports`; docs/design-notes.md records the
refusal and its reason ([validated by @019c7274](../../docs/design-notes.md#L1026)).

## The script

`scripts/rsc-fixture.sh` is `chmod +x`, opens `#!/usr/bin/env bash` with
`set -euo pipefail` ([validated by @678620c1](../../scripts/rsc-fixture.sh#L1)), and:

- builds and packs via the shared preamble (below), copies
  `examples/rsc-fixture/` to a `mktemp -d`, asserts the install directory is
  not inside the repo working tree and exits non-zero naming both paths if
  it is - `011`/`032`'s identical criterion
  ([validated by @dc33d887](../../scripts/pack-to-temp.sh#L15))
- installs the `.tgz` by file path and never runs a registry install of
  `@re-cinq/bowman-ui` - the only `npm install` lines are the fixture's own
  devDependencies and the tarball path
  ([validated by @6960dd7c](../../scripts/rsc-fixture.sh#L125))
- runs `next build`, then `next start` on port 4319 with the server's PID
  killed in the cleanup trap so an assertion failure between start and kill
  still tears it down ([validated by @1bc9bfa3](../../scripts/rsc-fixture.sh#L133))
- asserts with a bounded thirty-second poll that a plain HTTP request for
  `/` returns a body whose bytes contain `<svg` - and, so Next's own markup
  cannot satisfy the check, the library-specific `viewBox="0 0 24 24"` and
  `stroke="currentColor"` - on the response body, never a hydrated DOM
  ([validated by @67c9ea46](../../scripts/rsc-fixture.sh#L156))
- takes `--keep`, which retains and prints the temp directory (server and
  build logs included), the mutation directory and the tarball
  ([validated by @ffa24eab](../../scripts/rsc-fixture.sh#L8)), and removes all of them
  on exit otherwise, including on failure
  ([validated by](../../scripts/rsc-fixture.sh#L26)).

### `--expect-failure`

The guard is proven red by mutating the packed tarball in an unpacked copy,
reinstalling, and requiring `next build` to fail
([validated by @b4e0590a](../../scripts/rsc-fixture.sh#L86)). The issue named
`dist/hooks/useDebounce.js` as the mutation target; measured, that file
**cannot fail this build**, so per the issue's own escape hatch the spec
names the one that does and why:

- Stripping `"use client";` from `useDebounce.js` left `next build` green.
  The module sat in the server graph (the rendered export count proves it),
  but nothing server-side ever _calls_ the hook - and evaluating a module
  that merely imports `useState`/`useEffect` is legal in a server graph.
  Turbopack on Next 16.3.3 raises no static diagnostic for hook imports in
  server modules (the webpack-era "You're importing a component that needs
  useState" lint did not fire), and React's server condition omits the
  hooks rather than exporting throwing stubs, so nothing failed.
- `dist/components/ChatMessage.js` is the file that does fail:
  `app/page.tsx` renders it, so with its directive stripped its `useState`
  call executes during prerender and the build exits non-zero -
  `TypeError: (0 , c.useState) is not a function or its return value is not
iterable`, `Error occurred prerendering page "/"`.

The script therefore strips the first-statement directive from
`dist/components/ChatMessage.js` (asserting it was present first, so the
mutation cannot silently no-op), repacks preserving npm's `package/` root,
installs the mutated tarball into the same fresh fixture copy - the
pristine tarball is never installed in this mode, so npm cannot dedupe the
mutation away - and **fails when `next build` succeeds**
([validated by @1fe327a1](../../scripts/rsc-fixture.sh#L105)). On the expected failure
it asserts the output carries `useState` and `prerendering page "/"`
([validated by @c8b703db](../../scripts/rsc-fixture.sh#L111)): Next's production
prerender error names the page and the missing hook but ignore-lists stack
frames and minifies module ids, so no file path appears in the output to
grep for; the mutation touches exactly one file, which is what makes the
attribution exact. Directive stripping uses `node -e`, not `sed -i`, whose
in-place flag differs between BSD and GNU
([validated by](../../scripts/rsc-fixture.sh#L91)).

## The shared preamble

The pack-and-copy preamble both consumer scripts need measures **24 lines**
in the form each script would otherwise duplicate (counting rule: the
non-blank body lines of the two helper functions - build and pack, then
mktemp, out-of-tree assert and tar copy - excluding the argument-binding
`local` line that only exists because of the factoring). That exceeds the
issue's ten-line threshold, so it is factored into
`scripts/pack-to-temp.sh` as two functions, `pack_library` and
`copy_example_to_temp` ([validated by @3e238eb4](../../scripts/pack-to-temp.sh#L3)),
sourced and called by both `scripts/consumer-app.sh`
([validated by @9e35ba36](../../scripts/consumer-app.sh#L48)) and
`scripts/rsc-fixture.sh`
([validated by @9e35ba36](../../scripts/rsc-fixture.sh#L73)). Functions rather than a
straight-line script so each caller keeps its own assertion order and its
own cleanup trap, and because a child process could not hand
`TARBALL_PATH`/`APP_DIR` back to its caller. `npm run consumer` was rerun
after the refactor and stayed green (8 Playwright tests passed).
`specs/bowman-ui-consumer-app/spec.md`'s anchors into the moved lines were
re-pointed by hand in this PR - the anchor checker then tracked only
`tests/` anchors and stayed silent; `scripts/` anchors are tracked since
issue 32.

## CI and publish wiring

The `rsc` job in `ci.yml` runs on every pull request (the workflow's
unfiltered `pull_request` trigger) beside `032`'s `consumer` job. It pins
its actions to the same commit SHAs as the existing jobs with
`persist-credentials: false`
([validated by](../../.github/workflows/ci.yml#L165)) - the issue text
named the older `v6`/`v4` SHAs from before this repo moved to `v7` pins;
the existing file's style wins and the deviation is recorded here - and
takes its setup from the shared `setup-node-install` composite action, which
reads Node from `.nvmrc` via `node-version-file` ([validated by @20e1409b](../../.github/actions/setup-node-install/action.yml#L19)),
runs `npm ci --ignore-scripts`
([validated by @a086b78a](../../.github/actions/setup-node-install/action.yml#L23)) and, because the job passes
`build: "true"`, the one input the composite action's build step is gated on
([validated by @cd6e6338](../../.github/actions/setup-node-install/action.yml#L25)), an explicit
`npm run build` before packing
([validated by @7c009d67](../../.github/actions/setup-node-install/action.yml#L27)), then runs the green
case and the `--expect-failure` case as separately named steps
([validated by @820e0c50](../../.github/workflows/ci.yml#L174),
[the red step @d4189ed5](../../.github/workflows/ci.yml#L176)).

The same job re-runs the three next-absence checks, unmodified:
`check-forbidden-imports.mjs`
([validated by @6912ce2b](../../.github/workflows/ci.yml#L178)), `018`'s manifest grep
with the `node_modules/next` probe
([validated by @d5df09f3](../../.github/workflows/ci.yml#L180)), and `032`'s
node_modules `find` - which issue 100 moved into
`scripts/scan-forbidden-node-modules.sh` so this job and `consumer-app.sh`
share one copy of the pattern rather than drifting
([validated by @4b255260](../../.github/workflows/ci.yml#L191)). One honest caveat,
recorded instead of dressed up: the `find` cannot run against the fixture's
own installed tree, which contains `next` by design - the `consumer` job
remains its executable home for the consumer tree, and here the identical
pattern runs against this job's repo install, proving the exemption stays
scoped to `examples/rsc-fixture` (running `consumer-app.sh` inside this job
was rejected: a second Chromium install for no additional signal). Each of
the three checks carries a pointer comment at its home naming the
exemption: `check-forbidden-imports.mjs`
([validated by @ddc5c01f](../../scripts/check-forbidden-imports.mjs#L11)), the
`next must be absent` step
([validated by @d4b120b2](../../.github/workflows/ci.yml#L126)), and the shared
node_modules scan
([validated by @1aebd935](../../scripts/scan-forbidden-node-modules.sh#L6)).

`publish.yml` runs `scripts/rsc-fixture.sh` in its credential-free `verify`
job, after `test:coverage` has built `dist/` and before the `publish` job
that `needs:` its green result may start, against the tarball packed from the
tagged commit - the same release-candidate gate `011` and `032` install
([validated by @820e0c50](../../.github/workflows/publish.yml#L107)). Green mode only:
the `--expect-failure` branch guards the repo's own `dist/` directives,
which CI already gated on the same commit, and a release run should not
spend a second `next build` re-proving the guard rather than the release.

`.lore/test-commands.yml` is untouched on purpose: the manifest is
hand-maintained in this repository and lists the test suites an external tool
runs, which the fixture's build check is not; the directory is
prettier-ignored because that tool reads it. The `rsc` command is instead
reachable the same way `consumer` is, as a `package.json` script
([validated by @62d083eb](../../package.json#L56)).

## Gates preserved

- `tsconfig.json` still excludes `examples/`
  ([validated by @a5a94ead](../../tsconfig.json#L17)).
- Coverage still scopes to `src/**` at the unchanged 100/100/100/100
  thresholds ([validated by @6a4e44f3](../../vitest.config.ts#L26)); vitest's
  `exclude` already covered `examples/**`
  ([validated by @a1299aae](../../vitest.config.ts#L12)).
- `npm pack --dry-run` ships `dist/`, `package.json`, `LICENSE`, `README.md`,
  `THIRD-PARTY-NOTICES.md` and nothing from `examples/`, executable-asserted on
  every consumer run ([validated by @9e840219](../../scripts/consumer-app.sh#L60)).
- Next's build artifacts cannot leak into the gates: `.next/`,
  `next-env.d.ts` and `tsconfig.tsbuildinfo` are git-ignored
  ([validated by @4ec227bf](../../.gitignore#L6), through
  [L8@1d8418e8](../../.gitignore#L8)), `.next/` and `next-env.d.ts` are also
  eslint-ignored ([validated by @4ec227bf](../../eslint.config.mjs#L356)), and the tar
  copy excludes them ([validated by @38be0807](../../scripts/pack-to-temp.sh#L25)).
- docs/design-notes.md decision 4's "not a dependency anywhere" bullet names
  the one exception in place, so the decision does not contradict the
  § RSC fixture section ([validated by @b0f53f72](../../docs/design-notes.md#L165)); that
  section names `examples/rsc-fixture` as the only path in the repo
  where `next` may appear ([validated by @cfdc3084](../../docs/design-notes.md#L1016)).
- Observation, not a test-linked statement (no test can assert a property of
  the PR's own diff): no file under the library's `src/` changed in this PR -
  the fixture's own `examples/rsc-fixture/src/` is the issue's named path for
  fixture data and is not the library's `src/`. Verify with
  `git diff --name-only origin/main...HEAD | grep '^src/'` returning nothing;
  the diff-reviewer confirmed it independently.
