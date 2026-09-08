// Local counterpart of lore's require-intro-paragraph and
// require-status-matches-coverage rules: a spec or ADR must open with a lead
// paragraph and declare a lifecycle status its own test links entitle it to
// claim. The statement-link half is a report, not a gate, and lives behind
// --coverage. Lead-paragraph, status and coverage verdicts come from the lore
// mirrors in tools/eslint-plugin-lore/rules/lib/ and tools/lore-shared/
// (docs/design-notes.md § Lint guardrails decision 11).

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { root } from "./lib/lore-domain.mjs";

const RULE_LIB = "../tools/eslint-plugin-lore/rules/lib";

const { docKind } = await import(`${RULE_LIB}/doc-kind.mjs`);
const { hasLeadParagraph } = await import(`${RULE_LIB}/intro-paragraph.mjs`);
const { statusMismatch } = await import(`${RULE_LIB}/status-coverage.mjs`);
const { unlinkedTestableStatements } = await import(`${RULE_LIB}/lore-shared.mjs`);

const USAGE =
  "usage: check-spec-status.mjs [--coverage] [--json] [doc-path ...]\n" +
  "doc paths resolve against the repo root, not the working directory; an absolute path is taken as given";

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const docArgs = args.filter((arg) => !arg.startsWith("--"));

const usageExit = () => {
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
};

for (const flag of flags) {
  if (flag === "--json" || flag === "--coverage") {
    continue;
  }
  usageExit();
}

const asJson = flags.includes("--json");
const asCoverage = flags.includes("--coverage");

const markdownIn = (dir) =>
  readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `${dir}/${entry.name}`)
    .sort();

const specDocs = () =>
  readdirSync(join(root, "specs"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `specs/${entry.name}/spec.md`)
    .sort();

const discoverDocs = () => [...specDocs(), ...markdownIn("adrs")];

const docPaths =
  docArgs.length > 0 ? docArgs.map((path) => relative(root, resolve(root, path))) : discoverDocs();

const readDoc = (docPath) => {
  try {
    return readFileSync(join(root, docPath), "utf8");
  } catch (error) {
    process.stderr.write(`cannot read doc ${docPath}: ${error.message}\n`);
    process.exit(2);
  }
};

// An ADR's finding anchors on the first line after its frontmatter, as lore's own region does.
const leadParagraphLine = (content, kind) => {
  const lines = content.split(/\r?\n/);

  if (kind !== "adr" || lines[0]?.trim() !== "---") {
    return 1;
  }
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  return closing === -1 ? 1 : closing + 2;
};

const statusFinding = (docPath, content, kind) => {
  const mismatch = statusMismatch(content, kind);

  if (mismatch === null) {
    return null;
  }

  if (mismatch.reason === "untagged") {
    return {
      doc: docPath,
      line: mismatch.line,
      kind: "untagged",
      message: "no lifecycle status the parsers can read",
    };
  }

  // ADRs are exempt from the tier verdict: lore folds `accepted` into `shipped`.
  if (kind === "adr") {
    return null;
  }

  return {
    doc: docPath,
    line: mismatch.line,
    kind: "tier",
    message:
      `status "${mismatch.actual}" does not match coverage: ` +
      `${mismatch.linked} of ${mismatch.testable} testable statements linked, ` +
      `expected "${mismatch.expected}"`,
  };
};

const statusFindings = (docPath, content, kind) => {
  const found = [];

  if (!hasLeadParagraph(content, kind)) {
    found.push({
      doc: docPath,
      line: leadParagraphLine(content, kind),
      kind: "lead-paragraph",
      message: "no lead paragraph before the first section",
    });
  }
  const status = statusFinding(docPath, content, kind);

  return status === null ? found : [...found, status];
};

const EXCERPT = 80;

const coverageFindings = (docPath, content) =>
  unlinkedTestableStatements(content).map((statement) => ({
    doc: docPath,
    line: statement.line,
    kind: "unlinked",
    message: `unlinked testable statement: ${statement.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, EXCERPT)}`,
  }));

const findings = [];
const docsWithFindings = new Set();

for (const docPath of docPaths) {
  const content = readDoc(docPath);
  const kind = docKind(docPath);

  if (kind === null) {
    process.stderr.write(`check-spec-status.mjs: ${docPath} is neither a spec nor an ADR\n`);
    process.exit(2);
  }
  const found = asCoverage
    ? coverageFindings(docPath, content)
    : statusFindings(docPath, content, kind);

  findings.push(...found);

  if (found.length > 0) {
    docsWithFindings.add(docPath);
  }
}

const summary = () => {
  const label = asCoverage ? "spec-coverage" : "spec-status";
  const counted = asCoverage
    ? `${findings.length} unlinked testable statements`
    : `${findings.length} findings`;

  return `${label}: ${counted} across ${docsWithFindings.size} docs (${docPaths.length} scanned)`;
};

const reportLines = () => [
  ...findings.map((finding) => `${finding.doc}:${finding.line}: ${finding.message}`),
  summary(),
];

// process.exitCode, not process.exit: exiting truncates a large piped write.
process.exitCode = asCoverage || findings.length === 0 ? 0 : 1;
process.stdout.write(
  asJson ? `${JSON.stringify(findings, null, 2)}\n` : `${reportLines().join("\n")}\n`
);
