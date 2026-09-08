import { spawnSync } from "node:child_process";
import { expectClientDirectiveFirst, expectPackedWithTypes } from "./helpers/built-package.js";

const BUILT_FILES = ["dist/components/ThinkingIndicator.js", "dist/components/ThinkingDots.js"];

describe("the built thinking indicator surface", () => {
  it('each built thinking indicator file opens with "use client"; as its first statement', () => {
    for (const built of BUILT_FILES) {
      expectClientDirectiveFirst(built);
    }
  });

  it("npm pack --dry-run ships both files with their d.ts counterparts", () => {
    expectPackedWithTypes(BUILT_FILES);
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
