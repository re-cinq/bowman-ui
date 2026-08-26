import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const BUILT_FILES = ["dist/components/ThinkingIndicator.js", "dist/components/ThinkingDots.js"];

// CONTRACT.md decision 1 requires "use client" as the first *statement*, so
// leading comments and blank lines are allowed above it (018's positional
// check, same as tests/build-contract.test.ts).
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

describe("the built thinking indicator surface", () => {
  it('each built thinking indicator file opens with "use client"; as its first statement', () => {
    for (const built of BUILT_FILES) {
      expect(existsSync(built)).toBe(true);
      const firstStatement = stripLeadingTrivia(readFileSync(built, "utf8"));
      expect(firstStatement.startsWith('"use client";')).toBe(true);
    }
  });

  it("npm pack --dry-run ships both files with their d.ts counterparts", () => {
    const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const [pack] = JSON.parse(output) as [{ files: { path: string }[] }];
    const paths = pack.files.map((file) => file.path);
    for (const built of BUILT_FILES) {
      expect(paths).toContain(built);
      expect(paths).toContain(built.replace(/\.js$/, ".d.ts"));
    }
  });

  it("tsc accepts thinking-indicator-type-assertions.tsx against dist via the '.' exports entry, pinning all @ts-expect-error fixtures", () => {
    const result = spawnSync(
      "node",
      [
        "node_modules/typescript7/bin/tsc",
        "--ignoreConfig",
        "--noEmit",
        "--strict",
        "--target",
        "es2022",
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
        "--skipLibCheck",
        "--jsx",
        "react-jsx",
        "tests/types/thinking-indicator-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});
