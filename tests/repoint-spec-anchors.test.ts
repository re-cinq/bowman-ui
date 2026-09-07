import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const script = join(process.cwd(), "scripts", "repoint-spec-anchors.mjs");

type RunResult = { status: number | null; stdout: string; stderr: string };

const run = (repo: string, ...args: string[]): RunResult => {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: "utf8" });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const git = (repo: string, ...args: string[]) => {
  execFileSync("git", args, { cwd: repo, stdio: "ignore" });
};

const write = (repo: string, path: string, content: string) => {
  mkdirSync(join(repo, dirname(path)), { recursive: true });
  writeFileSync(join(repo, path), content);
};

const read = (repo: string, path: string) => readFileSync(join(repo, path), "utf8");

const asTestFile = (lines: string[]) => `${lines.join("\n")}\n`;

const asSpec = (...anchors: string[]) =>
  `${anchors.map((anchor, i) => `Statement ${i + 1}. ([validated by](${anchor}))`).join("\n\n")}\n`;

const asShortSpec = (...links: Array<[label: number, anchor: string]>) =>
  `${links.map(([label, anchor], i) => `Statement ${i + 1}. ([L${label}](${anchor}))`).join("\n\n")}\n`;

const makeRepo = (): string => {
  const repo = mkdtempSync(join(tmpdir(), "repoint-spec-anchors-"));

  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.email", "test@example.test");
  git(repo, "config", "user.name", "Test");
  git(repo, "config", "commit.gpgsign", "false");
  write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "beta", "gamma", "delta"]));
  write(
    repo,
    "specs/foo/spec.md",
    asSpec("../../tests/Foo.test.tsx#L2", "../../tests/Foo.test.tsx#L4")
  );
  write(repo, ".specify/spec.md", asSpec("../tests/Foo.test.tsx#L3"));
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "baseline");

  return repo;
};

