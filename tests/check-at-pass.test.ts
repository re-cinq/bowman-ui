import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  expectUsageError,
  git,
  gitOut,
  runScript,
  writeInRepo as write,
  type RunResult,
} from "./helpers/script-runner.js";

const script = join(process.cwd(), "scripts", "check-at-pass.mjs");

const coveredPaths = ["src/components/ChatMessage.tsx", "src/components/ChatMessageList.tsx"];
const rowIds = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];

type Row = {
  id: string;
  stack: string;
  verdict: string;
  extra?: Readonly<Record<string, string>>;
};

const run = (repo: string, ...args: string[]): RunResult => runScript(script, args, { cwd: repo });

const defaultFields = (commit: string): Record<string, string> => ({
  date: "2026-08-31",
  runner: "Test Runner",
  commit,
  package: "@re-cinq/bowman-ui@0.1.0",
});

const defaultRows = (): Row[] =>
  rowIds.flatMap((id) => [
    { id, stack: "nvda", verdict: "pass" },
    { id, stack: "voiceover", verdict: "pass" },
  ]);

const renderRow = (row: Row): string =>
  [
    `  - id: ${row.id}`,
    `    stack: ${row.stack}`,
    `    verdict: ${row.verdict}`,
    ...Object.entries(row.extra ?? {}).map(([key, value]) => `    ${key}: ${value}`),
  ].join("\n");

type Stack = Readonly<Record<string, string>>;

const defaultStacks = (): Stack[] => [
  {
    id: "nvda",
    screenReader: "NVDA 2025.2",
    browser: "Firefox 142.0",
    platform: "Windows 11 24H2",
    voice: "eSpeak NG da",
  },
  {
    id: "voiceover",
    screenReader: "VoiceOver 26.1",
    browser: "Safari 26.1",
    platform: "macOS 26.1",
    voice: "Sara da-DK",
  },
];

const renderStack = (stack: Stack): string =>
  Object.entries(stack)
    .map(([key, value], index) => `${index === 0 ? "  - " : "    "}${key}: ${value}`)
    .join("\n");

const renderRecord = (
  fields: Record<string, string>,
  rows: Row[],
  stacks: Stack[] = defaultStacks()
): string =>
  [
    "---",
    ...Object.entries(fields).map(([key, value]) => `${key}: ${value}`),
    "covers:",
    ...coveredPaths.map((path) => `  - ${path}`),
    "stacks:",
    ...stacks.map(renderStack),
    "rows:",
    ...rows.map(renderRow),
    "---",
    "",
    "# Synthetic record built by tests/check-at-pass.test.ts. Not a compliance record.",
    "",
  ].join("\n");

// A repo whose components are committed first, so the record can name that
// commit and be fresh by construction; the record itself lands in a second
// commit on top.
const makeRepo = (): string => {
  const repo = mkdtempSync(join(tmpdir(), "check-at-pass-"));

  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.email", "test@example.test");
  git(repo, "config", "user.name", "Test");
  git(repo, "config", "commit.gpgsign", "false");

  for (const path of coveredPaths) {
    write(repo, path, "export const placeholderComponent = () => null;\n");
  }
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "components");

  return repo;
};

const componentsCommit = (repo: string): string => gitOut(repo, "rev-parse", "HEAD");

const commitRecord = (repo: string, content: string, name = "at-pass-2026-08-31.md") => {
  write(repo, `docs/accessibility/${name}`, content);
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", "record");
};

const validRecord = (repo: string): string =>
  renderRecord(defaultFields(componentsCommit(repo)), defaultRows());

