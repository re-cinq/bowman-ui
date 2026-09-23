import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  expectUsageError,
  git,
  initRepo,
  runScript,
  writeInRepo as write,
  type RunResult,
} from "./helpers/script-runner.js";

const script = join(process.cwd(), "scripts", "reanchor-spec-links.mjs");

const run = (repo: string, ...args: string[]): RunResult => runScript(script, args, { cwd: repo });

const read = (repo: string, path: string) => readFileSync(join(repo, path), "utf8");

const asFile = (lines: string[]) => `${lines.join("\n")}\n`;

const MATHS_TEST = [
  'describe("maths", () => {',
  '  it("adds numbers", () => {',
  "    expect(1 + 1).toBe(2);",
  "  });",
  '  it("subtracts numbers", () => {',
  "    expect(2 - 1).toBe(1);",
  "  });",
  "});",
];

const TEST_PATH = "tests/Maths.test.ts";
const SPEC_PATH = "specs/maths/spec.md";
const INTRO = ['import { describe } from "vitest";', 'import { add } from "./add.js";'];

const link = (label: string, anchor: string) => `[${label}](../../tests/Maths.test.ts#L${anchor})`;

const asSpec = (...links: string[]) =>
  asFile(links.map((cited, index) => `Statement ${index + 1}. (${cited})`));

const commit = (repo: string, message: string) => {
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", message);
};

// Both modes exit 1 naming the finding on stderr, and the rewrite leaves the spec as it was.
const expectReportedInBothModes = (repo: string, spec: string, finding: string) => {
  const check = run(repo, "--check", "main");
  const rewrite = run(repo, "main");

  expect([check.status, rewrite.status]).toEqual([1, 1]);
  expect(check.stderr).toContain(finding);
  expect(rewrite.stderr).toContain(finding);
  expect(read(repo, SPEC_PATH)).toEqual(spec);
};

const SYSTEM_SPEC = "System statement. ([validated by](../tests/Maths.test.ts#L3))\n";
const ADR = "Decision. ([validated by](../tests/Maths.test.ts#L6))\n";

const makeRepo = (spec: string, testLines: string[], docs: Record<string, string>): string => {
  const repo = initRepo(mkdtempSync(join(tmpdir(), "reanchor-spec-links-")));

  write(repo, TEST_PATH, asFile(testLines));
  write(repo, "README.md", asFile(["# Demo", "Run npm test."]));
  write(repo, "adrs/.gitkeep", "");
  write(repo, SPEC_PATH, spec);
  Object.entries(docs).forEach(([path, content]) => write(repo, path, content));
  commit(repo, "baseline");
  git(repo, "checkout", "-q", "-b", "feature");

  return repo;
};

const prependIntro = (repo: string, testLines: string[] = MATHS_TEST) => {
  write(repo, TEST_PATH, asFile([...INTRO, ...testLines]));
};

const replaceLine = (lines: string[], line: number, replacement: string[]) => [
  ...lines.slice(0, line - 1),
  ...replacement,
  ...lines.slice(line),
];

const repos: string[] = [];

const repoWith = (spec: string, testLines = MATHS_TEST, docs: Record<string, string> = {}) => {
  const repo = makeRepo(spec, testLines, docs);

  repos.push(repo);

  return repo;
};

afterEach(() => {
  repos.splice(0).forEach((repo) => rmSync(repo, { recursive: true, force: true }));
});

