import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expectUsageError, scriptRunner } from "./helpers/script-runner.js";

const script = join(process.cwd(), "scripts", "lore-list-tests.mjs");
const { run } = scriptRunner(script);

const npmStub = `#!/usr/bin/env bash
echo "npm $*" >> "$STUB_LOG"
`;

const npxStub = `#!/usr/bin/env bash
echo "npx $*" >> "$STUB_LOG"
for arg in "$@"; do
  case "$arg" in
    --outputFile=*) printf '%s' "$STUB_REPORT" > "\${arg#--outputFile=}" ;;
  esac
done
`;

const writeStub = (binDir: string, name: string, body: string): void => {
  writeFileSync(join(binDir, name), body);
  chmodSync(join(binDir, name), 0o755);
};

const writeReport = (testResults: unknown[]): string => {
  const reportFile = join(mkdtempSync(join(tmpdir(), "lore-list-tests-")), "report.json");

  writeFileSync(reportFile, JSON.stringify({ testResults }));

  return reportFile;
};

describe("lore-list-tests --report", () => {
  it("maps every assertion to {id, name, file} joining describe titles with ' > '", () => {
    const reportFile = writeReport([
      {
        name: join(process.cwd(), "tests/Alpha.test.tsx"),
        assertionResults: [
          { ancestorTitles: ["Alpha"], title: "renders the title" },
          { ancestorTitles: ["Alpha", "nested"], title: "handles a click" },
        ],
      },
      {
        name: join(process.cwd(), "tests/beta-dist.test.ts"),
        assertionResults: [{ ancestorTitles: [], title: "dist ships styles.css" }],
      },
    ]);

    const result = run("--report", reportFile);

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(result.stdout.endsWith("\n")).toBe(true);
    expect(JSON.parse(result.stdout)).toEqual([
      {
        id: "tests/Alpha.test.tsx::Alpha > renders the title",
        name: "Alpha > renders the title",
        file: "tests/Alpha.test.tsx",
      },
      {
        id: "tests/Alpha.test.tsx::Alpha > nested > handles a click",
        name: "Alpha > nested > handles a click",
        file: "tests/Alpha.test.tsx",
      },
      {
        id: "tests/beta-dist.test.ts::dist ships styles.css",
        name: "dist ships styles.css",
        file: "tests/beta-dist.test.ts",
      },
    ]);
  });

  it("emits an empty array for a report with no suites", () => {
    const result = run("--report", writeReport([]));

    expect(result).toMatchObject({ status: 0, stdout: "[]\n", stderr: "" });
  });

  it("without --report builds, runs the suite to a temp report, maps it and removes the report", () => {
    const workDir = realpathSync(mkdtempSync(join(tmpdir(), "lore-list-tests-")));
    const binDir = join(workDir, "bin");
    const logFile = join(workDir, "calls.log");

    mkdirSync(binDir);
    writeStub(binDir, "npm", npmStub);
    writeStub(binDir, "npx", npxStub);

    const result = spawnSync(process.execPath, [script], {
      cwd: workDir,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        STUB_LOG: logFile,
        STUB_REPORT: JSON.stringify({
          testResults: [
            {
              name: join(workDir, "tests/Stub.test.ts"),
              assertionResults: [{ ancestorTitles: [], title: "stub passes" }],
            },
          ],
        }),
      },
    });

    expect(result).toMatchObject({ status: 0, stderr: "" });
    expect(JSON.parse(result.stdout)).toEqual([
      { id: "tests/Stub.test.ts::stub passes", name: "stub passes", file: "tests/Stub.test.ts" },
    ]);

    const calls = readFileSync(logFile, "utf8");
    const reportFile = /--outputFile=(\S+)/.exec(calls)?.[1];

    expect(calls).toMatch(/^npm run build\nnpx vitest run --reporter=json --outputFile=\S+\n$/);
    expect(reportFile && existsSync(reportFile)).toBe(false);
  });

  it("exits 2 with usage on an unknown flag", () => {
    expectUsageError(run("--bogus"));
  });

  it("exits 2 with usage when --report names no file", () => {
    expectUsageError(run("--report"));
  });
});
