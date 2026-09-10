# Definition of Done

> The version named in decision 4, the version `package-lock.json` resolves,
> and the version `examples/chat-demo/package.json` pins are the same, and a
> test or CI step fails if they drift apart again.

**Strategy: `direct`** — the ticket asks for a permanent drift guard over three
committed artifacts (the decision record, the lockfile, the consumer demo pin),
so a `mechanical` edit alone would not satisfy "Done when". The seam already
exists and is the established repo convention: `tests/system-contract.test.ts`
already reads `package.json` and `package-lock.json` and asserts on them. The
new test reads the three artifacts through that same seam and asserts they name
one React version; it fails today because the lockfile resolves `19.2.8` while
decision 4 and the demo say `19.2.0`.

## Done when these pass

- [x] **the one tested React version > is the same in decision 4, the lockfile
  and the chat-demo pin** — extracts the version from `docs/design-notes.md`
  decision 4 ("React X.Y.Z is what CI installs"), reads the resolved
  react/react-dom versions from `package-lock.json`, and the react/react-dom
  pins from `examples/chat-demo/package.json`, and asserts all four equal the
  recorded version. Red now: lockfile `19.2.8` ≠ recorded/demo `19.2.0`.
  `tests/react-version-consistency.test.ts`

## Facts

- Red: the three artifacts disagree (`19.2.0` in decision 4 and the demo,
  `19.2.8` in the lockfile), so the test fails.
- Green (implementer's choice, per the ticket): either re-pin the lockfile to
  `19.2.0` (`npm install react@19.2.0 react-dom@19.2.0 --save-exact` scope), or
  amend decision 4's prose AND the demo pin to `19.2.8`. Any of these makes all
  four values equal.
- Refactor: none owed; the guard is a single equality assertion.

## Out of scope

- The `^19.0.0` peer range in `package.json` — decision 4 keeps it a testing
  claim, not a floor; this ticket is only about the ONE tested version's three
  records agreeing, not about widening or narrowing the peer range.
- The `@types/react*` versions (which already differ across manifests) — the
  ticket names react/react-dom, not the type packages.
- Deciding WHICH direction to reconcile in (re-pin vs amend); the test passes
  under either.
