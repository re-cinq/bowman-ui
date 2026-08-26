#!/usr/bin/env node
// Enforces CONTRACT.md decision 1: "use client" is per-file.
//
// Default mode (no argument):
//   1. Every .ts/.tsx under src/ that triggers a client-only rule must carry
//      "use client" as its first statement (leading comments and blank lines
//      allowed). The rules, measured off the AST (issue 137):
//        - a hook-shaped import: a named or default import whose imported or
//          local name matches /^use[A-Z]/, from any module specifier, or a
//          hook-shaped namespace-member reference such as React.useState
//        - a named import of createContext, or a namespace-member reference
//          such as React.createContext
//        - a class extending Component or PureComponent, bare or through a
//          namespace import
//        - a value-position reference to a measured browser global
//        - an on[A-Z] JSX attribute (an AST attribute node - the same name
//          inside a comment or string literal does not fire)
//   2. Every source file that carries the directive must have a dist/**/*.js
//      counterpart that opens with "use client"; as its first statement,
//      ignoring leading comments and blank lines.
//   3. src/index.ts carries no directive, and dist/index.js is a plain
//      re-export.
//
// Detection parses each file with ts.createSourceFile - names inside comments
// and string literals never fire, and export ... from re-exports (the barrel
// shape) are not references. Remaining imprecision points fail-safe: a
// shadowed browser-global name or a typeof window guard still triggers, which
// can only over-require the directive, never miss a real client boundary.
//
// With a directory argument, only check 1 runs against that directory - used
// by the fixture tests to prove each rule fires (and stays quiet) on its own.
//
// Exits non-zero listing every violation on stderr.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import ts from "typescript";

const HOOK_NAME = /^use[A-Z]/;
const JSX_HANDLER = /^on[A-Z]/;

// Measured with `node -e 'console.log(typeof <name>)'` probes: all eighteen
// are undefined on Node v20.19.5. On v22.23.2 (what CI's node-version: "22"
// resolves to today) navigator and WebSocket are defined - kept anyway as
// silent-divergence cases: a server render that reaches them throws nothing,
// which is exactly why the static check must carry them. DOM type names
// (HTMLElement, Element, Node, SVGSVGElement) are excluded outright: they are
// erased at compile time and appear all over server-safe code.
const BROWSER_GLOBALS = new Set([
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "matchMedia",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "IntersectionObserver",
  "ResizeObserver",
  "MutationObserver",
  "getComputedStyle",
  "alert",
  "history",
  "location",
  "WebSocket",
  "FileReader",
  "XMLHttpRequest",
]);

const scriptKindFor = (fileName) => {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
};

const parse = (fileName, source) =>
  ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKindFor(fileName));

const parseErrors = (sourceFile) =>
  (sourceFile.parseDiagnostics ?? []).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")
  );

const hasClientDirective = (sourceFile) => {
  const [first] = sourceFile.statements;
  return (
    first !== undefined &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === "use client"
  );
};

const importTriggers = (statement) => {
  const triggers = [];
  const clause = statement.importClause;
  if (clause === undefined || clause.isTypeOnly) return triggers;
  if (clause.name !== undefined && HOOK_NAME.test(clause.name.text)) {
    triggers.push(`imports ${clause.name.text} (hook-shaped import)`);
  }
  const bindings = clause.namedBindings;
  if (bindings === undefined || !ts.isNamedImports(bindings)) return triggers;
  for (const specifier of bindings.elements) {
    if (specifier.isTypeOnly) continue;
    const importedName = (specifier.propertyName ?? specifier.name).text;
    const localName = specifier.name.text;
    if (HOOK_NAME.test(importedName) || HOOK_NAME.test(localName)) {
      triggers.push(`imports ${importedName} (hook-shaped import)`);
      continue;
    }
    if (importedName === "createContext" || localName === "createContext") {
      triggers.push("imports createContext");
    }
  }
  return triggers;
};

const heritageName = (expression) => {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name)) {
    return expression.name.text;
  }
  return undefined;
};

const heritageTriggers = (node, sourceFile) => {
  const triggers = [];
  for (const clause of node.heritageClauses ?? []) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    for (const type of clause.types) {
      const name = heritageName(type.expression);
      if (name === "Component" || name === "PureComponent") {
        triggers.push(`extends ${type.expression.getText(sourceFile)} (class component)`);
      }
    }
  }
  return triggers;
};

