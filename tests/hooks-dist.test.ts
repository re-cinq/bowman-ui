import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BUILT_FILES = [
  "dist/hooks/useDebounce.js",
  "dist/hooks/useFocusTrap.js",
  "dist/hooks/useFocusGroups.js",
  "dist/hooks/useReducedMotion.js",
  "dist/hooks/useSidebarState.js",
  "dist/components/ErrorBoundary.js",
];

const walk = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
};

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

  it('each built hook and ErrorBoundary opens with "use client"; as its first statement', () => {
    for (const built of BUILT_FILES) {
      expect(existsSync(built)).toBe(true);
      const firstStatement = readFileSync(built, "utf8").trimStart();
      expect(firstStatement.startsWith('"use client";')).toBe(true);
    }
  });

  it("no built file reads process.env and no NEXT_PUBLIC flag string survives in src/", () => {
    const distSources = walk("dist").filter((file) => file.endsWith(".js"));
    for (const file of distSources) {
      expect(readFileSync(file, "utf8")).not.toMatch(/process\.env/);
    }

    const srcSources = walk("src");
    for (const file of srcSources) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toMatch(/NEXT_PUBLIC_FLAG_ANIMATIONS/);
    }
  });
});
