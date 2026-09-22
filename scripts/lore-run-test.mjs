#!/usr/bin/env node
// Runs exactly one test for the Lore test-command interface. The selector is
// "<repo-relative-file>::<full test name>" as emitted by lore-list-tests.mjs.
// Vitest's -t flag is a regex, so the name is escaped and anchored - a name
// containing {500} or (parens) must match literally, and a selector that
// matches nothing is a failure, never a silent skipped-suite success.
import process from "node:process";
import { collectVitestReport } from "./lib/vitest-report.mjs";

const selector = process.argv[2];

if (!selector || !selector.includes("::")) {
  process.stderr.write('usage: lore-run-test.mjs "<file>::<full test name>"\n');
  process.exit(2);
}
const separator = selector.indexOf("::");
const file = selector.slice(0, separator);
const name = selector.slice(separator + 2);
const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const { report, failed } = collectVitestReport(
  [
    file,
    "-t",
    `^${escaped}$`,
    "--reporter=verbose",
    "--coverage.enabled",
    "--coverage.reporter=lcov",
    "--coverage.thresholds.lines=0",
    "--coverage.thresholds.functions=0",
    "--coverage.thresholds.statements=0",
    "--coverage.thresholds.branches=0",
  ],
  "inherit"
);

const ran = report.numTotalTests - (report.numPendingTests ?? 0);

if (ran === 0) {
  process.stderr.write(`selector matched no test: ${selector}\n`);
  process.exit(1);
}
process.exit(failed || report.numFailedTests > 0 ? 1 : 0);
