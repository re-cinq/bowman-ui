The `it()` titles in `tests/public-api.test.ts` (lines 40 and 46) said "53 committed names" and "41 committed names" after the fixture had already grown to 57 runtime values and 45 type exports. The fixture itself was correct and the assertions were passing; only the prose embedded in the test description strings was wrong. CLAUDE.md called this out explicitly as a known inconsistency ("Heads-up: that test's own `it()` titles still say '53'/'41' — stale text; the enforced fixture holds 57/45").

The change is two string edits: `53` → `57` on line 40 and `41` → `45` on line 46. No fixture, no logic, no export surface was touched.

To make this kind of drift impossible to re-introduce silently, a new acceptance test was added first (`tests/public-api-title-accuracy.test.ts`). It reads the fixture at runtime, counts its entries, and asserts that those exact counts appear verbatim in the `public-api.test.ts` source. The fixture is the ground truth; the titles must agree with it. The test was written red against the old titles, then the titles were updated to make it green.

The acceptance test the DoD names is:
`tests/public-api-title-accuracy.test.ts` → "the it() titles cite the actual fixture counts (not stale numbers)"

The invariant being enforced is documented in CLAUDE.md under invariant 3 (Closed public API). The fixture lives at `tests/fixtures/public-api.json` and is the authoritative count; the test at `tests/public-api.test.ts` guards it.

No spec `| Status |` row required updating — there is no feature spec for this maintenance fix. The `([validated by](../../tests/public-api.test.ts#L47))` anchor in `specs/bowman-ui-entry-attribution/spec.md` still resolves correctly: line 47 is the type-exports assertion, unchanged by this branch.

Full suite: 818 tests across 51 files, all green. Coverage holds at 100% statements/functions/lines and 99.73% branches (above the 90% branch floor).
