#!/usr/bin/env node
// Emits the Lore test-command `list` shape: a single JSON array of
// {id, name, file} objects, one per test, and nothing else on stdout.
// The suite is executed once with Vitest's Jest-compatible JSON reporter
// written to a temp file (running is the only way Vitest resolves every
// dynamic test name); vitest's own stdout is dropped and progress goes to
// stderr so stdout stays pure. The id is "<repo-relative-file>::<full test
// name>" - stable across runs, and exactly what the run command's
// {selector} splits back apart. The full test name joins the describe titles
// and the test title with " > ", the separator Vitest's -t filter matches
// against (createTaskName); the reporter's own fullName joins them with a
// plain space, which -t never matches for a nested test (issue 183).
// --report <file> maps a report that already exists instead of building and
// running the suite again; CI feeds it the coverage gate's own report.
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import process from "node:process";
import { splitArgs } from "./lib/cli-args.mjs";
import { collectVitestReport } from "./lib/vitest-report.mjs";

const { flags, positional } = splitArgs(process.argv.slice(2));
const listOnly = flags.includes("--report");

if (flags.some((flag) => flag !== "--report") || positional.length !== (listOnly ? 1 : 0)) {
  process.stderr.write("usage: lore-list-tests.mjs [--report <vitest-json-report>]\n");
  process.exit(2);
}

const report = listOnly
  ? JSON.parse(readFileSync(positional[0], "utf8"))
  : collectVitestReport([], "ignore").report;
const vitestNameSeparator = " > ";
const tests = report.testResults.flatMap((suite) => {
  const file = relative(process.cwd(), suite.name);

  return suite.assertionResults.map((assertion) => {
    const name = [...assertion.ancestorTitles, assertion.title].join(vitestNameSeparator);

    return { id: `${file}::${name}`, name, file };
  });
});

process.stdout.write(`${JSON.stringify(tests)}\n`);
