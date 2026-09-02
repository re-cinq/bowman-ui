#!/usr/bin/env node
// Issue 82: the tree-wide static import ban, enforced as a dependency
// allowlist. Every non-relative specifier in any import, re-export, dynamic
// import() or require() under src/ must resolve to a package declared in
// package.json (dependencies + peerDependencies, read at runtime); subpaths
// of a declared package count as the package. Anything else fails - which
// covers the original name blocklist (next, next-intl, swr, @clerk/*, the
// lucide-react icon library of docs/design-notes.md decision 2, the @/ path alias of
// docs/design-notes.md decision 5, and any other undeclared scoped package)
// without needing to enumerate names that a copy-paste could vary. This scan reads
// src/ only, so examples/rsc-fixture - the one path in the repo where next
// may appear, docs/design-notes.md § RSC fixture - is outside its scope by
// construction; the exemption changes nothing about this script.
//
// Static on top of, not instead of, the dynamic node_modules scan in
// scripts/consumer-app.sh: a grep misses a transitively pulled-in package,
// and a node_modules scan misses a source import a bundler tree-shakes away.
//
// Before scanning, the detector proves itself against the red fixture in
// tests/fixtures/forbidden-imports/: if any specifier the fixture carries
// stops tripping the allowlist, this script fails. An optional directory
// argument replaces src/ as the scan target (used by the tests).

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import ts from "typescript";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const allowedPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
]);

const isRelative = (specifier) => specifier.startsWith("./") || specifier.startsWith("../");

const packageNameOf = (specifier) => {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
};

const isAllowed = (specifier) =>
  isRelative(specifier) || allowedPackages.has(packageNameOf(specifier));

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

const listImports = (directory) => {
  const imports = [];
  for (const filePath of listSourceFiles(directory)) {
    const sourceFile = ts.createSourceFile(
      filePath,
      readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    for (const specifier of collectSpecifiers(sourceFile)) {
      imports.push({ file: relative(process.cwd(), filePath), specifier });
    }
  }
  return imports;
};

const findViolations = (directory) =>
  listImports(directory).filter((entry) => !isAllowed(entry.specifier));

const fixtureDirectory = "tests/fixtures/forbidden-imports";
const fixtureImports = listImports(fixtureDirectory);
const untrippedSpecifiers = fixtureImports.filter((entry) => isAllowed(entry.specifier));
if (fixtureImports.length === 0 || untrippedSpecifiers.length > 0) {
  const names = untrippedSpecifiers.map((entry) => entry.specifier).join(", ");
  process.stderr.write(
    `self-test failed: the red fixture in ${fixtureDirectory} carries specifiers ` +
      `the allowlist no longer trips: ${names || "(fixture is empty)"}\n`
  );
  process.exit(1);
}

const targetDirectory = process.argv[2] ?? "src";
const violations = findViolations(targetDirectory);
if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(
      `${violation.file}: forbidden import "${violation.specifier}" ` +
        `(not declared in package.json dependencies or peerDependencies)\n`
    );
  }
  process.exit(1);
}

process.stdout.write(`check-forbidden-imports: ${targetDirectory} is clean (self-test passed)\n`);
