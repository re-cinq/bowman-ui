#!/usr/bin/env node
// Issue 213: the source-invariant markdown-safety gate. It greps the source -
// it never renders markdown - and fails the build when the one change that
// would void the whole XSS corpus (tests/security/markdown-xss.test.tsx)
// lands: raw HTML rendering is re-enabled, the image gate's default is
// flipped, or a dangerous scheme is admitted to the default allowlist.
//
// The load-bearing invariant, stated where a future maintainer will see it:
// bowman-ui never adds rehype-raw or otherwise renders raw HTML from entry
// content - the moment it does, every guarantee in the corpus is void.
//
// Standing invariants enforced (all read as text, none executed):
//   1. rehype-raw appears nowhere in package.json.
//   2. No file under src/ mentions rehype, imports remark-html, sets
//      dangerouslySetInnerHTML, or re-enables raw HTML via skipHtml={false}.
//   3. defaultMarkdownPolicy.allowImages is literally false.
//   4. defaultMarkdownPolicy.allowedSchemes is declared once as an inline array
//      of quoted string literals without escape sequences (so the gate reads
//      the runtime value) admitting none of javascript / data / vbscript / file.
//      The key matches bare or quoted, never as the suffix of a longer name.
//
// Runs against process.cwd() by default; a directory argument points it at
// another tree so the corpus test can prove it trips on crafted bad inputs and
// stays green on the clean tree. Exits 1 listing every violation on stderr,
// 2 when the tree it is pointed at has no package.json or policy file.

import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import { listSourceFiles } from "./lib/list-source-files.mjs";

const SRC_TOKENS = [
  { pattern: /rehype/, reason: "src/ mentions rehype (raw-HTML rendering is forbidden)" },
  {
    pattern: /dangerouslySetInnerHTML/,
    reason: "src/ uses dangerouslySetInnerHTML (raw-HTML injection)",
  },
  { pattern: /remark-html/, reason: "src/ imports remark-html (raw-HTML rendering)" },
  {
    pattern: /skipHtml\s*=\s*\{?\s*false/,
    reason: "src/ sets skipHtml={false} (re-enables raw-HTML rendering)",
  },
];

const BANNED_SCHEMES = ["javascript", "data", "vbscript", "file"];

const scanSource = (root) => {
  const srcDir = join(root, "src");

  if (!existsSync(srcDir)) {
    return [];
  }
  const violations = [];

  for (const filePath of listSourceFiles(srcDir)) {
    const content = readFileSync(filePath, "utf8");

    for (const token of SRC_TOKENS) {
      if (token.pattern.test(content)) {
        violations.push(`${relative(root, filePath)}: ${token.reason}`);
      }
    }
  }

  return violations;
};

const scanPackageJson = (root) => {
  const path = join(root, "package.json");

  if (!existsSync(path)) {
    return { fatal: `package.json not found in ${root}` };
  }
  const content = readFileSync(path, "utf8");

  return { violations: /rehype-raw/.test(content) ? ["package.json declares rehype-raw"] : [] };
};

const QUOTED_LITERAL = /["']([^"']*)["']/g;

const SCHEMES_KEY = String.raw`(?<![\w$])["']?allowedSchemes["']?\s*:`;

const SCHEMES_KEYS = new RegExp(SCHEMES_KEY, "g");

const ALLOWED_SCHEMES_ARRAY = new RegExp(
  String.raw`${SCHEMES_KEY}\s*(?:Object\.freeze\(\s*)?\[([^\]]*)\]\s*(?:as const\s*)?\)?\s*[,}]`
);

const isInlineStringArray = (list) => list.replace(QUOTED_LITERAL, "").replace(/[\s,]/g, "") === "";

const defaultPolicyBlock = (source) => {
  const match = source.match(/defaultMarkdownPolicy[\s\S]*?\}\)/);

  return match === null ? undefined : match[0];
};

const scanPolicy = (root) => {
  const path = join(root, "src", "markdown", "urlPolicy.ts");

  if (!existsSync(path)) {
    return { fatal: `src/markdown/urlPolicy.ts not found in ${root}` };
  }
  const block = defaultPolicyBlock(readFileSync(path, "utf8"));

  if (block === undefined) {
    return { fatal: "defaultMarkdownPolicy declaration not found in src/markdown/urlPolicy.ts" };
  }
  const violations = [];
  const allowImages = block.match(/allowImages:\s*(true|false)/);

  if (allowImages === null || allowImages[1] !== "false") {
    violations.push("defaultMarkdownPolicy.allowImages must be literally false");
  }
  const declaredOnce = (block.match(SCHEMES_KEYS) ?? []).length === 1;
  const list = declaredOnce ? block.match(ALLOWED_SCHEMES_ARRAY)?.[1] : undefined;

  if (!declaredOnce) {
    violations.push("defaultMarkdownPolicy.allowedSchemes must be declared exactly once");
  } else if (list === undefined || !isInlineStringArray(list)) {
    violations.push(
      "defaultMarkdownPolicy.allowedSchemes must be an inline array of quoted string literals"
    );
  } else if (list.includes("\\")) {
    violations.push("defaultMarkdownPolicy.allowedSchemes must not contain escape sequences");
  }
  const declared = [...(list ?? "").matchAll(QUOTED_LITERAL)].map((m) => m[1].toLowerCase());

  for (const banned of BANNED_SCHEMES) {
    if (declared.includes(banned)) {
      violations.push(
        `defaultMarkdownPolicy.allowedSchemes admits the dangerous scheme "${banned}"`
      );
    }
  }

  return { violations };
};

const root = process.argv[2] === undefined ? process.cwd() : resolve(process.argv[2]);
const pkg = scanPackageJson(root);
const policy = scanPolicy(root);
const fatal = pkg.fatal ?? policy.fatal;

if (fatal !== undefined) {
  process.stderr.write(`check-markdown-safety: ${fatal}\n`);
  process.exit(2);
}

const violations = [...(pkg.violations ?? []), ...scanSource(root), ...(policy.violations ?? [])];

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(`${violation}\n`);
  }
  process.exit(1);
}

process.stdout.write("check-markdown-safety: markdown pipeline invariants hold\n");
