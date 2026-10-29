# bowman-ui build-chain audit

| Field  | Value                 |
| ------ | --------------------- |
| Issue  | re-cinq/bowman-ui#286 |
| Status | Shipped               |

Nothing failed a build when an advisory landed in what `npm ci` installs, so a vulnerable package could sit in the tree that builds and signs `dist/` until someone ran `npm audit` by hand. The `build-chain` job in `.github/workflows/ci.yml` now audits that tree on every pull request, every push to `main` and once a week. `.github/workflows/publish.yml` runs the same two checks before anything is staged on npm.

## The job

- The `build-chain` job runs on every pull request, every push to `main` and every Monday at 07:00 UTC, on a schedule committed in the workflow, so an advisory published after a merge turns the next run red without waiting for a pull request ([validated by runs the build-chain job on pull requests, pushes to main and every Monday at 07:00 UTC](../../tests/build-chain.test.ts#L35)).
- It holds a read-only token (`permissions: contents: read`) and checks out with `persist-credentials: false` ([validated by gives the build-chain job a read-only token and a checkout that keeps no credentials](../../tests/build-chain.test.ts#L49)).
- It installs with `npm ci --ignore-scripts` through the shared setup action and builds nothing. It then runs `npm run check:audit`, then `npm run check:action-pins` ([validated by installs with npm ci --ignore-scripts, builds nothing, then runs the audit and the action pins](../../tests/build-chain.test.ts#L59)).

## The audit

- `scripts/check-audit.mjs` runs `npm audit --json` with no other argument, so the report covers the whole tree, dev included. No workflow, action or script narrows it with `omit=dev` ([validated by asks npm for the whole tree, dev included: npm audit --json and no other argument](../../tests/check-audit.test.ts#L80), [validated by never narrows the audit to production dependencies: no workflow, action or script says omit=dev](../../tests/build-chain.test.ts#L129)).
- It exits 1 on any advisory at `high` or `critical` that no acknowledgement covers. For each blocking finding it prints one line: the severity, package, installed version, affected range, GHSA id and title, and either "a direct dependency" or the package it is reached through ([validated by exits 1 on an unacknowledged critical advisory, naming its severity, package, installed version, range, GHSA id and a direct dependency](../../tests/check-audit.test.ts#L88), [validated by names the package a transitive finding is reached through, and fabricates no advisory when two packages reach each other](../../tests/check-audit.test.ts#L105)).
- Each pair of package and advisory is one finding. An advisory reached twice counts once, and two advisories on one package stay apart even when neither carries a GHSA url ([validated by reports an advisory reached twice through via once, not twice](../../tests/check-audit.test.ts#L249), [validated by keeps two advisories on one package apart when neither carries a GHSA url](../../tests/check-audit.test.ts#L269)).
- A report npm could not produce fails the run rather than reading as clean. That covers npm's registry-failure document, output that is not JSON, and a report with counts but no vulnerabilities map ([validated by refuses to report clean on npm's registry-failure document](../../tests/check-audit.test.ts#L225), [validated by refuses to report clean when npm prints no JSON at all](../../tests/check-audit.test.ts#L234), [validated by refuses a report carrying metadata counts but no vulnerabilities map](../../tests/check-audit.test.ts#L241)).
- It exits 0 when nothing at `high` or above is left unacknowledged ([validated by exits 0 on a clean report with no acknowledgements file](../../tests/check-audit.test.ts#L210)).

## Acknowledgements

- An acknowledgement lives in `.github/audit-acknowledgements.json` and carries `advisory`, `package`, `why`, `expires` (an ISO date) and `acknowledged_by`. It covers that one advisory in that one package and nothing else ([validated by exits 0 when an acknowledgement names that advisory in that package](../../tests/check-audit.test.ts#L143), [validated by still exits 1 on a second unacknowledged advisory in an otherwise acknowledged package](../../tests/check-audit.test.ts#L167)).
- No acknowledgement is open-ended (NIS-2 Art. 21). One that has expired, lacks one of its five fields or matches no current advisory fails the run as well ([validated by exits 1 on an acknowledgement whose expiry has passed, naming it by advisory and package](../../tests/check-audit.test.ts#L183), [validated by exits 1 on an acknowledgement missing one of its five fields](../../tests/check-audit.test.ts#L196), [validated by lets an acknowledgement cover no other advisory in its package, and reports it as stale](../../tests/check-audit.test.ts#L154)).
- The file is committed as `[]`, because the tree was clean at `high` and above when this merged ([validated by commits the acknowledgements as an array whose every entry carries the five fields and an ISO expiry](../../tests/build-chain.test.ts#L112)).

## Action pins

- `scripts/check-action-pins.mjs` exits 0 against every committed workflow and composite action under `.github/` ([validated by exits 0 against every committed workflow and composite action under .github/](../../tests/check-action-pins.test.ts#L13)).
- It exits 1 on a reference pinned to anything but a 40-hex commit SHA, naming the file, the line and the reference ([validated by exits 1 on a reference pinned to a tag, naming the file, the line and the reference](../../tests/check-action-pins.test.ts#L25)).
- It parses the YAML rather than grepping lines, so it catches a tag written in flow style and a tag inside a composite action. It skips the `./` and `docker://` references a SHA cannot pin ([validated by exits 1 on a tag written in YAML flow style, which no line grep reads](../../tests/check-action-pins.test.ts#L34), [validated by exits 1 on a tag inside a composite action that a workflows-only scan would pass](../../tests/check-action-pins.test.ts#L43), [validated by accepts a 40-hex commit SHA and skips the local ./ and docker:// references it cannot pin](../../tests/check-action-pins.test.ts#L21)).

## Before a publish

- `.github/workflows/publish.yml` runs `npm run check:build-chain` as the last step of `verify`, and the publish job needs `verify`. So an advisory published after the release commit merged still blocks the release ([validated by runs both checks last in publish.yml's verify job, which the publish job needs before it stages anything](../../tests/build-chain.test.ts#L77)).
- The release guards are unchanged: the tag gate still refuses a prerelease, and the version is still staged with `--provenance` ([validated by keeps the release guards: the stable-version tag check and a staged publish with --provenance](../../tests/build-chain.test.ts#L87)).
- The `check:build-chain` script in `package.json` runs `check:audit` and then `check:action-pins` ([validated by chains both checks behind one package.json script, check:build-chain](../../tests/build-chain.test.ts#L96)).

## Installing and updating

- `npm ci` needs neither `--legacy-peer-deps` nor `--force`, and no workflow, action, script or `.npmrc` passes either flag ([validated by installs without --legacy-peer-deps or --force anywhere in .github/, scripts/ or .npmrc](../../tests/build-chain.test.ts#L133)).
- `README.md` states the one supported install: `npm install @re-cinq/bowman-ui` from the registry, with neither flag ([validated by states the one supported install in README.md: npm install from the registry, with neither flag](../../tests/build-chain.test.ts#L192)).
- `.github/dependabot.yml` already matched what this audit relies on and is unchanged. It updates npm and actions weekly and groups only dev minors and patches, so majors and the two runtime dependencies arrive one per pull request, each of which runs the `build-chain` job ([validated by updates npm and actions weekly, grouping only dev minors and patches, so majors and runtime dependencies arrive one per PR](../../tests/build-chain.test.ts#L137)).

## Rationale

- **The two scripts are HAL Engine's, byte for byte.** `scripts/check-audit.mjs` and `scripts/check-action-pins.mjs` come from re-cinq/HALEngine@89285c155749, unmodified apart from one header line naming the source. No shared CI package exists, so the duplication is deliberate. The issue called the pin check `check-action-pins.sh`, but HAL's is `check-action-pins.mjs`, and that is the one copied. It runs on Bowman's own `scripts/lib/repo-root.mjs`, which was already identical to HAL's, and it imports `yaml`, now a direct devDependency ([validated by keeps both scripts byte-identical to HAL Engine's at 89285c155749 below the one header line naming it](../../tests/build-chain.test.ts#L168)).
- **ESLint and Prettier skip the two copies.** This repository's double quotes and `curly: all` would rewrite them, and the identity is what keeps them reviewable against their source.
- **The weekly schedule runs all of CI, not the audit alone.** HAL gates its other jobs off the schedule. Here the same `if:` line pushes the consumer and rsc jobs' shared opening over jscpd's 50-token floor. This repository fixes a duplicate by extracting a helper, never by raising the threshold, and Actions has no helper for a job's opening keys. On a public repository the weekly run costs nothing, and it doubles as a check against runner-image drift ([validated by runs every ci.yml job on the weekly schedule too, none gated off it](../../tests/build-chain.test.ts#L198)).
- **The issue's premise had moved.** It says `dependencies` is empty, but `dependencies` holds `react-markdown` and `remark-gfm`, which reach every consumer. The full-tree audit covers them along with the build toolchain.

## Known limitations

- A transitive finding cannot always name its direct dependency, though the issue asks for one on every blocking line. npm's report names a package's dependents only when they are vulnerable too, so on this tree every finding read "reached through an undisclosed path", as the first run below shows. Naming the root dependency means changing HAL's copy first, since it owns the script ([validated by says reached through an undisclosed path when npm names no dependent for a transitive finding](../../tests/check-audit.test.ts#L291)).

## Context: the recorded runs (2026-10-29)

Both red branches ran against the real tree of `main` at ec87db4, before its five high advisories were cleared. The green run is this change.

An unacknowledged advisory, with no acknowledgements file, exits 1:

```text
check-audit: high: brace-expansion 5.0.9 installed, affected 4.0.0 - 5.0.11 — GHSA-q2hr-2g5m-vwhr brace-expansion: Quadratic-time expansion of the `{a},b}` rewrite causes CPU denial of service, reached through an undisclosed path
check-audit: high: brace-expansion 5.0.9 installed, affected 4.0.0 - 5.0.11 — GHSA-qhr7-859c-m2p7 brace-expansion: DoS via uncontrolled recursion on nested brace groups causing stack exhaustion, reached through an undisclosed path
check-audit: high: brace-expansion 5.0.9 installed, affected 4.0.0 - 5.0.11 — GHSA-6j4f-fj2g-mc7p brace-expansion: DoS via uncontrolled recursion in parseCommaParts causing stack exhaustion, reached through an undisclosed path
check-audit: high: source-map-js 1.2.1 installed, affected 1.0.0 - 1.2.1 — GHSA-68fv-2mgg-jv7q source-map-js allows event-loop denial of service through indexed source-map section offsets, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-4qv8-2p9j-2685 undici vulnerable to Denial of Service via unbounded memory in the EventSource parser, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-f72v-6w45-q472 undici vulnerable to Subresource Integrity bypass via non-lowercase algorithm tokens, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-xjj6-f33q-929c undici vulnerable to Denial of Service via unhandled error on excessive content-encodings, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-4w7w-5xrc-9h26 undici vulnerable to cache poisoning and cross-user disclosure via cross-origin redirects, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-2m5v-pch6-74hx undici vulnerable to TLS certificate validation bypass via dropped tls options in Agent, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-qrxm-fqhp-jwvm undici vulnerable to Denial of Service via TLS 1.2 certificate-changing renegotiation, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-9fm3-97px-rjf6 undici WebSocket client vulnerable to Denial of Service via unbounded automatic PONG buffering, reached through an undisclosed path
check-audit: high: undici 8.10.2 installed, affected 8.0.0 - 8.12.1 — GHSA-55wc-3pg8-jfw6 undici vulnerable to Denial of Service via unhandled exception in the decompress interceptor, reached through an undisclosed path
check-audit: high: vite 8.3.0 installed, affected 8.3.0 - 8.3.2 — GHSA-698v-4r3x-3vcv launch-editor: escapeCmdArgs() omits % escaping on Windows, reached through an undisclosed path
check-audit: high: vite 8.3.0 installed, affected 8.3.0 - 8.3.2 — GHSA-r825-w8mm-5pxw launch-editor: Editor CLI flag misinterpretation causing arbitrary command execution for some editors, reached through an undisclosed path
check-audit: high: vite 8.3.0 installed, affected 8.3.0 - 8.3.2 — GHSA-587h-7wmj-h5pm launch-editor: `fs.existsSync()` existence check can be bypassed on Windows, reached through an undisclosed path
check-audit: high: vite 8.3.0 installed, affected 8.3.0 - 8.3.2 — GHSA-9jrq-w75r-8gcw Vite: Cross origin script execution through Vite custom middleware, reached through an undisclosed path
check-audit: high: vite 8.3.0 installed, affected 8.3.0 - 8.3.2 — GHSA-rq7h-c2jc-7f22 Vite: Files outside `server.fs.allow` could be served when project paths match system paths on non-Windows machine, reached through an undisclosed path
check-audit: high: vite 8.3.0 installed, affected 8.3.0 - 8.3.2 — GHSA-vfpm-58rq-9qcg Vite: First 4 bytes of files outside of `server.fs` setting is exposed by `?vite-wasm-instance`, reached through an undisclosed path
check-audit: high: zod 4.4.3 installed, affected <4.6.6 — GHSA-mrhx-c7xc-m3w5 Zod can exhaust memory while validating oversized constrained collections, reached through an undisclosed path

check-audit: 19 finding(s).
Fix with `npm audit fix`, or record an acceptance in .github/audit-acknowledgements.json.
```

An expired acknowledgement exits 1 as well. In this run all 19 pairs were acknowledged until 2099-12-31 except the zod advisory, which expired on 2026-10-28:

```text
check-audit: acceptance for GHSA-mrhx-c7xc-m3w5 in "zod" expired 2026-10-28 — recheck it or renew it
check-audit: high: zod 4.4.3 installed, affected <4.6.6 — GHSA-mrhx-c7xc-m3w5 Zod can exhaust memory while validating oversized constrained collections, reached through an undisclosed path

check-audit: 2 finding(s).
Fix with `npm audit fix`, or record an acceptance in .github/audit-acknowledgements.json.
```

This change, with the advisories cleared by #394 and no acknowledgements, exits 0:

```text
check-audit: clean at high and above (3 moderate, 3 low), 0 acceptance(s).
check-action-pins: every uses: reference is SHA-pinned.
```
