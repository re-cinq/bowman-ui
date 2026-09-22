// Runs the Vitest suite (or a slice of it) with the Jest-compatible JSON
// reporter written to a temp file and hands the parsed report back. Shared by
// the two Lore test-command scripts. Builds first: tests/public-api.test.ts
// reads dist/ at collection time, so in a clean checkout its tests would
// silently vanish from a listing without this. A failing test still produces
// a full report, so a non-zero vitest exit is reported as `failed`, not
// thrown - a missing report file is the real failure. The caller picks what
// vitest's stdout does (`ignore` keeps the caller's own stdout pure).
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

export const collectVitestReport = (vitestArgs, stdout) => {
  const reportFile = join(tmpdir(), `bowman-ui-vitest-${process.pid}.json`);

  execFileSync("npm", ["run", "build"], {
    cwd: process.cwd(),
    stdio: ["ignore", "ignore", "inherit"],
  });

  let failed = false;

  try {
    execFileSync(
      "npx",
      ["vitest", "run", ...vitestArgs, "--reporter=json", `--outputFile=${reportFile}`],
      { cwd: process.cwd(), stdio: ["ignore", stdout, "inherit"] }
    );
  } catch {
    failed = true;
  }

  const report = JSON.parse(readFileSync(reportFile, "utf8"));

  rmSync(reportFile, { force: true });

  return { report, failed };
};
