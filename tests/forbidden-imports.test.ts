import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve(process.cwd(), "scripts/check-forbidden-imports.mjs");

const runAgainst = (targetDir?: string) =>
  spawnSync("node", targetDir === undefined ? [script] : [script, targetDir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

it("exits non-zero when a specifier is not declared in package.json", () => {
  const result = runAgainst("tests/fixtures/forbidden-imports");

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("red.tsx");
  expect(result.stderr).toContain('"swr"');
  expect(result.stderr).toContain("not declared in package.json");
});

it("exits non-zero on a devDependency such as typescript", () => {
  const result = runAgainst("tests/fixtures/forbidden-imports");

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('"typescript"');
});

it("exits non-zero on the @/ path alias and undeclared scoped packages", () => {
  const result = runAgainst("tests/fixtures/forbidden-imports");

  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('"@/components/anything"');
  expect(result.stderr).toContain('"@clerk/nextjs"');
  expect(result.stderr).toContain('"next/navigation"');
});

it("exits zero for declared packages, their subpaths, and relative imports", () => {
  const result = runAgainst("tests/fixtures/forbidden-imports-clean");

  expect(result).toMatchObject({ status: 0, stderr: "" });
  expect(result.stdout).toContain("tests/fixtures/forbidden-imports-clean is clean");
});

it("exits zero against src/ and reports the self-test passed", () => {
  const result = runAgainst();

  expect(result).toMatchObject({ status: 0, stderr: "" });
  expect(result.stdout).toContain("src is clean (self-test passed)");
});
