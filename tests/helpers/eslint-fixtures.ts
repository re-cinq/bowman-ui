import { spawnSync } from "node:child_process";
import { resolve, sep } from "node:path";

export interface LintMessage {
  ruleId: string | null;
  message: string;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
}

// The fixtures live outside src/ and are globally ignored, so `npm run lint`
// stays green. --no-ignore lifts the ignore, and each fixture glob is listed in
// the matching eslint.config.mjs `files` entry, so every fixture is judged by
// the exact committed rules - not a copy of them.
export const lintFixtures = (fixtures: string[]): LintResult[] => {
  const result = spawnSync(
    "node",
    [
      resolve(process.cwd(), "node_modules/eslint/bin/eslint.js"),
      "--no-ignore",
      "--format",
      "json",
      ...fixtures,
    ],
    { cwd: process.cwd(), encoding: "utf8" }
  );

  expect(result.status).toBe(1);

  return JSON.parse(result.stdout) as LintResult[];
};

export const messagesFor = (results: LintResult[], fixture: string): LintMessage[] => {
  const match = results.find((entry) => entry.filePath.endsWith(`${sep}${fixture}`));

  if (!match) {
    throw new Error(`eslint reported nothing for ${fixture}`);
  }

  return match.messages;
};
