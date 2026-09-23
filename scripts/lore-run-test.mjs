#!/usr/bin/env node
// Runs exactly one test for the Lore test-command interface. The selector is
// "<repo-relative-file>::<full test name>" as emitted by lore-list-tests.mjs,
// the name being the describe titles and the test title joined with " > " -
// the form Vitest's -t flag matches against. -t is a regex, so the name is
// escaped and anchored - a name containing {500} or (parens) must match
// literally. Both halves stay filters, not identities: the file is a path
// substring and two tests can share one full name (a describe "a" holding
// "b > c" and a top-level "a > b > c"), so anything but exactly one test
// running is a failure, never a silent skipped-suite success or a green run
// of the wrong test.
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

if (ran !== 1) {
  process.stderr.write(`selector matched ${ran} tests, expected 1: ${selector}\n`);
  process.exit(1);
}
process.exit(failed || report.numFailedTests > 0 ? 1 : 0);
