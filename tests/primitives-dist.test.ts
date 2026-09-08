import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { packedPaths, stripLeadingTrivia } from "./helpers/built-package.js";

// The four styled primitives each take a handler prop, so decision 1's trigger
// list puts "use client" first in every built file; buttonStyles.js is a
// class-map module with no handler and no hook, so it stays server-safe.
const CLIENT_FILES = [
  "dist/components/Button.js",
  "dist/components/IconButton.js",
  "dist/components/PromptChips.js",
  "dist/components/SearchField.js",
];
const STYLES_FILE = "dist/components/buttonStyles.js";

const opensWithUseClient = (path: string): boolean =>
  stripLeadingTrivia(readFileSync(path, "utf8")).startsWith('"use client";');

describe("the built styled primitives", () => {
  it.each(CLIENT_FILES)('%s opens with "use client"; as its first statement', (path) => {
    expect(existsSync(path)).toBe(true);
    expect(opensWithUseClient(path)).toBe(true);
  });

  it('dist/components/buttonStyles.js exists and does not open with "use client";', () => {
    expect(existsSync(STYLES_FILE)).toBe(true);
    expect(opensWithUseClient(STYLES_FILE)).toBe(false);
  });

  it("npm pack --dry-run ships the four primitives and buttonStyles with their d.ts files", () => {
    const paths = packedPaths();

    for (const path of [...CLIENT_FILES, STYLES_FILE]) {
      expect(paths).toContain(path);
      expect(paths).toContain(path.replace(/\.js$/, ".d.ts"));
    }
  });

  it("tsc accepts primitives-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture", () => {
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
        "tests/types/primitives-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});
