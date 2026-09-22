// Local counterpart of lore's spec-coverage-validate job: a `([validated by](...))`
// link only counts when it sits in its statement's trailing parenthetical, so a
// link anywhere else is reported here rather than silently dropped upstream.
// Segmentation and link parsing are lore's own, published as the spec domain
// of @re-cinq/eslint-plugin-re-lint (docs/design-notes.md § Lint guardrails
// decision 10).

import { relative, resolve } from "node:path";
import process from "node:process";
import { findMisplacedCoverageLinks } from "@re-cinq/eslint-plugin-re-lint/spec/spec-link-parser.js";
import { segmentStatements } from "@re-cinq/eslint-plugin-re-lint/spec/spec-segment.js";
import { emitReport, parseFlags } from "./lib/cli-args.mjs";
import { root } from "./lib/repo-root.mjs";
import { listSpecDocs, readRepoFileOrExit } from "./lib/spec-corpus.mjs";

const USAGE =
  "usage: check-spec-links.mjs [--json] [spec-path ...]\n" +
  "spec paths resolve against the repo root, not the working directory; an absolute path is taken as given";

const { flags, positional: specArgs } = parseFlags(process.argv.slice(2), ["--json"], USAGE);
const asJson = flags.includes("--json");

const specPaths =
  specArgs.length > 0
    ? specArgs.map((path) => relative(root, resolve(root, path)))
    : listSpecDocs(root, { includeSystemSpec: true });

const findings = [];
const specsWithFindings = new Set();
let statementsScanned = 0;

for (const specPath of specPaths) {
  const content = readRepoFileOrExit(root, specPath, "spec");

  for (const statement of segmentStatements(content)) {
    statementsScanned += 1;

    for (const link of findMisplacedCoverageLinks(statement.text)) {
      findings.push({
        spec: specPath,
        line: statement.line ?? null,
        path: link.path,
        anchorLine: link.line,
        label: link.label,
        statement: statement.text,
      });
      specsWithFindings.add(specPath);
    }
  }
}

const reportLines = () => {
  const lines = findings.map((finding) => {
    const anchor = finding.anchorLine === null ? "" : `#L${finding.anchorLine}`;
    const line = finding.line ?? "?";

    return `${finding.spec}:${line}: ${finding.path}${anchor} cited outside the statement's trailing parenthetical`;
  });

  lines.push(
    `misplaced: ${findings.length} across ${specsWithFindings.size} specs (${statementsScanned} statements scanned)`
  );

  return lines;
};

emitReport({ asJson, findings, lines: reportLines, exitCode: findings.length > 0 ? 1 : 0 });
