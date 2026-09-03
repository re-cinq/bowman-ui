import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { packedPaths, stripLeadingTrivia } from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/AppSidebar.js";

describe("the built sidebar surface", () => {
  it('dist/components/AppSidebar.js opens with "use client"; as its first statement', () => {
    expect(existsSync(BUILT_FILE)).toBe(true);
    const firstStatement = stripLeadingTrivia(readFileSync(BUILT_FILE, "utf8"));

    expect(firstStatement.startsWith('"use client";')).toBe(true);
  });

  it("npm pack --dry-run ships dist/components/AppSidebar.js with its d.ts", () => {
    const paths = packedPaths();

    expect(paths).toContain(BUILT_FILE);
    expect(paths).toContain(BUILT_FILE.replace(/\.js$/, ".d.ts"));
  });

  it("tsc accepts app-sidebar-type-assertions.tsx against dist via the '.' exports entry, pinning the @ts-expect-error fixtures", () => {
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
        "tests/types/app-sidebar-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});
