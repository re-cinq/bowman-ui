import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, unknown> };
type Job = {
  if?: string;
  needs?: string[];
  permissions?: Record<string, string>;
  steps: Step[];
};
type Workflow = { on: Record<string, unknown>; jobs: Record<string, Job> };

const yamlAt = <T>(path: string): T => parse(readFileSync(path, "utf8")) as T;

const ci = yamlAt<Workflow>(".github/workflows/ci.yml");
const publish = yamlAt<Workflow>(".github/workflows/publish.yml");
const buildChain = ci.jobs["build-chain"];

const filesUnder = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((entry) => join(dir, entry))
    .filter((path) => statSync(path).isFile());

const installSurface = [
  ...filesUnder(".github"),
  ...filesUnder("scripts"),
  ...(existsSync(".npmrc") ? [".npmrc"] : []),
];

const filesMatching = (pattern: RegExp): string[] =>
  installSurface.filter((path) => pattern.test(readFileSync(path, "utf8")));

it("runs the build-chain job on pull requests, pushes to main and every Monday at 07:00 UTC", () => {
  expect({
    pullRequest: "pull_request" in ci.on,
    push: ci.on.push,
    schedule: ci.on.schedule,
    condition: buildChain.if,
  }).toEqual({
    pullRequest: true,
    push: { branches: ["main"] },
    schedule: [{ cron: "0 7 * * 1" }],
    condition: undefined,
  });
});

it("gives the build-chain job a read-only token and a checkout that keeps no credentials", () => {
  expect({ permissions: buildChain.permissions, checkout: buildChain.steps[0] }).toEqual({
    permissions: { contents: "read" },
    checkout: {
      uses: expect.stringMatching(/^actions\/checkout@[0-9a-f]{40}$/),
      with: { "persist-credentials": false },
    },
  });
});

it("installs with npm ci --ignore-scripts, builds nothing, then runs the audit and the action pins", () => {
  const setup = yamlAt<{ runs: { steps: Step[] } }>(
    ".github/actions/setup-node-install/action.yml"
  );

  expect({
    steps: buildChain.steps.slice(1),
    install: setup.runs.steps.find((step) => step.name === "Install")?.run,
  }).toEqual({
    steps: [
      { uses: "./.github/actions/setup-node-install" },
      { name: "Audit (high and above)", run: "npm run check:audit" },
      { name: "Action pins", run: "npm run check:action-pins" },
    ],
    install: "npm ci --ignore-scripts",
  });
});

it("runs both checks last in publish.yml's verify job, which the publish job needs before it stages anything", () => {
  expect({
    last: publish.jobs.verify.steps.at(-1),
    needs: publish.jobs.publish.needs,
  }).toEqual({
    last: { name: "Build chain", run: "npm run check:build-chain" },
    needs: ["release-tag", "verify"],
  });
});

it("keeps the release guards: the stable-version tag check and a staged publish with --provenance", () => {
  const stage = publish.jobs.publish.steps.find((step) => step.name === "Stage the version on npm");

  expect({ tagGate: publish.jobs["release-tag"].if, stage: stage?.run }).toEqual({
    tagGate: "${{ !github.event.release.prerelease }}",
    stage: expect.stringContaining("npm stage publish --access public --provenance"),
  });
});

it("chains both checks behind one package.json script, check:build-chain", () => {
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };

  expect({
    audit: scripts["check:audit"],
    pins: scripts["check:action-pins"],
    chain: scripts["check:build-chain"],
  }).toEqual({
    audit: "node scripts/check-audit.mjs",
    pins: "node scripts/check-action-pins.mjs",
    chain: "npm run check:audit && npm run check:action-pins",
  });
});

it("commits the acknowledgements as an array whose every entry carries the five fields and an ISO expiry", () => {
  const entries = JSON.parse(readFileSync(".github/audit-acknowledgements.json", "utf8")) as Record<
    string,
    unknown
  >[];
  const incomplete = entries.filter(
    (entry) =>
      ["advisory", "package", "why", "expires", "acknowledged_by"].some((field) => !entry[field]) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.expires))
  );

  expect({ isArray: Array.isArray(entries), incomplete }).toEqual({
    isArray: true,
    incomplete: [],
  });
});

it("never narrows the audit to production dependencies: no workflow, action or script says omit=dev", () => {
  expect(filesMatching(/omit=dev/)).toEqual([]);
});

it("installs without --legacy-peer-deps or --force anywhere in .github/, scripts/ or .npmrc", () => {
  expect(filesMatching(/legacy-peer-deps|--force/)).toEqual([]);
});

it("updates npm and actions weekly, grouping only dev minors and patches, so majors and runtime dependencies arrive one per PR", () => {
  const dependabot = yamlAt<{
    updates: {
      "package-ecosystem": string;
      schedule: { interval: string };
      groups?: Record<string, unknown>;
    }[];
  }>(".github/dependabot.yml");

  expect(
    dependabot.updates.map((update) => ({
      ecosystem: update["package-ecosystem"],
      interval: update.schedule.interval,
      groups: update.groups,
    }))
  ).toEqual([
    { ecosystem: "github-actions", interval: "weekly", groups: undefined },
    { ecosystem: "github-actions", interval: "weekly", groups: undefined },
    {
      ecosystem: "npm",
      interval: "weekly",
      groups: {
        "dev-dependencies": {
          "dependency-type": "development",
          "update-types": ["minor", "patch"],
        },
      },
    },
  ]);
});

it("keeps both scripts byte-identical to the HAL Engine commit their one header line names", () => {
  const copies = ["check-audit", "check-action-pins"].map((name) => {
    const lines = readFileSync(`scripts/${name}.mjs`, "utf8").split("\n");
    const [header] = lines.splice(1, 1);

    return { header, sha256: createHash("sha256").update(lines.join("\n")).digest("hex") };
  });

  expect(copies).toEqual([
    {
      header: expect.stringContaining(
        "copied unmodified from re-cinq/HALEngine@8712723846c2 scripts/check-audit.mjs"
      ),
      sha256: "cadb369b9b5bea03f814f9724c414ca876e50af23b41f7a4ed02776791aa2aa7",
    },
    {
      header: expect.stringContaining(
        "copied unmodified from re-cinq/HALEngine@89285c155749 scripts/check-action-pins.mjs"
      ),
      sha256: "919b9c0408f354f55898d8bd5dad7c2c4986c2ce604bc4b4eed3f8e6e2797b32",
    },
  ]);
});

it("states the one supported install in README.md: npm install from the registry, with neither flag", () => {
  expect(readFileSync("README.md", "utf8")).toContain(
    "```sh\nnpm install @re-cinq/bowman-ui\n```\n\nThat is the one supported install: from the npm registry, with neither `--legacy-peer-deps` nor `--force`."
  );
});

it("runs every ci.yml job on the weekly schedule too, none gated off it", () => {
  expect(
    Object.entries(ci.jobs)
      .filter(([, job]) => job.if !== undefined)
      .map(([id]) => id)
  ).toEqual([]);
});
