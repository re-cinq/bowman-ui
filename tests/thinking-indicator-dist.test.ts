import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { packedPaths, stripLeadingTrivia } from "./helpers/built-package.js";

const BUILT_FILES = ["dist/components/ThinkingIndicator.js", "dist/components/ThinkingDots.js"];

describe("the built thinking indicator surface", () => {
  it('each built thinking indicator file opens with "use client"; as its first statement', () => {
    for (const built of BUILT_FILES) {
      expect(existsSync(built)).toBe(true);
      const firstStatement = stripLeadingTrivia(readFileSync(built, "utf8"));

      expect(firstStatement.startsWith('"use client";')).toBe(true);
    }
  });

  it("npm pack --dry-run ships both files with their d.ts counterparts", () => {
    const paths = packedPaths();

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
