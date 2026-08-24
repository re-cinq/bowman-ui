import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// 014 pinned this assertion on dist/Placeholder.js, the throwaway component
// that existed only to prove the pipeline. 022 deleted Placeholder under 014's
// own design ("the first real extraction PR deletes them"), so the assertion
// now targets dist/hooks/useDebounce.js - the directive-inheritance failure
// 021 extracted, and a file that must carry "use client" forever.
const builtDirectiveFile = resolve(process.cwd(), "dist/hooks/useDebounce.js");

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

it('emits "use client"; as the first statement of dist/hooks/useDebounce.js', () => {
  if (!existsSync(builtDirectiveFile)) {
    throw new Error("dist/hooks/useDebounce.js is missing - run npm run build first");
  }
  const firstStatement = stripLeadingTrivia(readFileSync(builtDirectiveFile, "utf8"));
  expect(firstStatement).toMatch(/^(['"])use client\1;/);
});