describe("check-at-pass", () => {
  let repo: string;

  beforeEach(() => {
    repo = makeRepo();
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  const withRow = (id: string, stack: string, patch: Partial<Row>): Row[] =>
    defaultRows().map((row) => (row.id === id && row.stack === stack ? { ...row, ...patch } : row));

  const structureStderr = (rows: Row[], stacks: Stack[] = defaultStacks()): string => {
    commitRecord(repo, renderRecord(defaultFields(componentsCommit(repo)), rows, stacks));
    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 1 });

    return result.stderr;
  };

  it("--structure passes with a warning when no record exists", () => {
    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("no docs/accessibility/at-pass-*.md record yet");
    expect(result.stdout).toContain("first human screen-reader pass");
  });

  it("--freshness exits 1 when no record exists", () => {
    const result = run(repo, "--freshness");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("no docs/accessibility/at-pass-*.md record exists");
  });

  it("--structure and --freshness both pass on a complete, current record", () => {
    commitRecord(repo, validRecord(repo));

    expect(run(repo, "--structure")).toMatchObject({ status: 0 });
    const freshness = run(repo, "--freshness");

    expect(freshness).toMatchObject({ status: 0 });
    expect(freshness.stdout).toContain("covers the current tree");
  });

  it("a missing required field exits 1 naming the field", () => {
    const fields = defaultFields(componentsCommit(repo));

    delete fields.runner;
    commitRecord(repo, renderRecord(fields, defaultRows()));

    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("missing the required field `runner`");
  });

  it("a commit field that is not 40 hex exits 1", () => {
    commitRecord(repo, renderRecord(defaultFields("06037c3"), defaultRows()));

    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("must be a 40-hex commit sha");
  });

  it("a missing row verdict exits 1 naming the row and the stack", () => {
    expect(
      structureStderr(
        defaultRows().filter((row) => !(row.id === "A4" && row.stack === "voiceover"))
      )
    ).toContain("row A4 carries no verdict on stack voiceover");
  });

  it("a fail row naming neither a fixing issue nor an accepting person exits 1", () => {
    expect(structureStderr(withRow("A2", "nvda", { verdict: "fail" }))).toContain(
      "row A2 on stack nvda is `fail` without a `fixing-issue` or an `accepted-by`"
    );
  });

  it("a fail row naming a fixing issue passes", () => {
    const rows = defaultRows().map((row) =>
      row.id === "A2" && row.stack === "nvda"
        ? { ...row, verdict: "fail", extra: { "fixing-issue": "131-thinking-indicator-announced" } }
        : row
    );

    commitRecord(repo, renderRecord(defaultFields(componentsCommit(repo)), rows));

    expect(run(repo, "--structure")).toMatchObject({ status: 0 });
  });

  it("a record whose every stack is declared not-run exits 1", () => {
    const stacks: Stack[] = [
      { id: "nvda", screenReader: "NVDA", "not-run": "no Windows machine" },
      { id: "voiceover", screenReader: "VoiceOver", "not-run": "no macOS device" },
    ];
    const rows = defaultRows().map((row) => ({ ...row, verdict: "not-run" }));

    expect(structureStderr(rows, stacks)).toContain(
      "`stacks` must declare at least one stack that was actually run"
    );
  });

  it("not-run on a run stack's row without a reason exits 1", () => {
    expect(structureStderr(withRow("A1", "voiceover", { verdict: "not-run" }))).toContain(
      "is `not-run` without a `reason`"
    );
  });

  it("not-run on a run stack's row with a reason passes", () => {
    const rows = defaultRows().map((row) =>
      row.id === "A1" && row.stack === "voiceover"
        ? { ...row, verdict: "not-run", extra: { reason: "no macOS device with a Danish voice" } }
        : row
    );

    commitRecord(repo, renderRecord(defaultFields(componentsCommit(repo)), rows));

    expect(run(repo, "--structure")).toMatchObject({ status: 0 });
  });

  it("a waiver without waived-by and expires exits 1", () => {
    expect(structureStderr(withRow("A6", "nvda", { verdict: "waived" }))).toContain(
      "is `waived` without both `waived-by` and `expires`"
    );
  });

  it("an expired waiver exits 1 in both modes", () => {
    const rows = defaultRows().map((row) =>
      row.id === "A6" && row.stack === "nvda"
        ? {
            ...row,
            verdict: "waived",
            extra: { "waived-by": "Test Runner", expires: "2020-01-01" },
          }
        : row
    );

    commitRecord(repo, renderRecord(defaultFields(componentsCommit(repo)), rows));

    const structure = run(repo, "--structure");
    const freshness = run(repo, "--freshness");

    expect(structure).toMatchObject({ status: 1 });
    expect(structure.stderr).toContain("already past");
    expect(freshness).toMatchObject({ status: 1 });
  });

  it("an unexpired waiver carrying waived-by and expires passes", () => {
    const rows = defaultRows().map((row) =>
      row.id === "A6" && row.stack === "nvda"
        ? {
            ...row,
            verdict: "waived",
            extra: { "waived-by": "Test Runner", expires: "2099-01-01" },
          }
        : row
    );

    commitRecord(repo, renderRecord(defaultFields(componentsCommit(repo)), rows));

    expect(run(repo, "--structure")).toMatchObject({ status: 0 });
  });

  it("a placeholder left in the front matter exits 1", () => {
    commitRecord(
      repo,
      renderRecord({ ...defaultFields(componentsCommit(repo)), runner: "TBD" }, defaultRows())
    );

    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("still carries a placeholder");
  });

  it("a later commit to a covered path makes --freshness exit 1 naming both commits", () => {
    commitRecord(repo, validRecord(repo));
    const recordCommit = gitOut(repo, "rev-parse", "HEAD~1");

    write(repo, coveredPaths[1], "export const placeholderComponent = () => undefined;\n");
    git(repo, "add", "-A");
    git(repo, "commit", "-q", "-m", "edit a covered component");
    const editCommit = componentsCommit(repo);

    const structure = run(repo, "--structure");
    const freshness = run(repo, "--freshness");

    expect(structure).toMatchObject({ status: 0 });
    expect(freshness).toMatchObject({ status: 1 });
    expect(freshness.stderr).toContain(coveredPaths[1]);
    expect(freshness.stderr).toContain(editCommit);
    expect(freshness.stderr).toContain(recordCommit);
  });

  it("a covers path no commit touches makes --freshness exit 1", () => {
    const fields = defaultFields(componentsCommit(repo));
    const record = renderRecord(fields, defaultRows()).replace(
      coveredPaths[0],
      "src/components/NoSuchComponent.tsx"
    );

    commitRecord(repo, record);

    const result = run(repo, "--freshness");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("src/components/NoSuchComponent.tsx");
  });

  it("the newest record by filename is the one validated", () => {
    commitRecord(repo, validRecord(repo), "at-pass-2020-01-01.md");
    const fields = defaultFields(componentsCommit(repo));

    delete fields.package;
    commitRecord(repo, renderRecord(fields, defaultRows()), "at-pass-2026-08-31.md");

    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("at-pass-2026-08-31.md");
    expect(result.stderr).toContain("missing the required field `package`");
  });

  it("a filename date that lies about the front-matter date exits 1 in both modes, even next to a real record", () => {
    commitRecord(repo, validRecord(repo), "at-pass-2026-08-31.md");
    const fields = { ...defaultFields(componentsCommit(repo)), date: "2020-01-01" };

    commitRecord(repo, renderRecord(fields, defaultRows()), "at-pass-9999-99-99.md");

    const structure = run(repo, "--structure");
    const freshness = run(repo, "--freshness");

    expect(structure).toMatchObject({ status: 1 });
    expect(structure.stderr).toContain("at-pass-9999-99-99.md");
    expect(structure.stderr).toContain(
      "filename date `9999-99-99` does not match front matter `date: 2020-01-01`"
    );
    expect(freshness).toMatchObject({ status: 1 });
  });

  it("a third stack needs a verdict per row like any other", () => {
    const stacks: Stack[] = [
      ...defaultStacks(),
      {
        id: "jaws",
        screenReader: "JAWS 2025",
        browser: "Chrome 128",
        platform: "Windows 11",
        voice: "SAPI5",
      },
    ];

    expect(structureStderr(defaultRows(), stacks)).toContain(
      "row A1 carries no verdict on stack jaws"
    );
  });

  it("a stack entry without an id slug exits 1", () => {
    const stacks: Stack[] = [
      {
        screenReader: "NVDA 2025.2",
        browser: "Firefox 142.0",
        platform: "Windows 11",
        voice: "eSpeak",
      },
    ];

    expect(structureStderr(defaultRows(), stacks)).toContain("stacks[0] needs an `id` slug");
  });

  it("duplicate stack ids exit 1", () => {
    const stacks: Stack[] = [...defaultStacks(), { ...defaultStacks()[1], id: "nvda" }];

    expect(structureStderr(defaultRows(), stacks)).toContain(
      "`stacks` ids must be unique, found nvda, voiceover, nvda"
    );
  });

  it("a record with no front matter exits 1", () => {
    commitRecord(repo, "# Just a heading, no front matter\n");

    const result = run(repo, "--structure");

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("no `---` front-matter block");
  });

  it("no mode flag exits 2 with usage", () => {
    expectUsageError(run(repo));
  });

  it("an unknown flag exits 2 with usage", () => {
    expectUsageError(run(repo, "--frobnicate"));
  });

  it('a waiver with an expires of "never" exits 1', () => {
    expect(
      structureStderr(
        withRow("A6", "nvda", {
          verdict: "waived",
          extra: { "waived-by": "Test Runner", expires: "never" },
        })
      )
    ).toContain('is `waived` with an `expires` of "never", which is not YYYY-MM-DD');
  });

  const nvdaStack: Stack = {
    id: "nvda",
    screenReader: "NVDA 2025.2",
    browser: "Firefox 142.0",
    platform: "Windows 11 24H2",
    voice: "eSpeak NG en-GB",
  };
  const voiceoverNotRunStacks = (): Stack[] => [
    nvdaStack,
    { id: "voiceover", screenReader: "VoiceOver", "not-run": "no macOS device in this window" },
  ];
  const voiceoverRowsNotRun = (): Row[] =>
    defaultRows().map((row) => (row.stack === "voiceover" ? { ...row, verdict: "not-run" } : row));

  it("a stack declared not-run needs no versions when every row on it is not-run", () => {
    commitRecord(
      repo,
      renderRecord(
        defaultFields(componentsCommit(repo)),
        voiceoverRowsNotRun(),
        voiceoverNotRunStacks()
      )
    );

    expect(run(repo, "--structure")).toMatchObject({ status: 0 });
  });

  it("a pass row on a stack declared not-run exits 1", () => {
    const rows = voiceoverRowsNotRun().map((row) =>
      row.id === "A3" && row.stack === "voiceover" ? { ...row, verdict: "pass" } : row
    );

    expect(structureStderr(rows, voiceoverNotRunStacks())).toContain(
      "row A3 on stack voiceover must be `not-run`: that stack itself is marked not-run"
    );
  });

  it("a single stack that was run is a complete record", () => {
    const stacks: Stack[] = [
      {
        id: "orca",
        screenReader: "Orca 47.1",
        browser: "Firefox 142.0",
        platform: "Fedora 42",
        voice: "espeak-ng en",
      },
    ];
    const rows = rowIds.map((id) => ({ id, stack: "orca", verdict: "pass" }));

    commitRecord(repo, renderRecord(defaultFields(componentsCommit(repo)), rows, stacks));

    expect(run(repo, "--structure")).toMatchObject({ status: 0 });
  });
});
