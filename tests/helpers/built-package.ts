import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { runScript } from "./script-runner.js";

const TSC = "node_modules/typescript7/bin/tsc";
const TSC_FLAGS = [
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
];

// docs/design-notes.md decision 1 requires "use client" as the first *statement*, so
// leading comments and blank lines are allowed above it (018's positional
// check, shared by the *-dist tests and tests/build-contract.test.ts).
export const stripLeadingTrivia = (source: string): string => {
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

export const packedPaths = (): string[] => {
  const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const [pack] = JSON.parse(output) as [{ files: { path: string }[] }];

  return pack.files.map((file) => file.path);
};

export const expectClientDirectiveFirst = (builtFile: string): void => {
  expect(existsSync(builtFile)).toBe(true);
  const firstStatement = stripLeadingTrivia(readFileSync(builtFile, "utf8"));

  expect(firstStatement.startsWith('"use client";')).toBe(true);
};

export const expectTypeAssertionsCompile = (fixture: string): void => {
  const result = runScript(TSC, [...TSC_FLAGS, fixture], { cwd: process.cwd() });

  expect(result).toMatchObject({ status: 0, stderr: "" });
};

export const expectPackedWithTypes = (builtFiles: string[]): void => {
  const paths = packedPaths();

  for (const built of builtFiles) {
    expect(paths).toContain(built);
    expect(paths).toContain(built.replace(/\.js$/, ".d.ts"));
  }
};
