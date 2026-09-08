# bowman-ui RSC fixture

Issue: issue 100 (the RSC fixture build docs/design-notes.md decision 1 calls
"078's RSC fixture build")

`examples/rsc-fixture` is the executable proof of the `"use client"`
boundary: a standalone Next.js App Router app that installs
`@re-cinq/bowman-ui` from a freshly packed tarball - never the source tree,
never the registry ([validated by](../../scripts/rsc-fixture.sh#L125)) - and
compiles it with `next build` under Turbopack. `018`'s directive check is
static and `032`'s Vite consumer does not share Next's server/client module
graph, so until this fixture nothing had ever compiled the package inside
the one consumer shape it is built for. The whole proof is one command,
`npm run rsc` ([validated by](../../package.json#L53)), documented in the
README's App Router consumer section ([validated by](../../README.md#L150)).

Anchor caveat (the consumer-app spec's precedent): `scripts/
repoint-spec-anchors.mjs` tracks `(../)+tests/*.ts(x)` anchors, anchors into
`scripts/`, `README.md` and `docs/` markdown since issue 32, and since issue
37 any repo-relative path carrying a file extension, so this spec's links
into `examples/`, workflow files, `package.json` and root config files are
repointed and rot-checked by CI along with the rest. Anchors into `ci.yml`
and `publish.yml` cite a line unique to the job they describe, because the
identical setup blocks those files repeat across jobs are a context tie the
resolver refuses to guess at.

## The fixture app

`examples/rsc-fixture/package.json` is `private: true`
([validated by](../../examples/rsc-fixture/package.json#L3)),
`"type": "module"`, and declares no `@re-cinq/bowman-ui` dependency at all -
the version under test is always the tarball `npm pack` just produced,
executable-asserted before every run
([validated by](../../scripts/rsc-fixture.sh#L54)). `react` and `react-dom`
are pinned at exactly `19.2.0`
([validated by](../../examples/rsc-fixture/package.json#L11)), the version
`018`'s record names as the only one CI installs. One caveat recorded rather
than papered over: Next substitutes its own vendored React build for parts
of the App Router render, so the pin is a claim about what the fixture
installs, not proof that stock `react@19.2.0` executed every server frame.

`next` is pinned at exactly `16.3.3`
([validated by](../../examples/rsc-fixture/package.json#L18)) - the latest
`16.x` on the registry at implementation time, with no `^`.
Turbopack is Next 16's default bundler and the fixture does not opt out: the
measured build banner reads `Next.js 16.3.3 (Turbopack)`, and the config
carries no `--webpack`-equivalent nor any bundler key
([validated by](../../examples/rsc-fixture/next.config.ts#L3)). `typescript` is
pinned at `7.0.2`, the same version `examples/chat-demo` pins; `next build`'s
own type-checking pass was measured running and finishing under it
("Running TypeScript ... Finished TypeScript"), so the native-port TS needed
no fallback to 5.x
([validated by](../../examples/rsc-fixture/package.json#L19)).

`next.config.ts` sets neither `transpilePackages` nor
`serverExternalPackages` - the config object is empty, so the fixture proves
what a default consumer gets
([validated by](../../examples/rsc-fixture/next.config.ts#L3)).

### The server pages

`app/layout.tsx` imports the package stylesheet from the bare specifier and
carries no `"use client"`
([validated by](../../examples/rsc-fixture/app/layout.tsx#L2)).
`app/page.tsx` value-imports `SendIcon`, `CopyIcon`, `CheckIcon` and
`IconWrapper` from `@re-cinq/bowman-ui` and renders all four
([validated by](../../examples/rsc-fixture/app/page.tsx#L2)), and renders
`023`'s `ChatMessage` - a `"use client"` file in `dist/` - as a child of the
server page, the legal direction of the boundary
([validated by](../../examples/rsc-fixture/app/page.tsx#L39)). Neither page
carries a directive, and no file above them does; the script asserts it
(`test -f` first, so a moved file cannot pass vacuously) over
`app/layout.tsx`, `app/page.tsx` and `src/fixtures.ts` on every run rather
than leaving it to a reviewer reading the diff
([validated by](../../scripts/rsc-fixture.sh#L60)).

`app/page.tsx` also contains
`import * as bowman from "@re-cinq/bowman-ui"` and renders
`Object.keys(bowman).length`
([validated by](../../examples/rsc-fixture/app/page.tsx#L1), the render at
[L32](../../examples/rsc-fixture/app/page.tsx#L32)), so no bundler can elide
the namespace; the script asserts the rendered count is present and at
least 40 (53 measured), which is what proves the whole barrel - `useDebounce`
included - sat in the server module graph at render time
([validated by](../../scripts/rsc-fixture.sh#L160)). Observation the issue
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
([validated by](../../examples/rsc-fixture/src/fixtures.ts#L1)).

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
([validated by](../../examples/rsc-fixture/app/compose/page.tsx#L1)); the
server-component version is this PR's build history, not its tree. The
design-notes rule lists every export with a function-valued prop, derived
mechanically with
`grep -rlE '^ +[A-Za-z"-]+\??: [^;]*=>' dist/components/*.d.ts`
(re-run it against a fresh build to audit the list): `AppShell`,
`AppSidebar`, `ChatComposer`, `ChatMessage`, `ChatMessageList`,
`ConversationList`, `ErrorBoundary`, `Toast`
([validated by](../../docs/design-notes.md#L465)), and the same sentence appears in
the README ([validated by](../../README.md#L160)). `app/client/page.tsx` is
the control: the same composition under `"use client"`, building green, so
the rejection is attributable to the boundary and not to the components
([validated by](../../examples/rsc-fixture/app/client/page.tsx#L1)). The two
pages differ in content - the compose page renders `AppSidebar`
([validated by](../../examples/rsc-fixture/app/compose/page.tsx#L9)) where the
control renders a bare `nav`
([validated by](../../examples/rsc-fixture/app/client/page.tsx#L9)) - so
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
refusal and its reason ([validated by](../../docs/design-notes.md#L445)).

## The script

`scripts/rsc-fixture.sh` is `chmod +x`, opens `#!/usr/bin/env bash` with
`set -euo pipefail` ([validated by](../../scripts/rsc-fixture.sh#L1)), and:

- builds and packs via the shared preamble (below), copies
  `examples/rsc-fixture/` to a `mktemp -d`, asserts the install directory is
  not inside the repo working tree and exits non-zero naming both paths if
  it is - `011`/`032`'s identical criterion
  ([validated by](../../scripts/pack-to-temp.sh#L15))
- installs the `.tgz` by file path and never runs a registry install of
  `@re-cinq/bowman-ui` - the only `npm install` lines are the fixture's own
  devDependencies and the tarball path
  ([validated by](../../scripts/rsc-fixture.sh#L125))
- runs `next build`, then `next start` on port 4319 with the server's PID
  killed in the cleanup trap so an assertion failure between start and kill
  still tears it down ([validated by](../../scripts/rsc-fixture.sh#L133))
- asserts with a bounded thirty-second poll that a plain HTTP request for
  `/` returns a body whose bytes contain `<svg` - and, so Next's own markup
  cannot satisfy the check, the library-specific `viewBox="0 0 24 24"` and
  `stroke="currentColor"` - on the response body, never a hydrated DOM
  ([validated by](../../scripts/rsc-fixture.sh#L156))
- takes `--keep`, which retains and prints the temp directory (server and
  build logs included), the mutation directory and the tarball
  ([validated by](../../scripts/rsc-fixture.sh#L8)), and removes all of them
  on exit otherwise, including on failure
  ([validated by](../../scripts/rsc-fixture.sh#L26)).

### `--expect-failure`

The guard is proven red by mutating the packed tarball in an unpacked copy,
reinstalling, and requiring `next build` to fail
([validated by](../../scripts/rsc-fixture.sh#L86)). The issue named
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
([validated by](../../scripts/rsc-fixture.sh#L105)). On the expected failure
it asserts the output carries `useState` and `prerendering page "/"`
([validated by](../../scripts/rsc-fixture.sh#L111)): Next's production
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
`copy_example_to_temp` ([validated by](../../scripts/pack-to-temp.sh#L3)),
sourced and called by both `scripts/consumer-app.sh`
([validated by](../../scripts/consumer-app.sh#L48)) and
`scripts/rsc-fixture.sh`
([validated by](../../scripts/rsc-fixture.sh#L73)). Functions rather than a
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
([validated by](../../.github/workflows/ci.yml#L152)) - the issue text
named the older `v6`/`v4` SHAs from before this repo moved to `v7` pins;
the existing file's style wins and the deviation is recorded here - sets
`node-version: "22"` ([validated by](../../.github/workflows/ci.yml#L152)),
runs `npm ci --ignore-scripts`
([validated by](../../.github/workflows/ci.yml#L162)) and an explicit
`npm run build` before packing
([validated by](../../.github/workflows/ci.yml#L164)), then runs the green
case and the `--expect-failure` case as separately named steps
([validated by](../../.github/workflows/ci.yml#L166),
[the red step](../../.github/workflows/ci.yml#L168)).

The same job re-runs the three next-absence checks, unmodified:
`check-forbidden-imports.mjs`
([validated by](../../.github/workflows/ci.yml#L170)), `018`'s manifest grep
with the `node_modules/next` probe
([validated by](../../.github/workflows/ci.yml#L172)), and `032`'s
node_modules `find` - which issue 100 moved into
`scripts/scan-forbidden-node-modules.sh` so this job and `consumer-app.sh`
share one copy of the pattern rather than drifting
([validated by](../../.github/workflows/ci.yml#L180)). One honest caveat,
recorded instead of dressed up: the `find` cannot run against the fixture's
own installed tree, which contains `next` by design - the `consumer` job
remains its executable home for the consumer tree, and here the identical
pattern runs against this job's repo install, proving the exemption stays
scoped to `examples/rsc-fixture` (running `consumer-app.sh` inside this job
was rejected: a second Chromium install for no additional signal). Each of
the three checks carries a pointer comment at its home naming the
exemption: `check-forbidden-imports.mjs`
([validated by](../../scripts/check-forbidden-imports.mjs#L11)), the
`next must be absent` step
([validated by](../../.github/workflows/ci.yml#L115)), and the shared
node_modules scan
([validated by](../../scripts/scan-forbidden-node-modules.sh#L6)).

`publish.yml` runs `scripts/rsc-fixture.sh` after the Build step and before
`npm publish`, against the tarball packed from the tagged commit - the same
release-candidate gate `011` and `032` install
([validated by](../../.github/workflows/publish.yml#L139)). Green mode only:
the `--expect-failure` branch guards the repo's own `dist/` directives,
which CI already gated on the same commit, and a release run should not
spend a second `next build` re-proving the guard rather than the release.

`.lore/test-commands.yml` is untouched on purpose: it is generated by the
Lore onboarding tool and issue 189 owns its contents. The `rsc` command is
instead reachable the same way `consumer` is, as a `package.json` script
([validated by](../../package.json#L53)).

## Gates preserved

- `tsconfig.json` still excludes `examples/`
  ([validated by](../../tsconfig.json#L17)).
- Coverage still scopes to `src/**` at the unchanged 100/100/100/90
  thresholds ([validated by](../../vitest.config.ts#L25)); vitest's
  `exclude` already covered `examples/**`
  ([validated by](../../vitest.config.ts#L12)).
- `npm pack --dry-run` ships `dist/`, `package.json`, `LICENSE`, `README.md`
  and nothing from `examples/`, executable-asserted on every consumer run
  ([validated by](../../scripts/consumer-app.sh#L60)).
- Next's build artifacts cannot leak into the gates: `.next/`,
  `next-env.d.ts` and `tsconfig.tsbuildinfo` are git-ignored
  ([validated by](../../.gitignore#L6), through
  [L8](../../.gitignore#L8)), `.next/` and `next-env.d.ts` are also
  eslint-ignored ([validated by](../../eslint.config.mjs#L332)), and the tar
  copy excludes them ([validated by](../../scripts/pack-to-temp.sh#L25)).
- docs/design-notes.md decision 4's "not a dependency anywhere" bullet names
  the one exception in place, so the decision does not contradict the
  § RSC fixture section ([validated by](../../docs/design-notes.md#L156)); that
  section names `examples/rsc-fixture` as the only path in the repo
  where `next` may appear ([validated by](../../docs/design-notes.md#L435)).
- Observation, not a test-linked statement (no test can assert a property of
  the PR's own diff): no file under the library's `src/` changed in this PR -
  the fixture's own `examples/rsc-fixture/src/` is the issue's named path for
  fixture data and is not the library's `src/`. Verify with
  `git diff --name-only origin/main...HEAD | grep '^src/'` returning nothing;
  the diff-reviewer confirmed it independently.
