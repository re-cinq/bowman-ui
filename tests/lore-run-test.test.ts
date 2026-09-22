import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  expectUsageError,
  runScript,
  scriptRunner,
  type RunResult,
} from "./helpers/script-runner.js";

// The round trip runs the real scripts against a throwaway Vitest project
// rather than this repo: pointed at the repo, the run script's `npm run build`
// would rm -rf dist under the *-dist tests, and the child vitest would collect
// this very file and recurse. The fixture's node_modules is a symlink to the
// repo's, so `npx vitest` resolves locally; npm_config_offline turns any
// resolution miss into a failure instead of a registry install. The listed id
// joins describe titles with " > ", Vitest's own full-name separator - the JSON
// reporter's fullName uses a plain space, which is what issue 183 tripped on -
// and this file is what catches a Vitest upgrade flipping either side.
const listScriptPath = join(process.cwd(), "scripts", "lore-list-tests.mjs");
const runScriptPath = join(process.cwd(), "scripts", "lore-run-test.mjs");
const { run } = scriptRunner(runScriptPath);

const fixtureTest = `import { describe, expect, it } from "vitest";

describe("outer suite", () => {
  describe("inner (group)", () => {
    it("passes with {braces} and a $ sign", () => {
      expect(1).toBe(1);
    });

    it("fails on purpose", () => {
      expect(1).toBe(2);
    });
  });
});

describe("amb", () => {
  it("x > y", () => {
    expect(true).toBe(true);
  });
});

it("amb > x > y", () => {
  expect(true).toBe(true);
});

it("top-level passes", () => {
  expect(true).toBe(true);
});
`;

const fixtureFile = "tests/nested.test.mjs";
const nestedPassingId = `${fixtureFile}::outer suite > inner (group) > passes with {braces} and a $ sign`;
const nestedFailingId = `${fixtureFile}::outer suite > inner (group) > fails on purpose`;
const ambiguousId = `${fixtureFile}::amb > x > y`;

const createFixtureProject = (): string => {
  const projectDir = realpathSync(mkdtempSync(join(tmpdir(), "lore-run-test-")));

  mkdirSync(join(projectDir, "tests"));
  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify({
      name: "fixture",
      private: true,
      type: "module",
      scripts: { build: "node -e 0" },
    })
  );
  symlinkSync(join(process.cwd(), "node_modules"), join(projectDir, "node_modules"), "dir");
  writeFileSync(join(projectDir, fixtureFile), fixtureTest);

  return projectDir;
};

const runInFixture = (projectDir: string, script: string, args: string[]): RunResult => {
  const env: NodeJS.ProcessEnv = { ...process.env, npm_config_offline: "true" };

  delete env.NODE_V8_COVERAGE;

  return runScript(script, args, { cwd: projectDir, env });
};

describe("lore-run-test against a describe-nested fixture", () => {
  let projectDir: string;

  beforeAll(() => {
    projectDir = createFixtureProject();
  });

  afterAll(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("lists every test with its describe titles joined by ' > '", () => {
    const result = runInFixture(projectDir, listScriptPath, []);

    expect(result).toMatchObject({ status: 0 });
    expect(JSON.parse(result.stdout).map((test: { id: string }) => test.id)).toEqual([
      nestedPassingId,
      nestedFailingId,
      ambiguousId,
      ambiguousId,
      `${fixtureFile}::top-level passes`,
    ]);
  }, 30_000);

  it("runs the describe-nested test named by its listed id and exits 0", () => {
    const result = runInFixture(projectDir, runScriptPath, [nestedPassingId]);

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toMatch(/Tests\s+1 passed/);
  }, 30_000);

  it("exits 1 when the selected describe-nested test fails", () => {
    const result = runInFixture(projectDir, runScriptPath, [nestedFailingId]);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stdout).toMatch(/Tests\s+1 failed/);
  }, 30_000);

  it("exits 1 naming the count when the selector matches two tests", () => {
    const result = runInFixture(projectDir, runScriptPath, [ambiguousId]);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(`selector matched 2 tests, expected 1: ${ambiguousId}`);
  }, 30_000);

  it("exits 1 naming the count when the selector matches no test", () => {
    const selector = `${fixtureFile}::outer suite inner (group) passes with {braces} and a $ sign`;
    const result = runInFixture(projectDir, runScriptPath, [selector]);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(`selector matched 0 tests, expected 1: ${selector}`);
  }, 30_000);

  it("exits 2 with usage when the selector carries no ::", () => {
    expectUsageError(run("tests/nested.test.mjs"));
  });

  it("exits 2 with usage without a selector", () => {
    expectUsageError(run());
  });
});
