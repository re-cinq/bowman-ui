import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve(process.cwd(), "scripts/check-action-pins.mjs");
const fixtures = "tests/fixtures/action-pins";

const runAgainst = (dir?: string) =>
  spawnSync(process.execPath, dir === undefined ? [script] : [script, dir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

it("exits 0 against every committed workflow and composite action under .github/", () => {
  expect(runAgainst()).toMatchObject({
    status: 0,
    stdout: "check-action-pins: every uses: reference is SHA-pinned.\n",
    stderr: "",
  });
});

it("accepts a 40-hex commit SHA and skips the local ./ and docker:// references it cannot pin", () => {
  expect(runAgainst(`${fixtures}/pinned`)).toMatchObject({ status: 0, stderr: "" });
});

it("exits 1 on a reference pinned to a tag, naming the file, the line and the reference", () => {
  expect(runAgainst(`${fixtures}/unpinned`)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining(
      `${fixtures}/unpinned/workflows/ci.yml:7 pins "actions/checkout@v4"`
    ),
  });
});

it("exits 1 on a tag written in YAML flow style, which no line grep reads", () => {
  expect(runAgainst(`${fixtures}/flow`)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining(
      `${fixtures}/flow/workflows/ci.yml:6 pins "actions/checkout@v4"`
    ),
  });
});

it("exits 1 on a tag inside a composite action that a workflows-only scan would pass", () => {
  expect({
    whole: runAgainst(`${fixtures}/composite`).status,
    workflowsOnly: runAgainst(`${fixtures}/composite/workflows`).status,
  }).toEqual({ whole: 1, workflowsOnly: 0 });
});
