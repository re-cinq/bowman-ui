import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scriptRunner } from "./helpers/script-runner.js";

const root = process.cwd();
const script = join(root, "scripts", "check-spec-status.mjs");

const fixtures = "tests/fixtures/spec-status";
const inProgressSpec = `${fixtures}/specs/in-progress/spec.md`;
const shippedSpec = `${fixtures}/specs/shipped-partial/spec.md`;
const untaggedSpec = `${fixtures}/specs/untagged/spec.md`;
const acceptedAdr = `${fixtures}/adrs/ADR-042-tide-ledger.md`;
const noLeadAdr = `${fixtures}/adrs/ADR-043-lamp-oil.md`;
const unreadableStatusAdr = `${fixtures}/adrs/ADR-044-buoy-paint.md`;

type Finding = { doc: string; line: number; kind: string; message: string };

const { run, runFrom } = scriptRunner(script);

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
  it("an accepted ADR with no test links reports nothing and exits 0: the coverage tier never applies to an ADR", () => {
    expect(run(acceptedAdr)).toMatchObject({
      status: 0,
      stdout: "spec-status: 0 findings across 0 docs (1 scanned)\n",
    });
  });

  it('an ADR whose frontmatter status reads "banana" reports untagged at that line', () => {
    expect(findings(unreadableStatusAdr)).toEqual([
      {
        doc: unreadableStatusAdr,
        line: 4,
        kind: "untagged",
        message: "no lifecycle status the parsers can read",
      },
    ]);
  });

  it("a spec reports nothing here whatever its status row: specs are gated by eslint", () => {
    expect(run(untaggedSpec, shippedSpec)).toMatchObject({
      status: 0,
      stdout: "spec-status: 0 findings across 0 docs (2 scanned)\n",
    });
  });

  it("an ADR with no lead paragraph reports nothing here: lead paragraphs are gated by eslint", () => {
    expect(run(noLeadAdr)).toMatchObject({ status: 0 });
  });

  it("three ADRs report one finding across one doc and exit 1", () => {
    const result = run(acceptedAdr, noLeadAdr, unreadableStatusAdr);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stdout).toBe(
      `${unreadableStatusAdr}:4: no lifecycle status the parsers can read\n` +
        "spec-status: 1 findings across 1 docs (3 scanned)\n"
    );
  });

  it("--coverage lists each unlinked statement and exits 0 under its own summary", () => {
    const result = run("--coverage", inProgressSpec, shippedSpec);

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toBe(
      `${inProgressSpec}:15: unlinked testable statement: ` +
        "A kite is sold whole, so a broken spar is replaced rather than sold on its own.\n" +
        `${shippedSpec}:15: unlinked testable statement: ` +
        "The spare lamp is lit before the return leg and never during the crossing.\n" +
        "spec-coverage: 2 unlinked testable statements across 2 docs (2 scanned)\n"
    );
  });

  it("--coverage exits 0 on a doc the default run fails", () => {
    expect(run("--coverage", unreadableStatusAdr)).toMatchObject({ status: 0 });
    expect(run(unreadableStatusAdr)).toMatchObject({ status: 1 });
  });

  it("--json prints only an array of findings carrying doc, line, kind and message", () => {
    const result = run("--json", unreadableStatusAdr);

    expect(result.stdout).not.toContain("spec-status:");
    expect(JSON.parse(result.stdout)).toEqual([
      {
        doc: unreadableStatusAdr,
        line: 4,
        kind: "untagged",
        message: "no lifecycle status the parsers can read",
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

  it("a doc path under neither specs nor adrs exits 2 rather than scanning it", () => {
    const result = run("README.md");

    expect(result).toMatchObject({ status: 2, stdout: "" });
    expect(result.stderr).toBe("check-spec-status.mjs: README.md is neither a spec nor an ADR\n");
  });

  it("a relative doc path resolves against the repo root, not the working directory", () => {
    expect(runFrom(tmpdir(), unreadableStatusAdr)).toMatchObject({
      status: 1,
      stdout: run(unreadableStatusAdr).stdout,
    });
  });

  it("an absolute doc path is scanned and reported repo-relative", () => {
    expect(runFrom(tmpdir(), join(root, unreadableStatusAdr))).toMatchObject({
      status: 1,
      stdout: run(unreadableStatusAdr).stdout,
    });
  });

  it("no doc paths scans the sorted specs directories followed by the sorted adrs", () => {
    expect(run().stdout).toBe(run(...discoveredDocs()).stdout);
  });
});
