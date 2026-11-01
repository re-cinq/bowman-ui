import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

type Step = { name: string; env?: Record<string, string>; run: string };
type Workflow = { jobs: Record<string, { if?: string; steps: Step[] }> };

const job = (parse(readFileSync(".github/workflows/pr-description-check.yml", "utf8")) as Workflow)
  .jobs["check-description"];

// The step's own script, run the way the runner runs a `run:` block, on the body it reads.
const checkBody = (body: string) => {
  const { status, stdout } = spawnSync("bash", ["-e", "-c", job.steps[0].run], {
    encoding: "utf8",
    env: { ...process.env, PR_BODY: body },
  });

  return { status, stdout };
};

// Issue 398: Dependabot writes its own body, so the check could never pass on its pull requests.
it("skips the job for a pull request dependabot[bot] opened, by its author rather than whoever edits it", () => {
  expect({ condition: job.if, stepConditions: job.steps.map((step) => "if" in step) }).toEqual({
    condition: "github.event.pull_request.user.login != 'dependabot[bot]'",
    stepConditions: [false],
  });
});

it("still passes a body with all three headings and fails a Dependabot-style one, naming each it lacks", () => {
  expect({
    complete: checkBody("## Why\n\nA.\n\n## What Changed\n\nB.\n\n## Testing\n\nC.\n"),
    dependabotStyle: checkBody(
      "Bumps [actions/setup-node](https://github.com/actions/setup-node) from 7.0.0 to 7.1.0.\n"
    ),
  }).toEqual({
    complete: {
      status: 0,
      stdout: "All required sections present (## Why, ## What Changed, ## Testing).\n",
    },
    dependabotStyle: {
      status: 1,
      stdout:
        "::error::PR description is missing required section(s): ## Why ## What Changed ## Testing\n" +
        "Add the missing heading(s) to the PR description and re-save.\n",
    },
  });
});
