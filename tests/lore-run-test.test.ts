import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
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
// resolution miss into a failure instead of a registry install, and NO_COLOR
// keeps the child's summary line free of the escapes CI's FORCE_COLOR adds. The listed id
// joins describe titles with " > ", Vitest's own full-name separator - the JSON
// reporter's fullName uses a plain space, which is what issue 183 tripped on -
// and this file is what catches a Vitest upgrade flipping either side.
const listScriptPath = join(process.cwd(), "scripts", "lore-list-tests.mjs");
const runScriptPath = join(process.cwd(), "scripts", "lore-run-test.mjs");
const { run } = scriptRunner(runScriptPath);

const fixtureTest = `import { describe, expect, it } from "vitest";
import { twice } from "../covered.mjs";

describe("outer suite", () => {
  describe("inner (group)", () => {
    it("passes with {braces} and a $ sign", () => {
      expect(twice(1)).toBe(2);
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

// The fixture test covers a module of its own so the run has something to
// report coverage FOR: with nothing covered the lcov is empty, and an assertion
// that stdout carries lcov and no Vitest chatter would pass on an empty string
// whether the script honours the contract or not.
const fixtureModule = `export const twice = (n) => n * 2;
export const never = (n) => n * 3;
`;

const siblingTest = `import { expect, it } from "vitest";

it("sibling", () => {
  expect(1).toBe(1);
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
  writeFileSync(join(projectDir, "covered.mjs"), fixtureModule);
  writeFileSync(join(projectDir, fixtureFile), fixtureTest);

  return projectDir;
};

const runInFixture = (projectDir: string, script: string, args: string[]): RunResult => {
  const env: NodeJS.ProcessEnv = { ...process.env, npm_config_offline: "true", NO_COLOR: "1" };

  delete env.NODE_V8_COVERAGE;
  delete env.FORCE_COLOR;

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
    expect(result.stderr).toMatch(/Tests\s+1 passed/);
  }, 30_000);

  it("exits 1 when the selected describe-nested test fails", () => {
    const result = runInFixture(projectDir, runScriptPath, [nestedFailingId]);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toMatch(/Tests\s+1 failed/);
  }, 30_000);

  // The `coverage_format: lcov` contract: the report goes to stdout and Vitest's
  // own summary must not, because lore-code-trace parses stdout as lcov. The
  // covered module has to appear, or this passes on an empty stdout.
  it("keeps Vitest's summary off stdout, which carries lcov alone", () => {
    const result = runInFixture(projectDir, runScriptPath, [nestedPassingId]);
    const lines = result.stdout.split("\n").filter(Boolean);

    expect(result.stdout).toContain("SF:covered.mjs");
    expect(result.stdout).toMatch(/^DA:\d+,[1-9]/m);
    expect(result.stderr).toMatch(/Tests\s+1 passed/);
    expect(lines.length).toBeGreaterThan(5);

    for (const line of lines) {
      expect(line).toMatch(/^(TN:|SF:|DA:|FN|LF:|LH:|BR[DFH]|end_of_record)/);
    }
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

  // lore-code-trace groups the listed tests by file and passes the bare file as
  // the selector, so a path with no :: runs the whole file rather than erroring.
  // The fixture file holds a deliberately failing test, so the file fails.
  it("runs the whole file when the selector carries no ::", () => {
    const result = runInFixture(projectDir, runScriptPath, [fixtureFile]);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toMatch(/Tests\s+1 failed \| 4 passed/);
    expect(result.stderr).not.toContain("selector matched");
  }, 30_000);

  it("exits 1 naming the count when a whole-file selector matches no test", () => {
    const result = runInFixture(projectDir, runScriptPath, ["tests/absent.test.mjs"]);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(
      "selector matched 0 tests, expected at least 1: tests/absent.test.mjs"
    );
  }, 30_000);

  it("exits 2 with usage without a selector", () => {
    expectUsageError(run());
  });

  // Vitest's positional is a regex over paths: "tests/nested" matches both
  // fixture files, and whichever ran would otherwise be reported as the result
  // for the selector - a green run of the wrong test, which this mode must
  // refuse exactly as the per-test mode refuses an ambiguous name.
  it("exits 1 naming the count when a whole-file selector matches two files", () => {
    writeFileSync(join(projectDir, "tests/nested-two.test.mjs"), siblingTest);

    try {
      const result = runInFixture(projectDir, runScriptPath, ["tests/nested"]);

      expect(result).toMatchObject({ status: 1 });
      expect(result.stderr).toContain("selector matched 2 files, expected 1: tests/nested");
    } finally {
      rmSync(join(projectDir, "tests/nested-two.test.mjs"));
    }
  }, 30_000);
});

