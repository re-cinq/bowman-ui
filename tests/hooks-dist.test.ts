import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { expectPackedWithTypes } from "./helpers/built-package.js";
import { listFiles } from "./helpers/source-hygiene.js";

const BUILT_FILES = [
  "dist/hooks/useDebounce.js",
  "dist/hooks/useFocusTrap.js",
  "dist/hooks/useFocusGroups.js",
  "dist/hooks/useReducedMotion.js",
  "dist/hooks/useSidebarState.js",
  "dist/components/ErrorBoundary.js",
];

describe("the built hook surface", () => {
  it("tsc accepts hooks-type-assertions.tsx against dist via the '.' exports entry", () => {
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
        "tests/types/hooks-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });

  it("npm pack --dry-run ships the five hooks and ErrorBoundary with their d.ts files", () => {
    expectPackedWithTypes(BUILT_FILES);
  });

  it('each built hook and ErrorBoundary opens with "use client"; as its first statement', () => {
    for (const built of BUILT_FILES) {
      expect(existsSync(built)).toBe(true);
      const firstStatement = readFileSync(built, "utf8").trimStart();

      expect(firstStatement.startsWith('"use client";')).toBe(true);
    }
  });

  it("no built file reads process.env and no NEXT_PUBLIC flag string survives in src/", () => {
    const distSources = listFiles("dist").filter((file) => file.endsWith(".js"));

    for (const file of distSources) {
      expect(readFileSync(file, "utf8")).not.toMatch(/process\.env/);
    }

    const srcSources = listFiles("src");

    for (const file of srcSources) {
      const content = readFileSync(file, "utf8");

      expect(content).not.toMatch(/NEXT_PUBLIC_FLAG_ANIMATIONS/);
    }
  });
});
