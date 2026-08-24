import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const builtPlaceholder = resolve(process.cwd(), "dist/Placeholder.js");

// 014 asserted the directive on literal line 1. 018 supersedes that:
// CONTRACT.md decision 1 requires "use client" as the first *statement*, so
// leading comments and blank lines are allowed above it.
const stripLeadingTrivia = (source: string): string => {
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

it('emits "use client"; as the first statement of dist/Placeholder.js', () => {
  if (!existsSync(builtPlaceholder)) {
    throw new Error("dist/Placeholder.js is missing - run npm run build first");
  }
  const firstStatement = stripLeadingTrivia(readFileSync(builtPlaceholder, "utf8"));
  expect(firstStatement).toMatch(/^(['"])use client\1;/);
});
