#!/usr/bin/env node
// Enforces CONTRACT.md decision 1: "use client" is per-file.
//
// Default mode (no argument):
//   1. Every .ts/.tsx under src/ that references a client-only React API or an
//      on[A-Z] JSX handler must carry "use client" as its first statement
//      (leading comments and blank lines allowed).
//   2. Every source file that carries the directive must have a dist/**/*.js
//      counterpart that opens with "use client"; as its first statement,
//      ignoring leading comments and blank lines.
//   3. src/index.ts carries no directive, and dist/index.js is a plain
//      re-export.
//
// Detection is textual, not AST-based: a client-API name or on[A-Z]= pattern
// inside a comment or string literal counts as a reference. That direction is
// fail-safe (it can only over-require the directive, never miss a real client
// boundary); issue 128 widens and hardens this check later.
//
// With a directory argument, only check 1 runs against that directory - used
// by the red-fixture test to prove the check catches the real case.
//
// Exits non-zero listing every violation on stderr.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";

const CLIENT_API =
  /\b(useState|useEffect|useRef|useCallback|useMemo|useReducer|useContext|useLayoutEffect|useSyncExternalStore|createContext)\b/;
const JSX_HANDLER = /\bon[A-Z][A-Za-z]*=\s*[{"']/;
const DIRECTIVE = /^(['"])use client\1\s*;?/;

const stripLeadingTrivia = (source) => {
  let rest = source;
  for (;;) {
    const trimmed = rest.replace(/^\s+/, "");
    if (trimmed.startsWith("//")) {
      const lineEnd = trimmed.indexOf("\n");
      if (lineEnd === -1) return "";
      rest = trimmed.slice(lineEnd + 1);
      continue;
    }
    if (trimmed.startsWith("/*")) {
      const blockEnd = trimmed.indexOf("*/");
      if (blockEnd === -1) return "";
      rest = trimmed.slice(blockEnd + 2);
      continue;
    }
    return trimmed;
  }
};

const hasDirectiveAsFirstStatement = (source) => DIRECTIVE.test(stripLeadingTrivia(source));

const usesClientOnlyApi = (source) => CLIENT_API.test(source) || JSX_HANDLER.test(source);

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

const checkSourceDirection = (dir) => {
  const violations = [];
  for (const file of walk(dir, [".ts", ".tsx"])) {
    const source = readFileSync(file, "utf8");
    if (usesClientOnlyApi(source) && !hasDirectiveAsFirstStatement(source)) {
      violations.push(
        `${relative(process.cwd(), file)}: references a client-only React API or JSX handler but "use client" is not its first statement`
      );
    }
  }
  return violations;
};

const checkBuiltDirection = (srcDir, distDir) => {
  const violations = [];
  for (const file of walk(srcDir, [".ts", ".tsx"])) {
    const source = readFileSync(file, "utf8");
    if (!hasDirectiveAsFirstStatement(source)) continue;
    const builtFile = join(distDir, relative(srcDir, file)).replace(/\.tsx?$/, ".js");
    if (!existsSync(builtFile)) {
      violations.push(`${relative(process.cwd(), builtFile)}: missing - run npm run build first`);
      continue;
    }
    if (!hasDirectiveAsFirstStatement(readFileSync(builtFile, "utf8"))) {
      violations.push(
        `${relative(process.cwd(), builtFile)}: built output does not open with "use client"; as its first statement`
      );
    }
  }
  return violations;
};

const isPlainReExport = (source) => {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const statements = withoutComments
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
  return statements.every((statement) => statement.startsWith("export"));
};

const checkBarrel = (srcDir, distDir) => {
  const violations = [];
  const barrelSource = join(srcDir, "index.ts");
  if (
    existsSync(barrelSource) &&
    hasDirectiveAsFirstStatement(readFileSync(barrelSource, "utf8"))
  ) {
    violations.push('src/index.ts: the barrel must not carry "use client"');
  }
  const barrelBuilt = join(distDir, "index.js");
  if (!existsSync(barrelBuilt)) {
    violations.push("dist/index.js: missing - run npm run build first");
    return violations;
  }
  const built = readFileSync(barrelBuilt, "utf8");
  if (hasDirectiveAsFirstStatement(built)) {
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