describe("reanchor-spec-links", () => {
  it("moves a titled link from L5 to its test declaration on L7 when two lines are inserted above", () => {
    const repo = repoWith(asSpec(link("validated by subtracts numbers", "5")));

    prependIntro(repo);
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("re-anchored: 1, up to date: 0");
    expect(read(repo, SPEC_PATH)).toEqual(asSpec(link("validated by subtracts numbers", "7")));
  });

  it("moves a titled link from L3 to its test declaration on L5 when its cited assertion is rewritten in place", () => {
    const repo = repoWith(asSpec(link("validated by adds numbers", "3")));

    write(
      repo,
      TEST_PATH,
      asFile(
        replaceLine(MATHS_TEST, 2, [
          '  it("multiplies numbers", () => {',
          "    expect(2 * 2).toBe(4);",
          "  });",
          '  it("adds numbers", () => {',
          "    expect(add(1, 1)).toBe(2);",
        ]).filter((_, index) => index !== 6)
      )
    );
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, SPEC_PATH)).toEqual(asSpec(link("validated by adds numbers", "5")));
  });

  it("maps a titled link on the L3 assertion to the L5 assertion when two lines are inserted above", () => {
    const repo = repoWith(asSpec(link("validated by adds numbers", "3")));

    prependIntro(repo);
    run(repo, "main");

    expect(read(repo, SPEC_PATH)).toEqual(asSpec(link("validated by adds numbers", "5")));
  });

  it("keeps a titled link on L3 that already lies inside the span of its test", () => {
    const repo = repoWith(asSpec(link("validated by adds numbers", "3")));

    write(repo, TEST_PATH, asFile([...MATHS_TEST, "// trailing note"]));
    const result = run(repo, "--check", "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("stale: 0, up to date: 1");
  });

  it("maps untitled links on L6 and L3 to L8 and L5 in a spec, the system spec and an ADR", () => {
    const repo = repoWith(asSpec(link("validated by", "6")), MATHS_TEST, {
      ".specify/spec.md": SYSTEM_SPEC,
      "adrs/ADR-001.md": ADR,
    });

    prependIntro(repo);
    commit(repo, "prepend imports");
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect([
      read(repo, SPEC_PATH),
      read(repo, ".specify/spec.md"),
      read(repo, "adrs/ADR-001.md"),
    ]).toEqual([
      asSpec(link("validated by", "8")),
      "System statement. ([validated by](../tests/Maths.test.ts#L5))\n",
      "Decision. ([validated by](../tests/Maths.test.ts#L8))\n",
    ]);
  });

  it("reports a titled link whose title no test carries and exits 1 in both modes, rewriting nothing", () => {
    const spec = asSpec(link("validated by a test since renamed", "6"));
    const repo = repoWith(spec);

    prependIntro(repo);

    expectReportedInBothModes(
      repo,
      spec,
      'unmapped specs/maths/spec.md: ../../tests/Maths.test.ts#L6 -> no test in tests/Maths.test.ts carries the title "a test since renamed"'
    );
  });

  it("reports an untitled link on a deleted line and exits 1 in both modes, rewriting nothing", () => {
    const spec = asSpec(link("validated by", "6"));
    const repo = repoWith(spec);

    write(repo, TEST_PATH, asFile(replaceLine(MATHS_TEST, 6, [])));

    expectReportedInBothModes(
      repo,
      spec,
      "unmapped specs/maths/spec.md: ../../tests/Maths.test.ts#L6 -> #L6 was deleted or rewritten on this branch"
    );
  });

  it("reports an untitled link whose cited line was rewritten in place", () => {
    const repo = repoWith(asSpec(link("validated by", "3")));

    write(repo, TEST_PATH, asFile(replaceLine(MATHS_TEST, 3, ["    expect(add(1, 1)).toBe(2);"])));
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stdout).toContain("unmapped: 1");
  });

  it("keeps a link whose href this branch edited by hand as authored", () => {
    const repo = repoWith(asSpec(link("validated by", "6")));

    write(repo, TEST_PATH, asFile(replaceLine(MATHS_TEST, 6, [])));
    write(repo, SPEC_PATH, asSpec(link("validated by", "5")));
    const result = run(repo, "--check", "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("kept as authored: 1");
  });

  it("keeps a link this branch added above as authored and still maps L6 below it to L8", () => {
    const repo = repoWith(asSpec(link("validated by", "6")));

    prependIntro(repo);
    write(
      repo,
      SPEC_PATH,
      `New statement. (${link("validated by", "4")})\n${asSpec(link("validated by", "6"))}`
    );
    run(repo, "main");

    expect(read(repo, SPEC_PATH)).toEqual(
      `New statement. (${link("validated by", "4")})\n${asSpec(link("validated by", "8"))}`
    );
  });

  it("maps a link on a statement this branch reworded, L6 to L8", () => {
    const repo = repoWith(asSpec(link("validated by", "6")));

    prependIntro(repo);
    write(repo, SPEC_PATH, `Statement one, reworded. (${link("validated by", "6")})\n`);
    run(repo, "main");

    expect(read(repo, SPEC_PATH)).toEqual(
      `Statement one, reworded. (${link("validated by", "8")})\n`
    );
  });

  it("a second run against the same merge base changes nothing", () => {
    const repo = repoWith(asSpec(link("validated by", "6"), link("L3", "3")));

    prependIntro(repo);
    run(repo, "main");
    const afterFirst = read(repo, SPEC_PATH);
    const second = run(repo, "main");

    expect(second).toMatchObject({ status: 0 });
    expect(second.stdout).toContain("re-anchored: 0, up to date: 2");
    expect(read(repo, SPEC_PATH)).toEqual(afterFirst);
  });

  it("--check exits 1 naming a stale link and rewrites nothing, then exits 0 after a run", () => {
    const spec = asSpec(link("validated by", "6"));
    const repo = repoWith(spec);

    prependIntro(repo);
    const stale = run(repo, "--check", "main");
    const specAfterCheck = read(repo, SPEC_PATH);

    run(repo, "main");
    const healed = run(repo, "--check", "main");

    expect(stale).toMatchObject({ status: 1 });
    expect(stale.stderr).toContain(
      "stale specs/maths/spec.md: ../../tests/Maths.test.ts#L6 -> #L8"
    );
    expect(specAfterCheck).toEqual(spec);
    expect(healed).toMatchObject({ status: 0 });
  });

  it("leaves a titled link into a test file this branch did not change alone, and --all moves it", () => {
    const spec = asSpec(link("validated by subtracts numbers", "2"));
    const repo = repoWith(spec);

    write(repo, "README.md", asFile(["# Demo", "", "Run npm test."]));
    const scoped = run(repo, "main");
    const specAfterScoped = read(repo, SPEC_PATH);
    const swept = run(repo, "--all", "main");

    expect(scoped.stdout).toContain("out of scope: 1");
    expect(specAfterScoped).toEqual(spec);
    expect(swept).toMatchObject({ status: 0 });
    expect(read(repo, SPEC_PATH)).toEqual(asSpec(link("validated by subtracts numbers", "5")));
  });

  it("maps a link into README.md, titled or not, from L2 to L3 through the hunks", () => {
    const readmeLink = (label: string, line: number) => `[${label}](../../README.md#L${line})`;
    const repo = repoWith(
      asSpec(readmeLink("validated by", 2), readmeLink("validated by the test command", 2))
    );

    write(repo, "README.md", asFile(["# Demo", "", "Run npm test."]));
    run(repo, "main");

    expect(read(repo, SPEC_PATH)).toEqual(
      asSpec(readmeLink("validated by", 3), readmeLink("validated by the test command", 3))
    );
  });

  it("an L6 line label follows its href to L8", () => {
    const repo = repoWith(asSpec(link("L6", "6")));

    prependIntro(repo);
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, SPEC_PATH)).toEqual(asSpec(link("L8", "8")));
  });

  it("an L9 line label on an L6 href fails --check as mislabelled and a run syncs it to L6", () => {
    const spec = asSpec(link("L9", "6"));
    const repo = repoWith(spec);
    const check = run(repo, "--check", "main");
    const specAfterCheck = read(repo, SPEC_PATH);
    const rewrite = run(repo, "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stderr).toContain(
      "mislabelled specs/maths/spec.md: ../../tests/Maths.test.ts#L6 -> label reads L9"
    );
    expect(specAfterCheck).toEqual(spec);
    expect(rewrite.stdout).toContain("relabelled: 1");
    expect(read(repo, SPEC_PATH)).toEqual(asSpec(link("L6", "6")));
  });

  it("reports a title two tests carry and exits 1", () => {
    const repo = repoWith(asSpec(link("validated by adds numbers", "3")), [
      ...MATHS_TEST.slice(0, 7),
      '  it("adds numbers", () => {});',
      "});",
    ]);

    prependIntro(repo, [...MATHS_TEST.slice(0, 7), '  it("adds numbers", () => {});', "});"]);
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain('several tests carry the title "adds numbers"');
  });

  it("an anchor on a blank line or into a missing file is rotten in both modes", () => {
    const repo = repoWith(
      asSpec(
        link("validated by", "2"),
        "[validated by](../../tests/Gone.test.ts#L1)",
        "[validated by](../../README.md#L9)"
      ),
      replaceLine(MATHS_TEST, 2, [""])
    );
    const check = run(repo, "--check", "main");
    const rewrite = run(repo, "main");

    expect([check.status, rewrite.status]).toEqual([1, 1]);
    expect(check.stderr.split("\n").filter((line) => line.startsWith("rotten"))).toEqual([
      "rotten specs/maths/spec.md: ../../tests/Maths.test.ts#L2 -> #L2 lands on a blank or closing line",
      "rotten specs/maths/spec.md: ../../tests/Gone.test.ts#L1 -> tests/Gone.test.ts does not exist in the working tree",
      "rotten specs/maths/spec.md: ../../README.md#L9 -> #L9 is beyond the end of README.md",
    ]);
  });

  it("leaves a link whose fragment is not a line number, and a web URL, untouched", () => {
    const spec = asSpec(
      "[validated by](../../tests/Maths.test.ts#A1)",
      "[source](https://example.test/Maths.test.ts#L6)"
    );
    const repo = repoWith(spec);

    prependIntro(repo);
    run(repo, "main");

    expect(read(repo, SPEC_PATH)).toEqual(spec);
  });

  it("maps L6, an L6 label and setup L3 to L9, L9 and L5 during an uncommitted merge of main", () => {
    const setupLink = (line: number) => `[validated by](../../tests/setup.ts#L${line})`;
    const repo = repoWith(asSpec(link("validated by", "6"), link("L6", "6"), setupLink(3)));

    git(repo, "checkout", "-q", "main");
    write(repo, "tests/setup.ts", asFile(["a", "b", "c"]));
    commit(repo, "setup before the feature");
    git(repo, "branch", "-f", "feature");
    write(repo, "tests/setup.ts", asFile(["main", "a", "b", "c"]));
    write(repo, TEST_PATH, asFile(["// main", ...MATHS_TEST]));
    write(repo, SPEC_PATH, asSpec(link("validated by", "7"), link("L7", "7"), setupLink(4)));
    commit(repo, "main shifts every cited line by one");
    git(repo, "checkout", "-q", "feature");
    write(repo, "tests/setup.ts", asFile(["a", "b", "feature", "c"]));
    write(repo, TEST_PATH, asFile([...MATHS_TEST.slice(0, 2), ...INTRO, ...MATHS_TEST.slice(2)]));
    commit(repo, "feature inserts below the second line");
    git(repo, "merge", "-q", "--no-commit", "--no-ff", "main");
    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, SPEC_PATH)).toEqual(
      asSpec(link("validated by", "9"), link("L9", "9"), setupLink(5))
    );
  });

  it("defaults the base ref to origin/main", () => {
    const repo = repoWith(asSpec(link("validated by", "6")));
    const clone = mkdtempSync(join(tmpdir(), "reanchor-spec-links-clone-"));

    repos.push(clone);
    git(repo, "checkout", "-q", "main");
    execFileSync("git", ["clone", "-q", repo, join(clone, "repo")], { stdio: "ignore" });
    const cloneRepo = join(clone, "repo");

    prependIntro(cloneRepo);
    run(cloneRepo);

    expect(read(cloneRepo, SPEC_PATH)).toEqual(asSpec(link("validated by", "8")));
  });

  it("an unknown flag or a second base ref exits 2 with usage", () => {
    const repo = repoWith(asSpec(link("validated by", "6")));

    expectUsageError(run(repo, "--frobnicate"));
    expectUsageError(run(repo, "main", "feature"));
  });

  it("an unknown base ref exits 2 naming the ref", () => {
    const result = run(repoWith(asSpec(link("validated by", "6"))), "no-such-ref");

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("no-such-ref");
  });
});
