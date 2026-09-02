# Definition of Done
Strategy: direct
Why: Both the file under test (`tests/public-api.test.ts`) and the ground-truth fixture (`tests/fixtures/public-api.json`) are plain readable files — the acceptance test reads both and asserts the embedded count strings match the actual fixture lengths.
Acceptance tests:
  - tests/public-api-title-accuracy.test.ts::"public-api.test.ts title accuracy > the it() titles cite the actual fixture counts (not stale numbers)" — asserts the `it()` strings in public-api.test.ts contain the real fixture counts (57 values, 45 types) rather than the stale 53/41
Facets (the red-green-refactor steps you expect, smallest first):
  - Update "53 committed names" → "57 committed names" on line 40 of tests/public-api.test.ts
  - Update "41 committed names" → "45 committed names" on line 46 of tests/public-api.test.ts
Out of scope: changing the fixture itself, updating any other export counts, or regenerating public-api.json
