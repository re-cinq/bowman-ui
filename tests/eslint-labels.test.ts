import { spawnSync } from "node:child_process";
import { resolve, sep } from "node:path";

// The four red fixtures live outside src/ and are globally ignored, so
// `npm run lint` stays green. --no-ignore lifts the ignore, and the
// eslint.config.mjs labels entry lists the fixture glob in `files`, so each
// fixture is judged by the exact committed rules - not a copy of them.
const fixtureDir = "tests/fixtures/eslint-labels";

interface LintMessage {
  ruleId: string | null;
  message: string;
}

interface LintResult {
  filePath: string;
  messages: LintMessage[];
}

const lint = (): LintResult[] => {
  const result = spawnSync(
    "node",
    [
      resolve(process.cwd(), "node_modules/eslint/bin/eslint.js"),
      "--no-ignore",
      "--format",
      "json",
      `${fixtureDir}/jsx-text.tsx`,
      `${fixtureDir}/attribute-literal.tsx`,
      `${fixtureDir}/strings-prop.ts`,
      `${fixtureDir}/next-intl-import.tsx`,
    ],
    { cwd: process.cwd(), encoding: "utf8" }
  );
  expect(result.status).toBe(1);
  return JSON.parse(result.stdout) as LintResult[];
};

const messagesFor = (results: LintResult[], fixture: string): LintMessage[] => {
  const match = results.find((entry) => entry.filePath.endsWith(`${sep}${fixture}`));
  if (!match) {
    throw new Error(`eslint reported nothing for ${fixture}`);
  }
  return match.messages;
};

describe("the labels lint rules", () => {
  let results: LintResult[];

  beforeAll(() => {
    results = lint();
  });

  it("<span>Copied!</span> fails with the hardcoded-JSX-text message", () => {
    expect(messagesFor(results, "jsx-text.tsx")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-syntax",
        message: expect.stringContaining("Hardcoded JSX text"),
      })
    );
  });

  it('aria-label="Copy message" fails with the hardcoded-assistive-string message', () => {
    expect(messagesFor(results, "attribute-literal.tsx")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-syntax",
        message: expect.stringContaining("Hardcoded assistive string"),
      })
    );
  });

  it("a strings?: Record<string, string> prop fails with the labels-prop-name message", () => {
    expect(messagesFor(results, "strings-prop.ts")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-syntax",
        message: expect.stringContaining("labels?: Partial<XLabels>"),
      })
    );
  });

  it("importing next-intl fails with the no-i18n-runtime message", () => {
    expect(messagesFor(results, "next-intl-import.tsx")).toContainEqual(
      expect.objectContaining({
        ruleId: "no-restricted-imports",
        message: expect.stringContaining("no i18n runtime"),
      })
    );
  });
});
