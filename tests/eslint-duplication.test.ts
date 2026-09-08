import { lintFixtures, messagesFor, type LintResult } from "./helpers/eslint-fixtures.js";

// The duplication fixtures live outside src/ and are globally ignored, so
// `npm run lint` stays green. --no-ignore lifts the ignore, and each fixture
// glob is listed in the matching eslint.config.mjs `files` entry, so every
// fixture is judged by the exact committed rules - not a copy of them. The
// labels fixture is linted alongside as a regression guard: it must still fail
// with its Labels ruleId, proving the flat-config refactor that hoisted the
// Labels selectors into a shared const did not disable them.
const duplicationDir = "tests/fixtures/eslint-duplication";
const labelsDir = "tests/fixtures/eslint-labels";

const lint = (): LintResult[] =>
  lintFixtures([
    `${duplicationDir}/raw-svg/component.tsx`,
    `${duplicationDir}/focusable-literal/inline.ts`,
    `${duplicationDir}/duplicate-string/dupes.ts`,
    `${duplicationDir}/identical-functions/funcs.ts`,
    `${duplicationDir}/clean/clean.ts`,
    `${labelsDir}/jsx-text.tsx`,
  ]);

describe("the duplication lint guardrails", () => {
  let results: LintResult[];

  beforeAll(() => {
    results = lint();
  });

  it("a raw <svg> in a component fixture fails with the no-raw-svg message", () => {
    expect(messagesFor(results, "component.tsx")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-syntax",
        message: expect.stringContaining("Raw <svg>"),
      })
    );
  });

  it("an inline focusable-selector literal fails with the FOCUSABLE_SELECTOR message", () => {
    expect(messagesFor(results, "inline.ts")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-syntax",
        message: expect.stringContaining("FOCUSABLE_SELECTOR"),
      })
    );
  });

  it("a string duplicated three times fails with sonarjs/no-duplicate-string", () => {
    expect(messagesFor(results, "dupes.ts")).toContainEqual(
      expect.objectContaining({
        ruleId: "sonarjs/no-duplicate-string",
      })
    );
  });

  it("three identical functions fail with sonarjs/no-identical-functions", () => {
    expect(messagesFor(results, "funcs.ts")).toContainEqual(
      expect.objectContaining({
        ruleId: "sonarjs/no-identical-functions",
      })
    );
  });

  it("a clean fixture passes with no messages", () => {
    expect(messagesFor(results, "clean.ts")).toEqual([]);
  });

  it("the labels jsx-text fixture still fails with the hardcoded-JSX-text message", () => {
    expect(messagesFor(results, "jsx-text.tsx")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-syntax",
        message: expect.stringContaining("Hardcoded JSX text"),
      })
    );
  });
});