const isValueReference = (identifier) => {
  const parent = identifier.parent;
  if (ts.isPropertyAccessExpression(parent)) return parent.expression === identifier;
  if (ts.isPropertyAssignment(parent)) return parent.initializer === identifier;
  if (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) {
    return parent.initializer === identifier;
  }
  if (
    ts.isFunctionDeclaration(parent) ||
    ts.isFunctionExpression(parent) ||
    ts.isClassDeclaration(parent) ||
    ts.isClassExpression(parent) ||
    ts.isMethodDeclaration(parent) ||
    ts.isMethodSignature(parent) ||
    ts.isPropertyDeclaration(parent) ||
    ts.isPropertySignature(parent) ||
    ts.isGetAccessor(parent) ||
    ts.isSetAccessor(parent) ||
    ts.isEnumMember(parent)
  ) {
    return parent.name !== identifier;
  }
  if (ts.isQualifiedName(parent) || ts.isJsxAttribute(parent)) return false;
  if (
    ts.isLabeledStatement(parent) ||
    ts.isBreakStatement(parent) ||
    ts.isContinueStatement(parent)
  ) {
    return false;
  }
  return true;
};

const collectTriggers = (sourceFile) => {
  const triggers = [];
  const visit = (node) => {
    if (
      ts.isTypeNode(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isExportDeclaration(node)
    ) {
      return;
    }
    if (ts.isHeritageClause(node)) {
      if (node.token !== ts.SyntaxKind.ExtendsKeyword) return;
      for (const type of node.types) {
        visit(type.expression);
      }
      return;
    }
    if (ts.isImportDeclaration(node)) {
      triggers.push(...importTriggers(node));
      return;
    }
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      triggers.push(...heritageTriggers(node, sourceFile));
    }
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && JSX_HANDLER.test(node.name.text)) {
      triggers.push(`has JSX handler ${node.name.text}`);
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
      if (HOOK_NAME.test(node.name.text)) {
        triggers.push(`references .${node.name.text} (hook-shaped member)`);
      }
      if (node.name.text === "createContext") {
        triggers.push(`references .${node.name.text} (createContext member)`);
      }
    }
    if (ts.isIdentifier(node) && BROWSER_GLOBALS.has(node.text) && isValueReference(node)) {
      triggers.push(`references browser global ${node.text}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...new Set(triggers)];
};

const walk = (dir, extensions) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walk(fullPath, extensions));
      continue;
    }
    if (extensions.some((extension) => entry.endsWith(extension))) {
      files.push(fullPath);
    }
  }
  return files;
};

const parsedFile = (file) => parse(file, readFileSync(file, "utf8"));

const checkSourceDirection = (dir) => {
  const violations = [];
  for (const file of walk(dir, [".ts", ".tsx"])) {
    const path = relative(process.cwd(), file);
    const sourceFile = parsedFile(file);
    const errors = parseErrors(sourceFile);
    if (errors.length > 0) {
      violations.push(`${path}: does not parse - ${errors[0]}`);
      continue;
    }
    const triggers = collectTriggers(sourceFile);
    if (triggers.length > 0 && !hasClientDirective(sourceFile)) {
      violations.push(
        `${path}: ${triggers.join(", ")} but "use client" is not its first statement`
      );
    }
  }
  return violations;
};

const checkBuiltDirection = (srcDir, distDir) => {
  const violations = [];
  for (const file of walk(srcDir, [".ts", ".tsx"])) {
    if (!hasClientDirective(parsedFile(file))) continue;
    const builtFile = join(distDir, relative(srcDir, file)).replace(/\.tsx?$/, ".js");
    if (!existsSync(builtFile)) {
      violations.push(`${relative(process.cwd(), builtFile)}: missing - run npm run build first`);
      continue;
    }
    if (!hasClientDirective(parsedFile(builtFile))) {
      violations.push(
        `${relative(process.cwd(), builtFile)}: built output does not open with "use client"; as its first statement`
      );
    }
  }
  return violations;
};

const isPlainReExport = (sourceFile) =>
  sourceFile.statements.every((statement) => ts.isExportDeclaration(statement));

const checkBarrel = (srcDir, distDir) => {
  const violations = [];
  const barrelSource = join(srcDir, "index.ts");
  if (existsSync(barrelSource) && hasClientDirective(parsedFile(barrelSource))) {
    violations.push('src/index.ts: the barrel must not carry "use client"');
  }
  const barrelBuilt = join(distDir, "index.js");
  if (!existsSync(barrelBuilt)) {
    violations.push("dist/index.js: missing - run npm run build first");
    return violations;
  }
  const built = parsedFile(barrelBuilt);
  if (hasClientDirective(built)) {
    violations.push('dist/index.js: the built barrel must not carry "use client"');
  }
  if (!isPlainReExport(built)) {
    violations.push("dist/index.js: the built barrel must be a plain re-export");
  }
  return violations;
};

const targetDir = process.argv[2];
const violations = [];

if (targetDir === undefined) {
  const srcDir = resolve(process.cwd(), "src");
  const distDir = resolve(process.cwd(), "dist");
  violations.push(...checkSourceDirection(srcDir));
  violations.push(...checkBuiltDirection(srcDir, distDir));
  violations.push(...checkBarrel(srcDir, distDir));
} else {
  violations.push(...checkSourceDirection(resolve(process.cwd(), targetDir)));
}

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(`${violation}\n`);
  }
  process.exit(1);
}