// The build the scripts share is skipped when dist is already newer than every
// input, because lore-code-trace runs this command over four files at a time and
// `npm run build` opens with `rm -rf dist`. The skip has to be conditioned on the
// build's LAST artifact: `tsc` emits dist/index.js even when it fails, so keying
// on index.js alone leaves a half-built dist looking finished, and every later
// invocation skips the repair instead of making it - 73 files of bogus failures
// with no diagnostic, which is the shape of degeneracy this whole contract guards.
const buildFixtureFile = "tests/one.test.mjs";
const buildFixtureTest = `import { expect, it } from "vitest";

it("passes", () => {
  expect(1).toBe(1);
});
`;

// Mimics this repo's build: both artifacts, the stylesheet last, and a line per
// run so the test can count how often it actually happened.
const countingBuild = `import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.js", "");
writeFileSync("dist/styles.css", "");
appendFileSync("builds.log", "built\\n");
`;

describe("the shared build gate", () => {
  let projectDir: string;
  const buildCount = (): number =>
    readFileSync(join(projectDir, "builds.log"), "utf8").split("\n").filter(Boolean).length;

  beforeAll(() => {
    projectDir = realpathSync(mkdtempSync(join(tmpdir(), "lore-build-gate-")));

    mkdirSync(join(projectDir, "tests"));
    mkdirSync(join(projectDir, "src"));
    writeFileSync(join(projectDir, "src", "thing.ts"), "export const thing = 1;\n");
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        name: "fixture",
        private: true,
        type: "module",
        scripts: { build: "node build.mjs" },
      })
    );
    symlinkSync(join(process.cwd(), "node_modules"), join(projectDir, "node_modules"), "dir");
    writeFileSync(join(projectDir, "build.mjs"), countingBuild);
    writeFileSync(join(projectDir, buildFixtureFile), buildFixtureTest);
    writeFileSync(join(projectDir, "builds.log"), "");
  });

  afterAll(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("builds once, then skips while dist stays current", () => {
    expect(runInFixture(projectDir, runScriptPath, [buildFixtureFile])).toMatchObject({
      status: 0,
    });
    expect(buildCount()).toBe(1);

    expect(runInFixture(projectDir, runScriptPath, [buildFixtureFile])).toMatchObject({
      status: 0,
    });
    expect(buildCount()).toBe(1);
  }, 60_000);

  it("rebuilds when a source file is edited after the build", () => {
    const source = join(projectDir, "src", "thing.ts");

    expect(buildCount()).toBe(1);
    writeFileSync(source, "export const thing = 2;\n");
    // A same-second edit is invisible on a 1s-granularity filesystem, so stamp
    // the edit a second into the future rather than racing the clock.
    const ahead = new Date(Date.now() + 1_000);

    utimesSync(source, ahead, ahead);

    expect(runInFixture(projectDir, runScriptPath, [buildFixtureFile])).toMatchObject({
      status: 0,
    });
    expect(buildCount()).toBe(2);
  }, 60_000);

  it("rebuilds when the stylesheet the build writes last is missing", () => {
    rmSync(join(projectDir, "dist", "styles.css"));

    expect(runInFixture(projectDir, runScriptPath, [buildFixtureFile])).toMatchObject({
      status: 0,
    });
    expect(buildCount()).toBe(3);
    expect(existsSync(join(projectDir, "dist", "styles.css"))).toBe(true);
  }, 60_000);
});
