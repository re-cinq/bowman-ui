#!/usr/bin/env node
// Emits the Lore test-command `list` shape: a single JSON array of
// {id, name, file} objects, one per test, and nothing else on stdout.
// The suite is executed once with Vitest's Jest-compatible JSON reporter
// written to a temp file (running is the only way Vitest resolves every
// dynamic test name); progress output goes to stderr so stdout stays pure.
// The id is "<repo-relative-file>::<full test name>" - stable across runs,
// and exactly what the run command's {selector} splits back apart.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import process from "node:process";

const reportFile = join(tmpdir(), `bowman-ui-vitest-report-${process.pid}.json`);

// Build first: tests/public-api.test.ts reads dist/ at collection time, so in
// a clean checkout its tests would silently vanish from the list without this.
execFileSync("npm", ["run", "build"], {
  cwd: process.cwd(),
  stdio: ["ignore", "ignore", "inherit"],
});

try {
  execFileSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${reportFile}`], {
    cwd: process.cwd(),
    stdio: ["ignore", "ignore", "inherit"],
  });
} catch {
  // A failing test still produces a full report; listing must not depend on
  // the suite being green. A missing report file below is the real failure.
}

const report = JSON.parse(readFileSync(reportFile, "utf8"));
const tests = report.testResults.flatMap((suite) => {
  const file = relative(process.cwd(), suite.name);
  return suite.assertionResults.map((assertion) => ({
    id: `${file}::${assertion.fullName}`,
    name: assertion.fullName,
    file,
  }));
});

rmSync(reportFile, { force: true });
process.stdout.write(`${JSON.stringify(tests)}\n`);
