import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/lore-tests.yml"), "utf8");

const steps = workflow.split(/\n(?= {6}- )/);

const stepContaining = (needle: string): string => {
  const step = steps.find((chunk) => chunk.includes(needle));

  if (!step) {
    throw new Error(`step not found in workflow: ${needle}`);
  }

  return step;
};

const runMarker = "run: |\n";

const runBlockOf = (step: string): string =>
  step
    .slice(step.indexOf(runMarker) + runMarker.length)
    .split("\n")
    .map((line) => line.slice(10))
    .join("\n");

const fetchStep = stepContaining("- name: Fetch lore-code-trace");
const fetchRunBlock = runBlockOf(fetchStep);
const ingestRunBlock = runBlockOf(stepContaining("- name: Run and ingest test report"));
const pinnedSha256 = workflow.match(/^ {10}LORE_CODE_TRACE_SHA256: ([0-9a-f]{64})$/m)?.[1];
const fetchedGate = "if: steps.fetch.outputs.fetched == 'true'";
const fetchIt = it.skipIf(spawnSync("sha256sum", ["--version"]).status !== 0);

const curlStub = `#!/usr/bin/env bash
[ "\${CURL_STUB_EXIT:-0}" = "0" ] || exit "\${CURL_STUB_EXIT}"
while [ $# -gt 1 ]; do
  [ "$1" = "-o" ] && printf '%s' "\${CURL_STUB_BODY:-}" > "$2"
  shift
done
`;

const sha256Of = (body: string): string => createHash("sha256").update(body).digest("hex");

const runFetch = (env: Record<string, string>) => {
  const workDir = mkdtempSync(join(tmpdir(), "lore-tests-workflow-"));
  const stubPath = join(workDir, "curl");
  const scriptPath = join(workDir, "fetch.sh");
  const outputPath = join(workDir, "github-output");
  const binaryPath = join(workDir, "lore-code-trace");

  writeFileSync(stubPath, curlStub);
  chmodSync(stubPath, 0o755);
  writeFileSync(scriptPath, fetchRunBlock);
  writeFileSync(outputPath, "");

  const result = spawnSync("bash", ["-eo", "pipefail", scriptPath], {
    cwd: workDir,
    encoding: "utf8",
    env: {
      PATH: `${workDir}:${process.env.PATH}`,
      GITHUB_OUTPUT: outputPath,
      GITHUB_EVENT_NAME: "pull_request",
      LORE_INGEST_URL: "https://lore-api.example.test",
      LORE_CODE_TRACE_SHA256: pinnedSha256 ?? "",
      CURL_STUB_BODY: "not the pinned binary",
      ...env,
    },
  });
  const isExecutable = existsSync(binaryPath) && (statSync(binaryPath).mode & 0o111) !== 0;

  return {
    result,
    output: readFileSync(outputPath, "utf8"),
    binaryExists: existsSync(binaryPath),
    isExecutable,
  };
};

describe("lore-tests.yml triggers and wiring", () => {
  it("runs on push to main and on pull_request only", () => {
    expect(workflow).toContain("\non:\n  push:\n    branches: [main]\n  pull_request:\n\n");
  });

  it("pins the lore-code-trace sha256 in the fetch step env and drops the sibling checksums file", () => {
    expect(fetchStep).toContain(`LORE_CODE_TRACE_SHA256: ${pinnedSha256}`);
    expect(fetchStep).toContain("\n        shell: bash\n");
    expect(fetchRunBlock).toContain("sha256sum");
    expect(fetchRunBlock).not.toContain("checksums.txt");
  });

  it("gives the fetch step the id the gates read and interpolates no expression into its script", () => {
    expect(fetchStep).toContain("\n        id: fetch\n");
    expect(fetchRunBlock).not.toContain("${{");
  });

  it("gates install, Playwright and the ingest run on the fetch output", () => {
    expect(stepContaining("uses: ./.github/actions/setup-node-install")).toContain(fetchedGate);
    expect(stepContaining("- name: Install Playwright")).toContain(fetchedGate);
    expect(stepContaining("- name: Run and ingest test report")).toContain(fetchedGate);
  });
});

describe("lore-tests.yml fetch step", () => {
  fetchIt("warns and exits 0 without downloading when LORE_INGEST_URL is empty", () => {
    const { result, output, binaryExists } = runFetch({ LORE_INGEST_URL: "" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::/m);
    expect(binaryExists).toBe(false);
    expect(output).toBe("");
  });

  fetchIt("warns and exits 0 when the download fails with curl exit 7", () => {
    const { result, output } = runFetch({ CURL_STUB_EXIT: "7" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::/m);
    expect(output).toBe("");
  });

  fetchIt("exits 1 without downloading when LORE_INGEST_URL is empty in a push", () => {
    const { result, output, binaryExists } = runFetch({
      LORE_INGEST_URL: "",
      GITHUB_EVENT_NAME: "push",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::/m);
    expect(binaryExists).toBe(false);
    expect(output).toBe("");
  });

  fetchIt("exits 1 when the download fails with curl exit 7 in a push", () => {
    const { result, output, isExecutable } = runFetch({
      CURL_STUB_EXIT: "7",
      GITHUB_EVENT_NAME: "push",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::/m);
    expect(output).toBe("");
    expect(isExecutable).toBe(false);
  });

  fetchIt("exits 0 with ::error and no executable on a sha256 mismatch in a pull_request", () => {
    const { result, output, isExecutable } = runFetch({});

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::error::/m);
    expect(output).toBe("");
    expect(isExecutable).toBe(false);
  });

  fetchIt("exits 1 with ::error on a sha256 mismatch in a push", () => {
    const { result, output, isExecutable } = runFetch({ GITHUB_EVENT_NAME: "push" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::/m);
    expect(output).toBe("");
    expect(isExecutable).toBe(false);
  });

  fetchIt("marks fetched=true and makes the binary executable when the sha256 matches", () => {
    const body = "the pinned binary";
    const { result, output, isExecutable } = runFetch({
      CURL_STUB_BODY: body,
      LORE_CODE_TRACE_SHA256: sha256Of(body),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/::(warning|error)::/);
    expect(output).toBe("fetched=true\n");
    expect(isExecutable).toBe(true);
  });
});

const runIngest = (traceExit: number, eventName: string) => {
  const workDir = mkdtempSync(join(tmpdir(), "lore-tests-ingest-"));
  const scriptPath = join(workDir, "ingest.sh");
  const tracePath = join(workDir, "lore-code-trace");

  writeFileSync(tracePath, `#!/usr/bin/env bash\nexit ${traceExit}\n`);
  chmodSync(tracePath, 0o755);
  writeFileSync(scriptPath, ingestRunBlock);

  return spawnSync("bash", ["-e", scriptPath], {
    cwd: workDir,
    encoding: "utf8",
    env: { PATH: process.env.PATH, GITHUB_EVENT_NAME: eventName },
  });
};

describe("lore-tests.yml ingest step", () => {
  it("exits 0 without a warning when lore-code-trace --post succeeds in a push", () => {
    const result = runIngest(0, "push");

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/::warning::/);
  });

  it("warns and exits 0 when lore-code-trace --post fails in a pull_request", () => {
    const result = runIngest(1, "pull_request");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::Lore test ingest failed$/m);
  });

  it("warns and exits 1 when lore-code-trace --post fails in a push", () => {
    const result = runIngest(1, "push");

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::Lore test ingest failed$/m);
  });
});
