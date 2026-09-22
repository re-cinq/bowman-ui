#!/usr/bin/env node
// Emits the Lore test-command `list` shape: a single JSON array of
// {id, name, file} objects, one per test, and nothing else on stdout.
// The suite is executed once with Vitest's Jest-compatible JSON reporter
// written to a temp file (running is the only way Vitest resolves every
// dynamic test name); vitest's own stdout is dropped and progress goes to
// stderr so stdout stays pure. The id is "<repo-relative-file>::<full test
// name>" - stable across runs, and exactly what the run command's
// {selector} splits back apart.
import { relative } from "node:path";
import process from "node:process";
import { collectVitestReport } from "./lib/vitest-report.mjs";

const { report } = collectVitestReport([], "ignore");
const tests = report.testResults.flatMap((suite) => {
  const file = relative(process.cwd(), suite.name);

  return suite.assertionResults.map((assertion) => ({
    id: `${file}::${assertion.fullName}`,
    name: assertion.fullName,
    file,
  }));
});

process.stdout.write(`${JSON.stringify(tests)}\n`);
