#!/usr/bin/env node
// Issue 213: the source-invariant markdown-safety gate. It greps the source -
// it never renders markdown - and fails the build when the one change that
// would void the whole XSS corpus (tests/security/markdown-xss.test.tsx)
// lands: raw HTML rendering is re-enabled, the image gate's default is
// flipped, or the default allowlist no longer equals https / mailto / tel.
//
// The load-bearing invariant, stated where a future maintainer will see it:
// bowman-ui never adds rehype-raw or otherwise renders raw HTML from entry
// content - the moment it does, every guarantee in the corpus is void.
//
// Standing invariants enforced (all read as text, none executed):
//   1. rehype-raw appears nowhere in package.json.
//   2. No file under src/ mentions rehype, imports remark-html, sets
//      dangerouslySetInnerHTML, or re-enables raw HTML via skipHtml={false}.
//   3. defaultMarkdownPolicy.allowImages is declared exactly once, as literally
//      false, read with line comments blanked so a decoy comment spelling the
//      value neither hides a real true nor counts as a second declaration;
//      a second property, bare or quoted, fails. The key matches bare or
//      quoted, never as the suffix of a longer name.
//   4. defaultMarkdownPolicy.allowedSchemes is declared once as an inline array
//      of quoted string literals (so the gate reads the runtime value) whose
//      raw source text is exactly "https", "mailto" and "tel" in any order: an
//      admitted http, a dropped tel or an escaped literal that spells
//      javascript at runtime all fail without any escape handling. The key
//      matches bare or quoted, never as the suffix of a longer name.
//   5. The defaultMarkdownPolicy declaration - read from its exported line to
//      the "});" line that closes it, after block comments and template
//      literals are blanked so neither can end the block early or spoof a
//      clean declaration above the real one - contains no "..." token: a
//      spread placed after the checked keys would replace their values at
//      runtime while the literals the gate reads stay clean. Line comments
//      and quoted strings (backslash continuations included) are lexed so a
//      stray backtick or "/*" inside one opens nothing, and kept verbatim so
//      the literals stay readable.
//   6. The same block, again with line comments blanked so a trailing comment
//      cannot mask the delimiter, contains no computed key: a "[" that follows
//      "{" or "," across whitespace sits at property position and, as the last
//      property, would override a checked key at runtime while its literal
//      reads clean.
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

const DEFAULT_SCHEMES = ["https", "mailto", "tel"];

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

const isDefaultSchemeSet = (declared) =>
  JSON.stringify([...declared].sort()) === JSON.stringify(DEFAULT_SCHEMES);

const quoteList = (literals) => `[${literals.map((literal) => `"${literal}"`).join(", ")}]`;

const HIDING_LEXEMES =
  /\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`\\])*`|\/\/[^\n]*|"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/g;

const isBlankedLexeme = (lexeme) => lexeme.startsWith("/*") || lexeme.startsWith("`");

const withoutCommentsAndTemplates = (source) =>
  source.replace(HIDING_LEXEMES, (lexeme) => (isBlankedLexeme(lexeme) ? "" : lexeme));

const withoutLineComments = (source) =>
  source.replace(HIDING_LEXEMES, (lexeme) => (lexeme.startsWith("//") ? "" : lexeme));

const DEFAULT_POLICY_BLOCK = /^export const defaultMarkdownPolicy[\s\S]*?^[ \t]*\}\);$/m;

const ALLOW_IMAGES_VALUES = /(?<![\w$])["']?allowImages["']?\s*:\s*(true|false)/g;

const COMPUTED_KEY = /[{,]\s*\[/;

const defaultPolicyBlock = (source) => {
  const match = withoutCommentsAndTemplates(source).match(DEFAULT_POLICY_BLOCK);

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
  const code = withoutLineComments(block);
  const allowImages = [...code.matchAll(ALLOW_IMAGES_VALUES)].map((m) => m[1]);

  if (allowImages.length !== 1 || allowImages[0] !== "false") {
    violations.push(
      "defaultMarkdownPolicy.allowImages must be declared exactly once as literally false"
    );
  }

  if (COMPUTED_KEY.test(code)) {
    violations.push(
      "defaultMarkdownPolicy must not use a computed key (a computed key can override the values the gate reads)"
    );
  }

  if (block.includes("...")) {
    violations.push(
      "defaultMarkdownPolicy must not spread another object (a spread can override the values the gate reads)"
    );
  }
  const declaredOnce = (block.match(SCHEMES_KEYS) ?? []).length === 1;
  const list = declaredOnce ? block.match(ALLOWED_SCHEMES_ARRAY)?.[1] : undefined;

  if (!declaredOnce) {
    violations.push("defaultMarkdownPolicy.allowedSchemes must be declared exactly once");
  } else if (list === undefined || !isInlineStringArray(list)) {
    violations.push(
      "defaultMarkdownPolicy.allowedSchemes must be an inline array of quoted string literals"
    );
  }
  const declared = [...(list ?? "").matchAll(QUOTED_LITERAL)].map((m) => m[1]);

  if (list !== undefined && !isDefaultSchemeSet(declared)) {
    violations.push(
      `defaultMarkdownPolicy.allowedSchemes literals must be exactly ${quoteList(DEFAULT_SCHEMES)}, found ${quoteList(declared)}`
    );
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
