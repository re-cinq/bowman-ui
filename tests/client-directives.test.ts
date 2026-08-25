import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve(process.cwd(), "scripts/check-client-directives.mjs");

it("exits non-zero when a useState file carries no directive", () => {
  const result = spawnSync("node", [script, "tests/fixtures/client-directive-violation"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("UseStateNoDirective.tsx");
});

it("exits zero against src/ and dist/", () => {
  const result = spawnSync("node", [script], { cwd: process.cwd(), encoding: "utf8" });
  expect(result).toMatchObject({ status: 0, stderr: "" });
});
