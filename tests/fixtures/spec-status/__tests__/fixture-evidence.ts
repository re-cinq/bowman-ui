it("the one statement each partial-coverage fixture links", () => {
  expect(true).toBe(true);
});

// The test evidence the spec-status fixtures link to, kept FIRST in the file so
// the #L1 they cite cannot drift when this comment is edited.
//
// It lives inside the fixture tree on purpose:
// re-lint/require-status-matches-coverage counts a ([validated by](...#Lnn))
// link only when its target file resolves and its line lands inside an
// it()/test() declaration, and scripts/lib/spec-corpus.mjs walks specs/,
// .specify/ and adrs/ only - so `npm run reanchor` never heals a link from this
// tree. Pointing these fixtures at a real test's line number made them hostage
// to that file's line numbering; pointing them here keeps each fixture's
// coverage tier under the fixture's own control.
//
// It sits in __tests__/ and is never named *.test.ts: the vendored spec
// test-path patterns count a __tests__/ segment as a test file, while vitest's
// default include matches on the filename alone, so it is recognised as
// evidence without being collected and run.
