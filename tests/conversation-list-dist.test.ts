import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BUILT_FILE = "dist/components/ConversationList.js";

// docs/design-notes.md decision 1 requires "use client" as the first *statement*, so
// leading comments and blank lines are allowed above it (018's positional
// check, same as tests/chat-message-dist.test.ts).
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

describe("the built conversation list surface", () => {
  it('dist/components/ConversationList.js opens with "use client"; as its first statement', () => {
    expect(existsSync(BUILT_FILE)).toBe(true);
    const firstStatement = stripLeadingTrivia(readFileSync(BUILT_FILE, "utf8"));
    expect(firstStatement.startsWith('"use client";')).toBe(true);
  });

  it("npm pack --dry-run ships dist/components/ConversationList.js with its d.ts", () => {
    const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const [pack] = JSON.parse(output) as [{ files: { path: string }[] }];
    const paths = pack.files.map((file) => file.path);
    expect(paths).toContain(BUILT_FILE);
    expect(paths).toContain(BUILT_FILE.replace(/\.js$/, ".d.ts"));
  });
});