describe("repoint-spec-anchors", () => {
  let repo: string;

  beforeEach(() => {
    repo = makeRepo();
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it("repoints anchors to where the base ref's line content moved", () => {
    write(
      repo,
      "tests/Foo.test.tsx",
      asTestFile(["intro", "intro2", "alpha", "beta", "gamma", "delta"])
    );

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("repointed: 3, up to date: 0, unresolved: 0");
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asSpec("../../tests/Foo.test.tsx#L4", "../../tests/Foo.test.tsx#L6")
    );
    expect(read(repo, ".specify/spec.md")).toEqual(asSpec("../tests/Foo.test.tsx#L5"));
  });

  it("a second run against the same baseline changes nothing", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["intro", "alpha", "beta", "gamma", "delta"]));
    run(repo, "main");
    const afterFirst = read(repo, "specs/foo/spec.md");

    const second = run(repo, "main");

    expect(second).toMatchObject({ status: 0 });
    expect(second.stdout).toContain("repointed: 0, up to date: 3, unresolved: 0");
    expect(read(repo, "specs/foo/spec.md")).toEqual(afterFirst);
  });

  it("--check exits 1 listing stale anchors and rewrites nothing", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["intro", "alpha", "beta", "gamma", "delta"]));
    const specBefore = read(repo, "specs/foo/spec.md");

    const check = run(repo, "--check", "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stdout).toContain("stale: 3, up to date: 0, unresolved: 0");
    expect(check.stderr).toContain("specs/foo/spec.md");
    expect(check.stderr).toContain("Foo.test.tsx");
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
  });

  it("--check exits 0 once anchors are repointed", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["intro", "alpha", "beta", "gamma", "delta"]));
    run(repo, "main");

    const check = run(repo, "--check", "main");

    expect(check).toMatchObject({ status: 0 });
    expect(check.stdout).toContain("stale: 0, up to date: 3, unresolved: 0");
  });

  it("an anchor whose base content vanished is reported unresolved and exits 1", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "BETA", "gamma", "delta"]));

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stdout).toContain("unresolved: 1");
    expect(result.stderr).toContain("Foo.test.tsx#L2");
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asSpec("../../tests/Foo.test.tsx#L2", "../../tests/Foo.test.tsx#L4")
    );
  });

  it("picks the duplicated line whose surrounding context matches the baseline", () => {
    write(
      repo,
      "tests/Foo.test.tsx",
      asTestFile(["x", "y", "beta", "z", "beta", "gamma", "delta"])
    );

    run(repo, "main");

    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asSpec("../../tests/Foo.test.tsx#L5", "../../tests/Foo.test.tsx#L7")
    );
  });

  it("repoints each of two duplicated assertions to its own occurrence", () => {
    write(
      repo,
      "tests/Foo.test.tsx",
      asTestFile(["setup", "expect(height).toBe(200);", "teardown", "expect(height).toBe(200);"])
    );
    write(
      repo,
      "specs/foo/spec.md",
      asSpec("../../tests/Foo.test.tsx#L2", "../../tests/Foo.test.tsx#L4")
    );
    write(repo, ".specify/spec.md", asSpec("../tests/Foo.test.tsx#L2"));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "duplicated assertion baseline");
    write(
      repo,
      "tests/Foo.test.tsx",
      asTestFile([
        "intro1",
        "intro2",
        "intro3",
        "setup",
        "expect(height).toBe(200);",
        "teardown",
        "expect(height).toBe(200);",
      ])
    );

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asSpec("../../tests/Foo.test.tsx#L5", "../../tests/Foo.test.tsx#L7")
    );
  });

  const periodicBlock = ["header", "alpha", "dupe", "beta", "tail"];
  const periodicFile = asTestFile([
    ...periodicBlock,
    ...periodicBlock,
    ...periodicBlock,
    ...periodicBlock,
  ]);

  const commitAmbiguousBaseline = (repo: string) => {
    write(repo, "tests/Foo.test.tsx", periodicFile);
    write(repo, "specs/foo/spec.md", asSpec("../../tests/Foo.test.tsx#L8"));
    write(repo, ".specify/spec.md", asSpec("../tests/Foo.test.tsx#L1"));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "identical duplicated blocks");
  };

  it("--check exits 1 when duplicated content has indistinguishable context", () => {
    commitAmbiguousBaseline(repo);

    const check = run(repo, "--check", "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stderr).toContain("ambiguously at lines 8, 13");
  });

  it("an ambiguous duplicate is reported and never rewritten", () => {
    commitAmbiguousBaseline(repo);
    const specBefore = read(repo, "specs/foo/spec.md");

    const rewrite = run(repo, "main");

    expect(rewrite).toMatchObject({ status: 1 });
    expect(rewrite.stdout).toContain("unresolved: 1");
    expect(rewrite.stderr).toContain("ambiguously at lines 8, 13");
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
  });

  it("duplicates identical up to three lines out are told apart at the fourth", () => {
    write(
      repo,
      "tests/Foo.test.tsx",
      asTestFile([
        "uniqA",
        "s1",
        "s2",
        "s3",
        "dupe",
        "s4",
        "s5",
        "s6",
        "uniqB",
        "s1",
        "s2",
        "s3",
        "dupe",
        "s4",
        "s5",
        "s6",
        "end",
      ])
    );
    write(repo, "specs/foo/spec.md", asSpec("../../tests/Foo.test.tsx#L13"));
    write(repo, ".specify/spec.md", asSpec("../tests/Foo.test.tsx#L1"));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "duplicates differing four lines out");
    const baseline = read(repo, "tests/Foo.test.tsx");

    write(repo, "tests/Foo.test.tsx", `intro1\nintro2\n${baseline}`);

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(asSpec("../../tests/Foo.test.tsx#L15"));
  });

  it("skips a spec whose anchor set differs from the base ref", () => {
    write(
      repo,
      "specs/foo/spec.md",
      asSpec(
        "../../tests/Foo.test.tsx#L2",
        "../../tests/Foo.test.tsx#L4",
        "../../tests/Foo.test.tsx#L1"
      )
    );
    write(repo, "tests/Foo.test.tsx", asTestFile(["intro", "alpha", "beta", "gamma", "delta"]));
    const specBefore = read(repo, "specs/foo/spec.md");

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stderr).toContain("skipped specs/foo/spec.md: anchor set differs from main");
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
    expect(read(repo, ".specify/spec.md")).toEqual(asSpec("../tests/Foo.test.tsx#L4"));
  });

  it("a spec absent from the base ref is skipped", () => {
    write(repo, "specs/new/spec.md", asSpec("../../tests/Foo.test.tsx#L1"));

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stderr).toContain("skipped specs/new/spec.md: not present at main");
    expect(read(repo, "specs/new/spec.md")).toEqual(asSpec("../../tests/Foo.test.tsx#L1"));
  });

  it("defaults the base ref to origin/main", () => {
    const clone = mkdtempSync(join(tmpdir(), "repoint-spec-anchors-clone-"));

    execFileSync("git", ["clone", "-q", repo, join(clone, "repo")], { stdio: "ignore" });
    const cloneRepo = join(clone, "repo");

    write(
      cloneRepo,
      "tests/Foo.test.tsx",
      asTestFile(["intro", "alpha", "beta", "gamma", "delta"])
    );

    const result = run(cloneRepo);

    expect(result).toMatchObject({ status: 0 });
    expect(read(cloneRepo, "specs/foo/spec.md")).toEqual(
      asSpec("../../tests/Foo.test.tsx#L3", "../../tests/Foo.test.tsx#L5")
    );
    rmSync(clone, { recursive: true, force: true });
  });

  it("a manually retargeted anchor is accepted, reported, and never rewritten", () => {
    write(
      repo,
      "specs/foo/spec.md",
      asSpec("../../tests/Foo.test.tsx#L3", "../../tests/Foo.test.tsx#L1")
    );
    const specBefore = read(repo, "specs/foo/spec.md");

    const check = run(repo, "--check", "main");
    const rewrite = run(repo, "main");

    expect(check).toMatchObject({ status: 0 });
    expect(check.stdout).toContain("retargeted (not checked): 2");
    expect(rewrite).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
  });

  it("an anchor landing on a blank line is rotten and exits 1 in both modes", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "", "gamma", "delta"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "blank line at L2");
    const specBefore = read(repo, "specs/foo/spec.md");

    const check = run(repo, "--check", "main");
    const rewrite = run(repo, "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stderr).toContain(
      "rotten specs/foo/spec.md: ../../tests/Foo.test.tsx#L2 -> #L2 lands on a blank or closing line"
    );
    expect(rewrite).toMatchObject({ status: 1 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
  });

  it("an anchor landing on closing punctuation is rotten", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "  });", "gamma", "delta"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "closing brace at L2");

    const check = run(repo, "--check", "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stderr).toContain("#L2 lands on a blank or closing line");
  });

  it("a rotten anchor whose baseline content moved is rewritten and not reported", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "", "beta", "gamma", "delta"]));

    const rewrite = run(repo, "main");

    expect(rewrite).toMatchObject({ status: 0 });
    expect(rewrite.stdout).toContain("repointed: 3, up to date: 0, unresolved: 0");
    expect(rewrite.stderr).not.toContain("rotten");
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asSpec("../../tests/Foo.test.tsx#L3", "../../tests/Foo.test.tsx#L5")
    );
  });

  it("the rotten check still applies to a spec skipped for a differing anchor set", () => {
    write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "beta", "gamma", ""]));
    write(
      repo,
      "specs/foo/spec.md",
      asSpec(
        "../../tests/Foo.test.tsx#L2",
        "../../tests/Foo.test.tsx#L4",
        "../../tests/Foo.test.tsx#L1"
      )
    );

    const check = run(repo, "--check", "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stderr).toContain("skipped specs/foo/spec.md: anchor set differs from main");
    expect(check.stderr).toContain(
      "rotten specs/foo/spec.md: ../../tests/Foo.test.tsx#L4 -> #L4 lands on a blank or closing line"
    );
  });

  it("an unknown base ref exits 2 naming the ref", () => {
    const result = run(repo, "no-such-ref");

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("no-such-ref");
  });

  it("an unknown flag exits 2 with usage", () => {
    const result = run(repo, "--frobnicate");

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("usage:");
  });

  it("re-syncs a short-form label to its href line", () => {
    write(repo, "specs/foo/spec.md", asShortSpec([9, "../../tests/Foo.test.tsx#L2"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "short-form label out of sync");

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("relabelled: 1");
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asShortSpec([2, "../../tests/Foo.test.tsx#L2"])
    );
  });

  it("a short-form label follows its href to the moved line", () => {
    write(repo, "specs/foo/spec.md", asShortSpec([2, "../../tests/Foo.test.tsx#L2"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "short-form label in sync");
    write(
      repo,
      "tests/Foo.test.tsx",
      asTestFile(["intro", "intro2", "alpha", "beta", "gamma", "delta"])
    );

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asShortSpec([4, "../../tests/Foo.test.tsx#L4"])
    );
  });

  it("--check exits 1 naming a label that disagrees with its href and rewrites nothing", () => {
    write(repo, "specs/foo/spec.md", asShortSpec([9, "../../tests/Foo.test.tsx#L2"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "short-form label out of sync");
    const specBefore = read(repo, "specs/foo/spec.md");

    const check = run(repo, "--check", "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stdout).toContain("mislabelled: 1");
    expect(check.stderr).toContain(
      "mislabelled specs/foo/spec.md: ../../tests/Foo.test.tsx#L2 -> label reads L9"
    );
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
  });

  it("--check exits 0 after labels are synced and a second run changes nothing", () => {
    write(repo, "specs/foo/spec.md", asShortSpec([9, "../../tests/Foo.test.tsx#L2"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "short-form label out of sync");
    run(repo, "main");
    const afterFirst = read(repo, "specs/foo/spec.md");

    const check = run(repo, "--check", "main");
    const second = run(repo, "main");

    expect(check).toMatchObject({ status: 0 });
    expect(check.stdout).toContain("mislabelled: 0");
    expect(second).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(afterFirst);
  });

  it("syncs a label even in a spec skipped for a differing anchor set", () => {
    write(
      repo,
      "specs/foo/spec.md",
      asShortSpec([2, "../../tests/Foo.test.tsx#L2"], [4, "../../tests/Foo.test.tsx#L4"])
    );
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "two short-form labels in sync");
    write(
      repo,
      "specs/foo/spec.md",
      asShortSpec(
        [9, "../../tests/Foo.test.tsx#L2"],
        [4, "../../tests/Foo.test.tsx#L4"],
        [1, "../../tests/Foo.test.tsx#L1"]
      )
    );

    const check = run(repo, "--check", "main");
    const rewrite = run(repo, "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stdout).toContain("mislabelled: 1");
    expect(check.stderr).toContain("skipped specs/foo/spec.md: anchor set differs from main");
    expect(check.stderr).toContain(
      "mislabelled specs/foo/spec.md: ../../tests/Foo.test.tsx#L2 -> label reads L9"
    );
    expect(rewrite).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      asShortSpec(
        [2, "../../tests/Foo.test.tsx#L2"],
        [4, "../../tests/Foo.test.tsx#L4"],
        [1, "../../tests/Foo.test.tsx#L1"]
      )
    );
  });

  it("leaves a descriptive validated-by label untouched while syncing a short-form label", () => {
    write(
      repo,
      "specs/foo/spec.md",
      "Statement 1. ([validated by](../../tests/Foo.test.tsx#L2), [L9](../../tests/Foo.test.tsx#L4))\n"
    );
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "mixed labels");

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(
      "Statement 1. ([validated by](../../tests/Foo.test.tsx#L2), [L4](../../tests/Foo.test.tsx#L4))\n"
    );
  });

  it("a short-form label whose href lands on a blank line is rotten, not silently synced", () => {
    write(repo, "specs/foo/spec.md", asShortSpec([2, "../../tests/Foo.test.tsx#L2"]));
    write(repo, "tests/Foo.test.tsx", asTestFile(["alpha", "", "gamma", "delta"]));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "short-form label href on a blank line");
    const specBefore = read(repo, "specs/foo/spec.md");

    const check = run(repo, "--check", "main");
    const rewrite = run(repo, "main");

    expect(check).toMatchObject({ status: 1 });
    expect(check.stdout).toContain("mislabelled: 0");
    expect(check.stderr).toContain(
      "rotten specs/foo/spec.md: ../../tests/Foo.test.tsx#L2 -> #L2 lands on a blank or closing line"
    );
    expect(rewrite).toMatchObject({ status: 1 });
    expect(read(repo, "specs/foo/spec.md")).toEqual(specBefore);
  });

  it("repoints anchors into docs, README and scripts when the cited line moves", () => {
    const repo = makeRepo();

    write(repo, "docs/notes.md", asTestFile(["cited note", "other note"]));
    write(repo, "README.md", asTestFile(["cited readme line", "other line"]));
    write(repo, "scripts/check.sh", asTestFile(["cited command", "other command"]));
    write(
      repo,
      "specs/bar/spec.md",
      asSpec("../../docs/notes.md#L1", "../../README.md#L1", "../../scripts/check.sh#L1")
    );
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "non-test anchors baseline");
    write(repo, "docs/notes.md", asTestFile(["inserted", "cited note", "other note"]));
    write(repo, "README.md", asTestFile(["inserted", "cited readme line", "other line"]));
    write(repo, "scripts/check.sh", asTestFile(["inserted", "cited command", "other command"]));

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("repointed: 3");
    expect(read(repo, "specs/bar/spec.md")).toEqual(
      asSpec("../../docs/notes.md#L2", "../../README.md#L2", "../../scripts/check.sh#L2")
    );
  });

  it("leaves an anchor into a root config file untracked", () => {
    const repo = makeRepo();

    write(repo, "vitest.config.ts", asTestFile(["cited option", "other option"]));
    write(repo, "specs/bar/spec.md", asSpec("../../vitest.config.ts#L1"));
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "config anchor baseline");
    write(repo, "vitest.config.ts", asTestFile(["inserted", "cited option", "other option"]));

    const result = run(repo, "main");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("repointed: 0");
    expect(read(repo, "specs/bar/spec.md")).toEqual(asSpec("../../vitest.config.ts#L1"));
  });
});
