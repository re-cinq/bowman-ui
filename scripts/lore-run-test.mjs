#!/usr/bin/env node
// Runs one slice of the suite for the Lore test-command interface and prints
// its lcov coverage to stdout. Two callers pass two shapes of {selector}, so
// both are accepted:
//
//   "<file>::<full test name>" - one test, as lore-list-tests.mjs emits it and
//     the interactive interface (lore_run_test) passes it. The name is the
//     describe titles and the test title joined with " > ", the form Vitest's
//     -t flag matches against. -t is a regex, so the name is escaped and
//     anchored - a name containing {500} or (parens) must match literally.
//     Both halves stay filters, not identities: the file is a path substring
//     and two tests can share one full name (a describe "a" holding "b > c"
//     and a top-level "a > b > c"), so anything but exactly one test running
//     is a failure, never a silent skipped-suite success or a green run of the
//     wrong test.
//
//   "<file>" - the whole file, which is what the lore-code-trace binary passes:
//     it groups the listed tests by file and runs this command once per file,
//     attributing the file's result to every test in it. A file that runs no
//     test at all is still a failure, for the same reason the per-test mode
//     rejects a zero match.
//
// Per the project-test-interface contract, a `coverage_format: lcov` entry must
// emit "the coverage report on stdout", and the binary parses coverage from
// stdout alone - so stdout carries the lcov and nothing else, with Vitest's own
// chatter sent to stderr. Coverage is written to a per-invocation directory
// because the binary runs four of these at once and they would otherwise
// overwrite one shared coverage/lcov.info, attributing one file's coverage to
// another. The lcov is printed even when the run fails: the contract reads the
// exit code as pass/fail and parses the report either way.
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { collectVitestReport, readIfPresent } from "./lib/vitest-report.mjs";

const selector = process.argv[2];

if (!selector) {
  process.stderr.write('usage: lore-run-test.mjs "<file>::<full test name>" | "<file>"\n');
  process.exit(2);
}

const separator = selector.indexOf("::");
const wholeFile = separator === -1;
const file = wholeFile ? selector : selector.slice(0, separator);
const name = wholeFile ? "" : selector.slice(separator + 2);
const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nameFilter = wholeFile ? [] : ["-t", `^${escaped}$`];

const coverageDir = mkdtempSync(join(tmpdir(), "bowman-ui-lcov-"));

let result;

try {
  result = collectVitestReport(
    [
      file,
      ...nameFilter,
      "--reporter=verbose",
      "--coverage.enabled",
      "--coverage.reporter=lcovonly",
      `--coverage.reportsDirectory=${coverageDir}`,
      "--coverage.thresholds.lines=0",
      "--coverage.thresholds.functions=0",
      "--coverage.thresholds.statements=0",
      "--coverage.thresholds.branches=0",
    ],
    // Vitest's summary belongs on stderr; stdout is reserved for the lcov.
    process.stderr.fd
  );
  process.stdout.write(readIfPresent(join(coverageDir, "lcov.info")));
} finally {
  rmSync(coverageDir, { recursive: true, force: true });
}

const { report, failed } = result;
const ran = report.numTotalTests - (report.numPendingTests ?? 0);

if (wholeFile ? ran < 1 : ran !== 1) {
  const expected = wholeFile ? "at least 1" : "1";

  process.stderr.write(`selector matched ${ran} tests, expected ${expected}: ${selector}\n`);
  process.exit(1);
}
process.exit(failed || report.numFailedTests > 0 ? 1 : 0);
