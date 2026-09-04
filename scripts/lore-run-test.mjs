#!/usr/bin/env node
// Runs exactly one test for the Lore test-command interface. The selector is
// "<repo-relative-file>::<full test name>" as emitted by lore-list-tests.mjs.
// Vitest's -t flag is a regex, so the name is escaped and anchored - a name
// containing {500} or (parens) must match literally, and a selector that
// matches nothing is a failure, never a silent skipped-suite success.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

const selector = process.argv[2];

if (!selector || !selector.includes("::")) {
  process.stderr.write('usage: lore-run-test.mjs "<file>::<full test name>"\n');
  process.exit(2);
}
const separator = selector.indexOf("::");
const file = selector.slice(0, separator);
const name = selector.slice(separator + 2);
const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const reportFile = join(tmpdir(), `bowman-ui-vitest-run-${process.pid}.json`);

execFileSync("npm", ["run", "build"], {
  cwd: process.cwd(),
  stdio: ["ignore", "ignore", "inherit"],
});

let runFailed = false;

try {
  execFileSync(
    "npx",
    [
      "vitest",
      "run",
      file,
      "-t",
      `^${escaped}$`,
      "--reporter=verbose",
      "--reporter=json",
      `--outputFile=${reportFile}`,
      "--coverage.enabled",
      "--coverage.reporter=lcov",
      "--coverage.thresholds.lines=0",
      "--coverage.thresholds.functions=0",
      "--coverage.thresholds.statements=0",
      "--coverage.thresholds.branches=0",
    ],
    { cwd: process.cwd(), stdio: ["ignore", "inherit", "inherit"] },
  );
} catch {
  runFailed = true;
}

const report = JSON.parse(readFileSync(reportFile, "utf8"));

rmSync(reportFile, { force: true });

const ran = report.numTotalTests - (report.numPendingTests ?? 0);

if (ran === 0) {
  process.stderr.write(`selector matched no test: ${selector}\n`);
  process.exit(1);
}
process.exit(runFailed || report.numFailedTests > 0 ? 1 : 0);
