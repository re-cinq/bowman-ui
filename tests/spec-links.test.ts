import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";

// Any markdown link with a #L line anchor: [label](path#Lnn)
const ANCHORS = /\[([^\]]+)\]\(([^)#]+)#L(\d+)\)/g;

// The pattern repoint-spec-anchors.mjs already tracks — test files under
// tests/ or examples/*/tests/ with a .ts/.tsx extension.
const TEST_FILE = /(?:\.\.\/)+(?:examples\/[^/]+\/)?tests\/[\w./-]+\.(?:tsx|ts)$/;

const root = resolve(process.cwd());

const specFiles = (): string[] => {
  const files: string[] = [];
  const specsDir = join(root, "specs");
  if (existsSync(specsDir)) {
    for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const f = `specs/${entry.name}/spec.md`;
      if (existsSync(join(root, f))) files.push(f);
    }
  }
  const dotSpecify = ".specify/spec.md";
  if (existsSync(join(root, dotSpecify))) files.push(dotSpecify);
  return files;
};

// A line is rotten when a spec link lands on it but nothing meaningful can be
// cited there. Blank lines are rotten for every file type. Comment lines are
// rotten in YAML workflow files (comments are section markers, not step
// content) and in repo-root TypeScript/ESM config files (the comment drifts
// alongside the real code and is not what a spec link should cite). Files
// under scripts/, examples/, src/, and tests/ are excluded from the comment
// check: those directories legitimately use comment lines as scope/purpose
// documentation that specs sometimes cite directly.
const isRotten = (line: string, absPath: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return true;

  if (absPath.endsWith(".yml") || absPath.endsWith(".yaml")) {
    return trimmed.startsWith("#");
  }

  const isRootConfig =
    !absPath.includes("/src/") &&
    !absPath.includes("/examples/") &&
    !absPath.includes("/scripts/") &&
    !absPath.includes("/tests/") &&
    (absPath.endsWith(".ts") || absPath.endsWith(".mjs") || absPath.endsWith(".js"));
  if (isRootConfig) {
    return trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("* ");
  }

  return false;
};

it("non-test spec links do not land on a comment or blank line", () => {
  const failures: string[] = [];

  for (const specFile of specFiles()) {
    const specDir = dirname(specFile);
    const source = readFileSync(join(root, specFile), "utf8");

    for (const match of source.matchAll(ANCHORS)) {
      const relPath = match[2];
      const lineNum = parseInt(match[3], 10);

      // Skip test-file links already tracked by repoint-spec-anchors.mjs
      if (TEST_FILE.test(relPath)) continue;

      const targetPath = normalize(join(root, specDir, relPath));
      if (!existsSync(targetPath)) continue;

      const lines = readFileSync(targetPath, "utf8").split(/\r?\n/);
      const targetLine = lines[lineNum - 1];
      if (targetLine === undefined) continue;

      if (isRotten(targetLine, targetPath)) {
        failures.push(
          `${specFile}: ${relPath}#L${lineNum} -> "${targetLine.trim().slice(0, 70)}" is a comment or blank`
        );
      }
    }
  }

  expect(failures).toEqual([]);
});
