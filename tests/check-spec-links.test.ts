import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const script = join(root, "scripts", "check-spec-links.mjs");
const nodeFlags = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"];

const trailingSpec = "tests/fixtures/spec-links/trailing/spec.md";
const misplacedSpec = "tests/fixtures/spec-links/misplaced/spec.md";
const citedTest = "../../../../tests/check-at-pass.test.ts";

type RunResult = { status: number | null; stdout: string; stderr: string };

type Finding = {
  spec: string;
  line: number | null;
  path: string;
  anchorLine: number | null;
  label: string;
  statement: string;
};

const runFrom = (cwd: string, ...args: string[]): RunResult => {
  const result = spawnSync(process.execPath, [...nodeFlags, script, ...args], {
    cwd,
    encoding: "utf8",
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const run = (...args: string[]): RunResult => runFrom(root, ...args);

const findings = (...args: string[]): Finding[] => JSON.parse(run("--json", ...args).stdout);

const discoveredSpecs = (): string[] => {
  const slugs = readdirSync(join(root, "specs"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return [...slugs.map((slug) => `specs/${slug}/spec.md`), ".specify/spec.md"];
};

describe("check-spec-links", () => {
  it("a list item with two mid-item citations reports both at the item's line", () => {
    expect(findings(misplacedSpec).filter((finding) => finding.line === 10)).toMatchObject([
      { anchorLine: 14, path: citedTest },
      { anchorLine: 22, path: citedTest },
    ]);
  });

  it("a mid-sentence citation in a paragraph reports one finding at the paragraph's line", () => {
    expect(findings(misplacedSpec).filter((finding) => finding.line === 16)).toMatchObject([
      {
        anchorLine: 38,
        statement:
          "The lamp ([validated by](../../../../tests/check-at-pass.test.ts#L38)) turns clockwise.",
      },
    ]);
  });

  it("a citation with no #L anchor is reported with the path alone", () => {
    expect(run(misplacedSpec).stdout).toContain(
      `${misplacedSpec}:19: ${citedTest} cited outside the statement's trailing parenthetical`
    );
  });

  it("a paragraph sentence whose citation is trailing reports nothing", () => {
    expect(run(trailingSpec).stdout).not.toContain("#L30");
  });

  it("a mid-sentence link to a script rather than a test reports nothing", () => {
    expect(run(trailingSpec).stdout).not.toContain("check-spec-links.mjs");
  });

  it("a citation written inside backticks reports nothing", () => {
    expect(run(trailingSpec).stdout).not.toContain("#L46");
  });

  it("a spec citing only in trailing parentheticals exits 0 with a zero summary", () => {
    const result = run(trailingSpec);

    expect(result).toMatchObject({
      status: 0,
      stdout: "misplaced: 0 across 0 specs (9 statements scanned)\n",
    });
  });

  it("a spec with misplaced citations exits 1 and summarises findings, specs and statements", () => {
    const result = run(misplacedSpec, trailingSpec);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stdout).toContain("misplaced: 4 across 1 specs (17 statements scanned)");
  });

  it("--json prints only an array of findings carrying every reported field", () => {
    const result = run("--json", misplacedSpec);

    expect(result.stdout).not.toContain("misplaced:");
    expect(JSON.parse(result.stdout)[0]).toEqual({
      spec: misplacedSpec,
      line: 10,
      path: citedTest,
      anchorLine: 14,
      label: "validated by",
      statement: expect.stringContaining("The beacon clamps its range"),
    });
  });

  it("an unknown flag exits 2 with the usage line", () => {
    const result = run("--frobnicate");

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("usage: check-spec-links.mjs [--json] [spec-path ...]");
  });

  it("the usage line says paths resolve against the repo root", () => {
    expect(run("--frobnicate").stderr).toContain(
      "spec paths resolve against the repo root, not the working directory"
    );
  });

  it("a spec path that cannot be read exits 2 naming the path", () => {
    const result = run("tests/fixtures/spec-links/absent/spec.md");

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("cannot read spec tests/fixtures/spec-links/absent/spec.md");
  });

  it("a relative spec path resolves against the repo root, not the working directory", () => {
    expect(runFrom(tmpdir(), misplacedSpec).stdout).toBe(run(misplacedSpec).stdout);
  });

  it("an absolute spec path is scanned and reported repo-relative", () => {
    expect(runFrom(tmpdir(), join(root, misplacedSpec)).stdout).toBe(run(misplacedSpec).stdout);
  });

  it("no spec paths scans the sorted specs directories plus .specify/spec.md", () => {
    expect(run().stdout).toBe(run(...discoveredSpecs()).stdout);
  });
});
