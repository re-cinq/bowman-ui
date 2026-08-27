#!/usr/bin/env node
// Issue 82: the tree-wide static import ban. Fails when any file under src/
// imports the auth SDK (@clerk/*), the data-fetching library (swr), the i18n
// library (next-intl), the meta-framework (next, next/*), an internal
// source-app package (@discovery/*), the banned icon library (lucide-react,
// CONTRACT.md decision 2), or a path alias (@/*, CONTRACT.md decision 5).
// lucide-react and @/* are deliberate supersets of the issue's list.
//
// Static on top of, not instead of, the dynamic node_modules scan in
// scripts/consumer-app.sh: a grep misses a transitively pulled-in package,
// and a node_modules scan misses a source import a bundler tree-shakes away.
//
// Before scanning src/, the detector proves itself against the red fixture in
// tests/fixtures/forbidden-imports/: if the fixture stops tripping every
// banned specifier it carries, this script fails.

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import ts from "typescript";

const FORBIDDEN = [
  { specifier: "next", reason: "meta-framework" },
  { specifier: "next-intl", reason: "i18n runtime" },
  { specifier: "swr", reason: "data-fetching library" },
  { specifier: "lucide-react", reason: "banned icon library (CONTRACT.md decision 2)" },
  { prefix: "@clerk/", reason: "auth SDK" },
  { prefix: "@discovery/", reason: "internal source-app package" },
  { prefix: "@/", reason: "path alias (CONTRACT.md decision 5)" },
];

const matchForbidden = (specifier) =>
  FORBIDDEN.find((entry) => {
    if (entry.prefix !== undefined) {
      return specifier.startsWith(entry.prefix);
    }
    return specifier === entry.specifier || specifier.startsWith(`${entry.specifier}/`);
  });

const collectSpecifiers = (sourceFile) => {
  const specifiers = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
};

const listSourceFiles = (directory) => {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

const scanDirectory = (directory) => {
  const violations = [];
  for (const filePath of listSourceFiles(directory)) {
    const sourceFile = ts.createSourceFile(
      filePath,
      readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    for (const specifier of collectSpecifiers(sourceFile)) {
      const match = matchForbidden(specifier);
      if (match !== undefined) {
        violations.push({
          file: relative(process.cwd(), filePath),
          specifier,
          reason: match.reason,
        });
      }
    }
  }
  return violations;
};

const fixtureDirectory = "tests/fixtures/forbidden-imports";
const fixtureViolations = scanDirectory(fixtureDirectory);
if (fixtureViolations.length < FORBIDDEN.length) {
  process.stderr.write(
    `self-test failed: the red fixture in ${fixtureDirectory} tripped ` +
      `${fixtureViolations.length} of ${FORBIDDEN.length} banned patterns\n`
  );
  process.exit(1);
}

const violations = scanDirectory("src");
if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(
      `${violation.file}: forbidden import "${violation.specifier}" (${violation.reason})\n`
    );
  }
  process.exit(1);
}

process.stdout.write("check-forbidden-imports: src/ is clean (self-test passed)\n");
