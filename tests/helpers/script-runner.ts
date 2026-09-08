import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type RunResult = { status: number | null; stdout: string; stderr: string };

export const runScript = (
  script: string,
  args: string[],
  { cwd, nodeFlags = [] }: { cwd: string; nodeFlags?: string[] }
): RunResult => {
  const result = spawnSync(process.execPath, [...nodeFlags, script, ...args], {
    cwd,
    encoding: "utf8",
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

export const git = (repo: string, ...args: string[]): void => {
  execFileSync("git", args, { cwd: repo, stdio: "ignore" });
};

export const gitOut = (repo: string, ...args: string[]): string =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();

export const writeInRepo = (repo: string, path: string, content: string): void => {
  mkdirSync(join(repo, dirname(path)), { recursive: true });
  writeFileSync(join(repo, path), content);
};

export const expectUsageError = (result: RunResult): void => {
  expect(result).toMatchObject({ status: 2 });
  expect(result.stderr).toContain("usage:");
};

const stripTypesFlags = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"];

// The spec-check scripts load the lore mirrors as .ts, so they need Node's type stripping.
export const stripTypesRunner = (script: string) => {
  const runFrom = (cwd: string, ...args: string[]): RunResult =>
    runScript(script, args, { cwd, nodeFlags: stripTypesFlags });

  return { runFrom, run: (...args: string[]): RunResult => runFrom(process.cwd(), ...args) };
};
