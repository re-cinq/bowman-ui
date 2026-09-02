# DoD — Broken test links in spec.md (issue-7)

## Triage strategy: `direct`

A seam already exists in `tests/repoint-spec-anchors.test.ts` (synthetic repos built with
`makeRepo()`/`write()`/`git()` helpers). The script under test is
`scripts/repoint-spec-anchors.mjs`, and the live-repo reading pattern used across the test
suite enables a second test that scans actual spec files at runtime.

## Acceptance tests

### Test 1 — script extension (synthetic repo)

**File:** `tests/repoint-spec-anchors.test.ts` — last `it(...)` in the describe block.

**Name:** `repoints an anchor to a non-test .ts config file when the referenced line moves`

**What it asserts:** When a non-test `.ts` file (e.g. `vitest.config.ts`) is referenced by a
spec anchor and the anchored line moves in a new commit, the script repoints the anchor and
reports `repointed: 1`.

**Current failure:**
```
expected 'repointed: 0, up to date: 3, unresolv…' to contain 'repointed: 1'
```
The ANCHOR regex in `repoint-spec-anchors.mjs` only matches paths under `tests/` or
`examples/*/tests/` with a `.ts`/`.tsx` extension, so `vitest.config.ts` links are silently
ignored.

### Test 2 — live-repo invariant (existing files)

**File:** `tests/spec-links.test.ts` (new file)

**Name:** `non-test spec links do not land on a comment or blank line`

**What it asserts:** Every non-test-file spec anchor in `specs/*/spec.md` and
`.specify/spec.md` resolves to a non-blank, non-comment line. Blank lines are always rotten.
Comment lines are rotten in YAML workflow files (`.yml`/`.yaml`) and in repo-root config files
(`vitest.config.ts`, `eslint.config.mjs`, etc.) — but NOT in `scripts/`, `examples/`, `src/`,
or `tests/` files, where comment lines are legitimate citation targets.

**Current failure (15 broken links):**
```
specs/bowman-ui-composer-resize-browser/spec.md: ../../.github/workflows/ci.yml#L80 -> "# wraps..." is a comment or blank
specs/bowman-ui-composer-resize-browser/spec.md: ../../vitest.config.ts#L24 -> "// never again." is a comment or blank
specs/bowman-ui-consumer-app/spec.md: ../../examples/chat-demo/src/App.tsx#L63 -> "" is a comment or blank
specs/bowman-ui-consumer-app/spec.md: ../../.github/workflows/ci.yml#L86 -> "# Both probes..." is a comment or blank
specs/bowman-ui-consumer-app/spec.md: ../../.github/workflows/ci.yml#L94 -> "# Issue 82..." is a comment or blank
specs/bowman-ui-consumer-app/spec.md: ../../.github/workflows/ci.yml#L96 -> "# repo tree..." is a comment or blank
specs/bowman-ui-consumer-app/spec.md: ../../.github/workflows/publish.yml#L63 -> "# full chat screen..." is a comment or blank
specs/bowman-ui-consumer-app/spec.md: ../../vitest.config.ts#L24 -> "// never again." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../.github/workflows/ci.yml#L119 -> "# Issue 100..." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../.github/workflows/ci.yml#L122 -> "# asserts..." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../.github/workflows/ci.yml#L124 -> "# is stripped..." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../.github/workflows/ci.yml#L125 -> "# beside..." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../.github/workflows/publish.yml#L69 -> "# built from this tagged commit..." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../vitest.config.ts#L24 -> "// never again." is a comment or blank
specs/bowman-ui-rsc-fixture/spec.md: ../../eslint.config.mjs#L101 -> "// docs/design-notes.md § Labels..." is a comment or blank
```

## Facets covered

- ANCHOR regex in `repoint-spec-anchors.mjs` ignores non-`tests/`-dir `.ts` config files **[CLOSED — commit 4ca2076]**
- Existing spec anchors to `vitest.config.ts`, `.github/workflows/*.yml`, and `eslint.config.mjs` have drifted to comment or blank lines (15 broken links — Test 2 still red)

## Notes from round 1

- The ANCHOR regex alternative `[\w.-]+` matches only root-level filenames (no `/`), so `examples/*/src/*.tsx` paths are correctly excluded from the script's tracking scope.
- The `([regex](../../scripts/repoint-spec-anchors.mjs#L39))` link in `specs/bowman-ui-composer-resize-browser/spec.md` points to an import statement (L39), not the ANCHOR regex (L43) — pre-existing drift; do not fix in the next round.
- `specs/bowman-ui-rsc-fixture/spec.md` and `specs/bowman-ui-consumer-app/spec.md` each have "anchor caveat" notes that still say the script tracks only `tests/*.ts(x)` — these are stale and should be updated in the next round alongside fixing the broken anchors.
- `vitest.config.ts#L24` (= `"// never again."`) is processed but not flagged as rotten by the script (the script's `CONTENTLESS` only catches blank/closing-punctuation). Fixing it to point to `#L25` (`thresholds: {}`) is part of the next round.

## Out of scope

- Fixing the broken anchors themselves (production work — done during implementation)
- Extending `repoint-spec-anchors.mjs` to auto-repoint workflow/config anchors (production work)
- Anchors to files that don't exist on disk (the live-repo test skips these with `continue`)
