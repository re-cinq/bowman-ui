import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const script = join(root, "scripts", "check-spec-status.mjs");
const nodeFlags = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"];

const fixtures = "tests/fixtures/spec-status";
const inProgressSpec = `${fixtures}/specs/in-progress/spec.md`;
const shippedSpec = `${fixtures}/specs/shipped-partial/spec.md`;
const untaggedSpec = `${fixtures}/specs/untagged/spec.md`;
const noLeadSpec = `${fixtures}/specs/no-lead/spec.md`;
const acceptedAdr = `${fixtures}/adrs/ADR-042-tide-ledger.md`;
const noLeadAdr = `${fixtures}/adrs/ADR-043-lamp-oil.md`;

type RunResult = { status: number | null; stdout: string; stderr: string };

type Finding = { doc: string; line: number; kind: string; message: string };

const runFrom = (cwd: string, ...args: string[]): RunResult => {
  const result = spawnSync(process.execPath, [...nodeFlags, script, ...args], {
    cwd,
    encoding: "utf8",
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const run = (...args: string[]): RunResult => runFrom(root, ...args);

const findings = (...args: string[]): Finding[] => JSON.parse(run("--json", ...args).stdout);

const discoveredDocs = (): string[] => {
  const specs = readdirSync(join(root, "specs"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `specs/${entry.name}/spec.md`)
    .sort();
  const adrs = readdirSync(join(root, "adrs"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `adrs/${entry.name}`)
    .sort();

  return [...specs, ...adrs];
};

describe("check-spec-status", () => {
  it('a spec tagged "In Progress" with partial coverage reports nothing and exits 0', () => {
    expect(run(inProgressSpec)).toMatchObject({
      status: 0,
      stdout: "spec-status: 0 findings across 0 docs (1 scanned)\n",
    });
  });

  it('a spec tagged Shipped with one unlinked statement reports the expected "in-progress"', () => {
    expect(run(shippedSpec).stdout).toContain(
      `${shippedSpec}:6: status "shipped" does not match coverage: ` +
        '1 of 2 testable statements linked, expected "in-progress"'
    );
  });

  it("a spec with no status row reports untagged at line 1", () => {
    expect(findings(untaggedSpec)).toEqual([
      {
        doc: untaggedSpec,
        line: 1,
        kind: "untagged",
        message: "no lifecycle status the parsers can read",
      },
    ]);
  });

  it("a spec opening straight into a section reports a lead paragraph at line 1", () => {
    expect(findings(noLeadSpec)).toEqual([
      {
        doc: noLeadSpec,
        line: 1,
        kind: "lead-paragraph",
        message: "no lead paragraph before the first section",
      },
    ]);
  });

  it("an accepted ADR with a lead paragraph and no test links reports nothing", () => {
    expect(run(acceptedAdr)).toMatchObject({
      status: 0,
      stdout: "spec-status: 0 findings across 0 docs (1 scanned)\n",
    });
  });

  it("an ADR with no lead paragraph reports one on the line after the frontmatter", () => {
    expect(findings(noLeadAdr)).toEqual([
      {
        doc: noLeadAdr,
        line: 7,
        kind: "lead-paragraph",
        message: "no lead paragraph before the first section",
      },
    ]);
  });

  it("four fixture docs report four findings across four docs and exit 1", () => {
    const result = run(
      inProgressSpec,
      shippedSpec,
      untaggedSpec,
      noLeadSpec,
      acceptedAdr,
      noLeadAdr
    );

    expect(result).toMatchObject({ status: 1 });
    expect(result.stdout).toContain("spec-status: 4 findings across 4 docs (6 scanned)");
  });

  it("--coverage lists each unlinked statement and exits 0 under its own summary", () => {
    const result = run("--coverage", inProgressSpec, shippedSpec);

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain(
      `${inProgressSpec}:15: unlinked testable statement: ` +
        "A kite is sold whole, so a broken spar is replaced rather than sold on its own."
    );
    expect(result.stdout).toContain(
      "spec-coverage: 2 unlinked testable statements across 2 docs (2 scanned)"
    );
  });

  it("--coverage exits 0 on a doc the default run fails", () => {
    expect(run("--coverage", untaggedSpec)).toMatchObject({ status: 0 });
    expect(run(untaggedSpec)).toMatchObject({ status: 1 });
  });

  it("--json prints only an array of findings carrying doc, line, kind and message", () => {
    const result = run("--json", shippedSpec);

    expect(result.stdout).not.toContain("spec-status:");
    expect(JSON.parse(result.stdout)).toEqual([
      {
        doc: shippedSpec,
        line: 6,
        kind: "tier",
        message: expect.stringContaining('expected "in-progress"'),
      },
    ]);
  });

  it('--coverage --json labels every finding "unlinked"', () => {
    expect(findings("--coverage", inProgressSpec)).toEqual([
      {
        doc: inProgressSpec,
        line: 15,
        kind: "unlinked",
        message: expect.stringContaining("A kite is sold whole"),
      },
    ]);
  });

  it("an unknown flag exits 2 with the usage line", () => {
    const result = run("--frobnicate");

    expect(result).toMatchObject({ status: 2, stdout: "" });
    expect(result.stderr).toContain(
      "usage: check-spec-status.mjs [--coverage] [--json] [doc-path ...]"
    );
  });

  it("a doc path that cannot be read exits 2 naming the path", () => {
    const result = run(`${fixtures}/specs/absent/spec.md`);

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain(`cannot read doc ${fixtures}/specs/absent/spec.md`);
  });

  it("a relative doc path resolves against the repo root, not the working directory", () => {
    expect(runFrom(tmpdir(), shippedSpec)).toMatchObject({
      status: 1,
      stdout: run(shippedSpec).stdout,
    });
  });

  it("an absolute doc path is scanned and reported repo-relative", () => {
    expect(runFrom(tmpdir(), join(root, shippedSpec))).toMatchObject({
      status: 1,
      stdout: run(shippedSpec).stdout,
    });
  });

  it("no doc paths scans the sorted specs directories followed by the sorted adrs", () => {
    expect(run().stdout).toBe(run(...discoveredDocs()).stdout);
  });
});
