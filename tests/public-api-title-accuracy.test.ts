import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const fixture = JSON.parse(
  readFileSync(resolve(root, "tests/fixtures/public-api.json"), "utf8")
) as { values: string[]; types: string[] };

const source = readFileSync(resolve(root, "tests/public-api.test.ts"), "utf8");

describe("public-api.test.ts title accuracy", () => {
  it("the it() titles cite the actual fixture counts (not stale numbers)", () => {
    expect(source).toContain(`${fixture.values.length} committed names`);
    expect(source).toContain(`${fixture.types.length} committed names`);
  });
});
