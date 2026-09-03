import { spawnSync } from "node:child_process";
import { resolve, sep } from "node:path";

// The house-rule fixtures live outside src/ and are globally ignored, so
// `npm run lint` stays green. --no-ignore lifts the ignore, and each fixture
// glob is listed in the matching eslint.config.mjs `files` entry, so every
// fixture is judged by the exact committed rules - not a copy of them.
const fixtureDir = "tests/fixtures/eslint-house-rules";

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
      `${fixtureDir}/max-boolean-operators/violation.ts`,
      `${fixtureDir}/max-boolean-operators/violation-jsx.tsx`,
      `${fixtureDir}/no-catch-as-control-flow/violation.ts`,
      `${fixtureDir}/no-catch-as-control-flow/violation-property.ts`,
      `${fixtureDir}/no-network-egress/violation.ts`,
      `${fixtureDir}/no-prop-mutation/violation.tsx`,
      `${fixtureDir}/no-prop-mutation/violation-memo.tsx`,
      `${fixtureDir}/no-inline-styles/violation.tsx`,
      `${fixtureDir}/default-export/component.tsx`,
      `${fixtureDir}/house-style/violation.ts`,
      `${fixtureDir}/clean/clean.tsx`,
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

describe("the house-rule lint guardrails", () => {
  let results: LintResult[];

  beforeAll(() => {
    results = lint();
  });

  it("a condition chaining three boolean operators fails with bowman/max-boolean-operators", () => {
    expect(
      messagesFor(results, `max-boolean-operators${sep}violation.ts`).map((m) => m.ruleId)
    ).toContain("bowman/max-boolean-operators");
  });

  it("a JSX conditional render chaining four boolean operators fails with bowman/max-boolean-operators", () => {
    expect(
      messagesFor(results, `max-boolean-operators${sep}violation-jsx.tsx`).map((m) => m.ruleId)
    ).toContain("bowman/max-boolean-operators");
  });

  it("a catch that swallows the error and returns a call result fails with bowman/no-catch-as-control-flow", () => {
    expect(
      messagesFor(results, `no-catch-as-control-flow${sep}violation.ts`).map((m) => m.ruleId)
    ).toContain("bowman/no-catch-as-control-flow");
  });

  it("a catch whose parameter appears only as another object's property name fails with bowman/no-catch-as-control-flow", () => {
    expect(
      messagesFor(results, `no-catch-as-control-flow${sep}violation-property.ts`).map(
        (m) => m.ruleId
      )
    ).toContain("bowman/no-catch-as-control-flow");
  });

  it("mutating props inside a memo-wrapped anonymous component fails with bowman/no-prop-mutation", () => {
    expect(
      messagesFor(results, `no-prop-mutation${sep}violation-memo.tsx`).map((m) => m.ruleId)
    ).toContain("bowman/no-prop-mutation");
  });

  it("a braceless conditional return fails with curly and the padding rule", () => {
    const ruleIds = messagesFor(results, `house-style${sep}violation.ts`).map((m) => m.ruleId);

    expect(ruleIds).toContain("curly");
    expect(ruleIds).toContain("@stylistic/padding-line-between-statements");
  });

  it("a fetch call in component code fails with bowman/no-network-egress", () => {
    expect(
      messagesFor(results, `no-network-egress${sep}violation.ts`).map((m) => m.ruleId)
    ).toContain("bowman/no-network-egress");
  });

  it("pushing into an array received as props fails with bowman/no-prop-mutation", () => {
    expect(
      messagesFor(results, `no-prop-mutation${sep}violation.tsx`).map((m) => m.ruleId)
    ).toContain("bowman/no-prop-mutation");
  });

  it("a computed width in a style prop fails with bowman/no-inline-styles", () => {
    expect(
      messagesFor(results, `no-inline-styles${sep}violation.tsx`).map((m) => m.ruleId)
    ).toContain("bowman/no-inline-styles");
  });

  it("a default export in the component-overlay glob fails with the no-default-export message", () => {
    const messages = messagesFor(results, `default-export${sep}component.tsx`);

    expect(messages.some((m) => m.ruleId === "no-restricted-syntax")).toBe(true);
    expect(messages.some((m) => m.message.includes("Default export"))).toBe(true);
  });

  it("boundary shapes pass every house rule - a two-operator condition, a sentinel catch, a local (non-prop) mutation, and a custom-properties-only style object", () => {
    const flagged = messagesFor(results, `clean${sep}clean.tsx`).filter(
      (m) => m.ruleId?.startsWith("bowman/") || m.ruleId === "no-restricted-syntax"
    );

    expect(flagged).toEqual([]);
  });
});
