import { sep } from "node:path";
import { lintFixtures, messagesFor, type LintResult } from "./helpers/eslint-fixtures.js";

// The house-rule fixtures live outside src/ and are globally ignored, so
// `npm run lint` stays green. --no-ignore lifts the ignore, and each fixture
// glob is listed in the matching eslint.config.mjs `files` entry, so every
// fixture is judged by the exact committed rules - not a copy of them.
const fixtureDir = "tests/fixtures/eslint-house-rules";
const houseRuleIds = new Set(["no-restricted-syntax", "re-lint/no-inline-styles"]);

const lint = (): LintResult[] =>
  lintFixtures([
    `${fixtureDir}/max-boolean-operators/violation.ts`,
    `${fixtureDir}/max-boolean-operators/violation-jsx.tsx`,
    `${fixtureDir}/no-catch-as-control-flow/violation.ts`,
    `${fixtureDir}/no-catch-as-control-flow/violation-property.ts`,
    `${fixtureDir}/no-network-egress/violation.ts`,
    `${fixtureDir}/no-network-egress/violation-channels.ts`,
    `${fixtureDir}/no-prop-mutation/violation.tsx`,
    `${fixtureDir}/no-prop-mutation/violation-memo.tsx`,
    `${fixtureDir}/no-prop-mutation/violation-shapes.tsx`,
    `${fixtureDir}/no-inline-styles/violation.tsx`,
    `${fixtureDir}/default-export/component.tsx`,
    `${fixtureDir}/house-style/violation.ts`,
    `${fixtureDir}/clean/clean.tsx`,
  ]);

// ESLint's JSON output carries the interpolated message, not the report data,
// so the api/name a rule reported for a line is pinned through the quoted text.
const reported = (line: number, quoted: string) => ({
  line,
  message: expect.stringContaining(quoted) as string,
});

describe("the house-rule lint guardrails", () => {
  let results: LintResult[];

  beforeAll(() => {
    results = lint();
  });

  const reportedBy = (fixture: string, ruleId: string) =>
    messagesFor(results, fixture)
      .filter((m) => m.ruleId === ruleId)
      .map((m) => ({ line: m.line, message: m.message }));

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

  it("every egress channel is reported with its api - fetch via window/globalThis/self and optional chaining, the three constructors bare and via a global host, sendBeacon on navigator bare and via a global host, and each computed string or template spelling - while a substitution template, private names, non-global hosts and other constructors are not", () => {
    expect(
      reportedBy(`no-network-egress${sep}violation-channels.ts`, "bowman/no-network-egress")
    ).toEqual([
      reported(7, "'fetch'"),
      reported(8, "'fetch'"),
      reported(9, "'fetch'"),
      reported(10, "'fetch'"),
      reported(11, "'fetch'"),
      reported(12, "'new WebSocket'"),
      reported(13, "'new EventSource'"),
      reported(14, "'new XMLHttpRequest'"),
      reported(15, "'new window.WebSocket'"),
      reported(16, "'new globalThis.EventSource'"),
      reported(17, "'new self.XMLHttpRequest'"),
      reported(18, "'navigator.sendBeacon'"),
      reported(19, "'navigator.sendBeacon'"),
      reported(20, "'navigator.sendBeacon'"),
      reported(21, "'navigator.sendBeacon'"),
      reported(22, "'fetch'"),
      reported(23, "'new window.WebSocket'"),
      reported(24, "'navigator.sendBeacon'"),
      reported(25, "'navigator.sendBeacon'"),
      reported(26, "'fetch'"),
      reported(27, "'navigator.sendBeacon'"),
      reported(28, "'fetch'"),
    ]);
  });

  it("pushing into an array received as props fails with bowman/no-prop-mutation", () => {
    expect(
      messagesFor(results, `no-prop-mutation${sep}violation.tsx`).map((m) => m.ruleId)
    ).toContain("bowman/no-prop-mutation");
  });

  it("every mutation shape is reported with the mutated expression - assignment, update, delete, nested member, mutating method, computed root, optional call, destructured prop, React.memo, React.forwardRef and forwardRef wrappers, a function declaration, a named function expression, computed string mutator, wrapper and chained callees, and a computed template callee - while a substitution-template callee, private names, a lowercase function, a non-mutating method and a second parameter are not", () => {
    expect(
      reportedBy(`no-prop-mutation${sep}violation-shapes.tsx`, "bowman/no-prop-mutation")
    ).toEqual([
      reported(11, "('props.count')"),
      reported(17, "('props.count')"),
      reported(23, "('props.count')"),
      reported(29, "('props.nested.depth')"),
      reported(35, "('props.tags')"),
      reported(41, "('props[\"counts\"]')"),
      reported(47, "('props.counts')"),
      reported(53, "('counts')"),
      reported(59, "('props.counts')"),
      reported(65, "('props.counts')"),
      reported(71, "('props.counts')"),
      reported(77, "('props.count')"),
      reported(83, "('props.count')"),
      reported(89, "('props.counts')"),
      reported(95, "('props.counts')"),
      reported(101, "('props[\"counts\"]')"),
      reported(107, "('props.counts')"),
    ]);
  });

  it("a computed width in a style prop fails with re-lint/no-inline-styles", () => {
    expect(
      messagesFor(results, `no-inline-styles${sep}violation.tsx`).map((m) => m.ruleId)
    ).toContain("re-lint/no-inline-styles");
  });

  it("a default export in the component-overlay glob fails with the no-default-export message", () => {
    const messages = messagesFor(results, `default-export${sep}component.tsx`);

    expect(messages.some((m) => m.ruleId === "no-restricted-syntax")).toBe(true);
    expect(messages.some((m) => m.message.includes("Default export"))).toBe(true);
  });

  it("boundary shapes pass every house rule - a two-operator condition, a sentinel catch, a local (non-prop) mutation, and a custom-properties-only style object", () => {
    const flagged = messagesFor(results, `clean${sep}clean.tsx`).filter(
      (m) => m.ruleId?.startsWith("bowman/") || houseRuleIds.has(m.ruleId ?? "")
    );

    expect(flagged).toEqual([]);
  });
});
