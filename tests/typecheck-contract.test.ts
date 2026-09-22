import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { runScript } from "./helpers/script-runner.js";

// Issue 140: tests were never compiled by tsc - the root config includes src/
// only and vitest transpiles without checking. The second config closes that
// gap; the script must keep invoking both with the typescript7 binary.
const root = process.cwd();
const scripts = (
  JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  }
).scripts;

const testFilesOnDisk = (): string[] =>
  readdirSync(resolve(root, "tests"), { recursive: true, encoding: "utf8" })
    .filter((name) => /\.test\.tsx?$/.test(name))
    .map((name) => `tests/${name}`)
    .sort();

describe("the typecheck gate", () => {
  it("npm run typecheck compiles tsconfig.json and then tsconfig.tests.json with typescript7", () => {
    expect(scripts.typecheck).toEqual(
      "node node_modules/typescript7/bin/tsc --noEmit -p tsconfig.json && " +
        "node node_modules/typescript7/bin/tsc --noEmit -p tsconfig.tests.json"
    );
  });

  it("tsconfig.tests.json compiles every tests/**/*.test.ts(x) file on disk", () => {
    const result = runScript(
      "node_modules/typescript7/bin/tsc",
      ["-p", "tsconfig.tests.json", "--noEmit", "--listFiles"],
      { cwd: root }
    );
    const compiled = result.stdout
      .split("\n")
      .filter((line) => line.startsWith(`${root}/tests/`))
      .map((line) => line.slice(root.length + 1));

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(compiled.filter((name) => /\.test\.tsx?$/.test(name)).sort()).toEqual(testFilesOnDisk());
  });
});
