import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// This assertion originally targeted dist/Placeholder.js, the throwaway
// component that existed only to prove the pipeline; Placeholder is long
// gone, so it targets dist/hooks/useDebounce.js - the hook
// docs/design-notes.md decision 1 records as a file that must carry
// "use client" forever.
const builtDirectiveFile = resolve(process.cwd(), "dist/hooks/useDebounce.js");

// docs/design-notes.md decision 1 requires "use client" as the first *statement*, so
// leading comments and blank lines are allowed above it.
const stripLeadingTrivia = (source: string): string => {
  let rest = source;

  for (;;) {
    const trimmed = rest.replace(/^\s+/, "");

    if (trimmed.startsWith("//")) {
      const lineEnd = trimmed.indexOf("\n");

      if (lineEnd === -1) {
        return "";
      }
      rest = trimmed.slice(lineEnd + 1);
      continue;
    }

    if (trimmed.startsWith("/*")) {
      const blockEnd = trimmed.indexOf("*/");

      if (blockEnd === -1) {
        return "";
      }
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
