import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/lore-tests.yml"), "utf8");

// A marker that has gone misses silently otherwise: indexOf returns -1 and
// slice(-1) hands back the file's last character, against which every
// not.toContain below would pass. Losing the deviation header - the template
// regeneration this file exists to catch - takes "\nname: " with it.
const sliceFrom = (marker: string): string => {
  const at = workflow.indexOf(marker);

  if (at < 0) {
    throw new Error(`marker not found in workflow: ${marker}`);
  }

  return workflow.slice(at);
};

const workflowBody = sliceFrom("\nname: ");
const jobsBlock = sliceFrom("\njobs:\n");
// Steps only, never the comment header: the header discusses --post, ci-tests
// and the token, so a header chunk would satisfy the step assertions below.
// What that drops is the job's OWN keys, which is where an ungated `env:`
// would sit, so jobHeader keeps them in view.
const [jobHeader, ...steps] = jobsBlock.split(/\n(?= {6}- )/);

const stepContaining = (needle: string): string => {
  const step = steps.find((chunk) => chunk.includes(needle));

  if (!step) {
    throw new Error(`step not found in workflow: ${needle}`);
  }

  return step;
};

const stepsMentioning = (needle: string): string[] => steps.filter((step) => step.includes(needle));

const runMarker = "run: |\n";

const runBlockOf = (step: string): string =>
  step
    .slice(step.indexOf(runMarker) + runMarker.length)
    .split("\n")
    .map((line) => line.slice(10))
    .join("\n");

const checkoutStep = stepContaining("uses: actions/checkout@");
const fetchStep = stepContaining("- name: Fetch lore-code-trace");
const runStep = stepContaining("- name: Run test suite");
const fetchRunBlock = runBlockOf(fetchStep);
const suiteRunBlock = runBlockOf(runStep);
const fetchedGate = "if: steps.fetch.outputs.fetched == 'true'";
const reportGate = "if: always() && steps.run.outputs.report == 'true'";
const tokenBinding =
  "LORE_INGEST_TOKEN: ${{ github.event_name == 'push' && secrets.LORE_INGEST_TOKEN || '' }}";
const endpointBinding =
  "LORE_API_URL: ${{ github.event_name == 'push' && " +
  "(secrets.LORE_INGEST_URL || vars.LORE_INGEST_URL) || '' }}";
const hasTool = (tool: string): boolean => spawnSync(tool, ["--version"]).status === 0;
const fetchIt = it.skipIf(!hasTool("sha256sum"));

// The step fetches two artifacts, so the stub appends its arguments and serves
// the checksums file its own body - one shared body could never disagree with
// itself, which is the whole mismatch the step exists to catch.
const curlStub = `#!/usr/bin/env bash
printf '%s\\n' "$@" >> curl-args
[ "\${CURL_STUB_EXIT:-0}" = "0" ] || exit "\${CURL_STUB_EXIT}"
while [ $# -gt 1 ]; do
  if [ "$1" = "-o" ]; then
    case "$2" in
    checksums.txt) printf '%s' "\${CURL_STUB_CHECKSUMS:-}" > "$2" ;;
    *) printf '%s' "\${CURL_STUB_BODY:-}" > "$2" ;;
    esac
  fi
  shift
done
exit 0
`;

const sha256Of = (body: string): string => createHash("sha256").update(body).digest("hex");

// What the origin serves beside the binary: the other platforms are present so
// the step is seen picking its own line out of the list rather than reading the
// first digest in the file.
const checksumsFor = (body: string, name = "linux-amd64"): string =>
  [
    `${sha256Of("darwin-arm64 build")}  darwin-arm64`,
    `${sha256Of(body)}  ${name}`,
    `${sha256Of("linux-arm64 build")}  linux-arm64`,
  ].join("\n");

interface StepRun {
  prefix: string;
  script: string;
  stubs: Record<string, string>;
  files?: Record<string, string>;
  env: Record<string, string>;
}

const runStepScript = ({ prefix, script, stubs, files = {}, env }: StepRun) => {
  const workDir = mkdtempSync(join(tmpdir(), prefix));
  const scriptPath = join(workDir, "step.sh");
  const outputPath = join(workDir, "github-output");

  for (const [name, body] of Object.entries(stubs)) {
    const stubPath = join(workDir, name);

    writeFileSync(stubPath, body);
    chmodSync(stubPath, 0o755);
  }

  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(workDir, name), body);
  }
  writeFileSync(scriptPath, script);
  writeFileSync(outputPath, "");

  const result = spawnSync("bash", ["-eo", "pipefail", scriptPath], {
    cwd: workDir,
    encoding: "utf8",
    env: {
      PATH: `${workDir}:${process.env.PATH}`,
      GITHUB_OUTPUT: outputPath,
      GITHUB_EVENT_NAME: "pull_request",
      ...env,
    },
  });

  return { workDir, result, output: readFileSync(outputPath, "utf8") };
};

const runFetch = (env: Record<string, string>) => {
  const { workDir, result, output } = runStepScript({
    prefix: "lore-tests-workflow-",
    script: fetchRunBlock,
    stubs: { curl: curlStub },
    env: {
      LORE_INGEST_URL: "https://lore-api.example.test",
      CURL_STUB_BODY: "not the binary the origin vouches for",
      CURL_STUB_CHECKSUMS: checksumsFor("the binary the origin vouches for"),
      ...env,
    },
  });
  const binaryPath = join(workDir, "lore-code-trace");
  const isExecutable = existsSync(binaryPath) && (statSync(binaryPath).mode & 0o111) !== 0;
  const argsPath = join(workDir, "curl-args");

  return {
    result,
    output,
    binaryExists: existsSync(binaryPath),
    isExecutable,
    curlArgs: existsSync(argsPath) ? readFileSync(argsPath, "utf8").split("\n") : null,
  };
};

describe("lore-tests.yml triggers and wiring", () => {
  it("runs on push to main and on pull_request only", () => {
    expect(workflow).toContain("\non:\n  push:\n    branches: [main]\n  pull_request:\n\n");
  });

  it("checks out the whole history the delta is diffed over, with no credentials", () => {
    expect(checkoutStep).toContain("\n          fetch-depth: 0\n");
    expect(checkoutStep).toContain("\n          persist-credentials: false\n");
  });

  it("takes the expected digest from the checksums file served beside the binary", () => {
    expect(fetchStep).toContain("\n        shell: bash\n");
    expect(fetchRunBlock).toContain("sha256sum");
    expect(fetchRunBlock).toContain("checksums.txt");
    // No digest is committed here any more (docs/design-notes.md § Lore test
    // ingest): a 64-hex literal in this workflow would be a pin that goes
    // stale, which is what this step was changed to stop doing.
    expect(workflow).not.toMatch(/[0-9a-f]{64}/);
    expect(fetchRunBlock).toContain('"${LORE_INGEST_URL}/dist/lore-code-trace/${artifact}"');
    // The comparison is explicit, never `sha256sum -c`, whose exit code macOS
    // does not report faithfully.
    expect(fetchRunBlock).not.toMatch(/sha256sum\s+-c/);
  });

  it("gives the fetch step the id the gates read and interpolates no expression into any script", () => {
    expect(fetchStep).toContain("\n        id: fetch\n");
    expect([fetchRunBlock, suiteRunBlock].join("\n")).not.toContain("${{");
  });

  it("gates the node install and the suite run on the fetch output and installs no browsers", () => {
    const install = stepContaining("uses: ./.github/actions/setup-node-install");

    expect(install).toContain(fetchedGate);
    expect(install).toContain('\n          build: "true"\n');
    expect(runStep).toContain(fetchedGate);
    expect(runStep).toContain("\n        id: run\n");
    expect(runStep).toContain("\n        shell: bash\n");
    expect(workflowBody).not.toMatch(/playwright/i);
  });

  it("declares no key at the workflow or the job level beyond these", () => {
    // A closed set beats hunting for spellings of `env:`: a trailing comment,
    // a trailing space or flow style all defeat a pattern, and an ungated
    // binding at either level reaches every step, a pull request's included.
    expect(workflowBody.match(/^[\w-]+ *:/gm)).toEqual([
      "name:",
      "on:",
      "concurrency:",
      "permissions:",
      "jobs:",
    ]);
    expect(jobHeader.match(/^ {4}[\w-]+ *:/gm)).toEqual([
      "    runs-on:",
      "    timeout-minutes:",
      "    steps:",
    ]);
    expect(steps).toHaveLength(5);
  });

  it("grants contents: read, and serialises a ref's runs without cancelling main's", () => {
    // The trailing blank line closes the block: id-token or pull-requests
    // write would otherwise ride under it.
    expect(workflow).toContain("\npermissions:\n  contents: read\n\n");
    expect(workflow).toContain(
      "\nconcurrency:\n  group: lore-tests-${{ github.ref }}\n" +
        "  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}\n"
    );
  });

  it("pins every action to a 40-hex commit with its version, or uses a local action", () => {
    const uses = workflow.split("\n").filter((line) => line.includes("uses:"));

    expect(uses.length).toBeGreaterThanOrEqual(3);

    for (const line of uses) {
      expect(line).toMatch(
        /^\s+(- )?uses: (\.\/\.github\/actions\/[\w-]+|[\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+)$/
      );
    }
  });
});

describe("lore-tests.yml ingest sink", () => {
  it("lets the binary post the delta itself and posts nothing of its own", () => {
    expect(suiteRunBlock).toContain("./lore-code-trace --post");
    expect(workflowBody).not.toContain("ci-tests");
    expect(workflowBody).not.toContain("LORE_WEBHOOK_URL");
    // Not a pattern for one curl spelling: the only curl here downloads the
    // binary, and `curl -d` posts without ever naming a method.
    expect(stepsMentioning("curl")).toEqual([fetchStep]);
    expect(stepsMentioning("lore-code-trace --post")).toEqual([runStep]);
    expect(workflowBody).not.toContain("Authorization");
    expect(workflowBody).not.toContain("Bearer");
  });

  it("downloads the binary and its checksums from the ingest origin and nowhere else", () => {
    const body = "the binary the origin vouches for";
    const { curlArgs } = runFetch({
      CURL_STUB_BODY: body,
      CURL_STUB_CHECKSUMS: checksumsFor(body),
    });

    expect(curlArgs).toContain("-fsSL");
    expect(curlArgs).toContain("https://lore-api.example.test/dist/lore-code-trace/linux-amd64");
    expect(curlArgs).toContain("https://lore-api.example.test/dist/lore-code-trace/checksums.txt");
    expect(curlArgs).toContain("-o");
    expect(curlArgs?.filter((arg) => arg.startsWith("https:"))).toHaveLength(2);
  });

  it("runs the whole ingest in one job, so the delta sees the work tree", () => {
    expect(jobsBlock.match(/^ {2}[\w-]+:$/gm)).toEqual(["  lore-tests-vitest:"]);
    expect(workflowBody).not.toContain("needs:");
    expect(workflowBody).not.toContain("download-artifact");
  });
});

describe("lore-tests.yml token scoping (issue 166)", () => {
  it("binds the token and the endpoint on a push only, in the suite step alone", () => {
    expect(workflowBody.split(tokenBinding)).toHaveLength(2);
    expect(workflowBody.split(endpointBinding)).toHaveLength(2);
    expect(runStep).toContain(tokenBinding);
    expect(runStep).toContain(endpointBinding);
    // No OTHER step may name either, however it binds them - the install step
    // runs the repository's build, and a pull request reaches it too.
    expect(stepsMentioning("LORE_INGEST_TOKEN")).toEqual([runStep]);
    expect(stepsMentioning("LORE_API_URL")).toEqual([runStep]);
    expect(stepsMentioning("env:")).toEqual([fetchStep, runStep]);
  });

  it("reads these secrets and no others, under these names and no others", () => {
    // The gated bindings being present says nothing about what rides beside
    // them: a second secret under any other name - or toJSON(secrets) whole -
    // is the same leak, since the binary runs the repository's test commands
    // in this step. Both sets are closed.
    expect(workflowBody.match(/secrets[.[]\w*/g)).toEqual([
      "secrets.LORE_INGEST_URL",
      "secrets.LORE_INGEST_URL",
      "secrets.LORE_INGEST_TOKEN",
    ]);
    expect(workflowBody).not.toContain("toJSON");
    expect(runStep.match(/^ {10}[\w-]+ *:/gm)).toEqual([
      "          LORE_API_URL:",
      "          LORE_INGEST_TOKEN:",
      "          LORE_TRACE_TIMEOUT_MS:",
    ]);
  });

  it("gives the binary headroom over the 120s default a cold runner exceeds", () => {
    expect(runStep).toContain('\n          LORE_TRACE_TIMEOUT_MS: "600000"\n');
  });

  it("echoes nothing and traces nothing, so no channel carries the token", () => {
    expect(suiteRunBlock).not.toMatch(/set -[a-z]*x/);
    expect(suiteRunBlock).not.toContain("GITHUB_STEP_SUMMARY");
    expect(suiteRunBlock).not.toMatch(/^ *(echo|printf).*\$\{?LORE_INGEST_TOKEN/m);
    // The gate is the literal event, not its complement: a third trigger must
    // not quietly inherit the push path.
    expect(suiteRunBlock).toContain('if [ "${GITHUB_EVENT_NAME}" = "push" ]; then');
  });

  it("keeps the report of a run that posts nothing as an artifact instead", () => {
    const uploadStep = stepContaining("uses: actions/upload-artifact@");

    expect(uploadStep).toContain(reportGate);
    expect(uploadStep).toContain("\n          name: lore-test-report\n");
    expect(uploadStep).toContain("\n          path: lore-test-report.json\n");
    expect(uploadStep).toContain("\n          retention-days: 1\n");
    expect(uploadStep).toContain("\n          overwrite: true\n");
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

  // An origin that serves a checksums file naming every platform but this one
  // leaves the expected digest empty. Comparing an empty string would have
  // matched nothing and skipped the guard, so it is a mismatch outright.
  fetchIt("treats a checksums file with no linux-amd64 line as a mismatch", () => {
    const body = "the binary the origin vouches for";
    const { result, output, isExecutable } = runFetch({
      CURL_STUB_BODY: body,
      CURL_STUB_CHECKSUMS: checksumsFor(body, "linux-riscv64"),
      GITHUB_EVENT_NAME: "push",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::.*absent/m);
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
    const body = "the binary the origin vouches for";
    const { result, output, isExecutable } = runFetch({
      CURL_STUB_BODY: body,
      CURL_STUB_CHECKSUMS: checksumsFor(body),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/::(warning|error)::/);
    expect(output).toBe("fetched=true\n");
    expect(isExecutable).toBe(true);
  });
});

const report = { commit: "0123abc", branch: "feature/example", tests: [], results: [] };
const reportJson = `${JSON.stringify(report)}\n`;
const token = "example-ingest-token-0123456789";

const runSuite = (traceExit: number, env: Record<string, string>, stdout: string = reportJson) => {
  // Appended, never truncated: with `>` only the LAST invocation survives, so a
  // second call - a --post slipped into the pull_request path, say - would read
  // as the only one.
  const traceStub = `#!/usr/bin/env bash
printf 'call:%s\\n' "$*" >> trace-calls
printf 'LORE_API_URL=%s LORE_INGEST_TOKEN=%s\\n' "\${LORE_API_URL:-}" "\${LORE_INGEST_TOKEN:-}" >> trace-env
echo "[lore-code-trace] running" >&2
printf '%s' '${stdout}'
exit ${traceExit}
`;
  const { workDir, result, output } = runStepScript({
    prefix: "lore-tests-suite-",
    script: suiteRunBlock,
    stubs: { "lore-code-trace": traceStub },
    env: { LORE_API_URL: "https://lore-api.example.test", LORE_INGEST_TOKEN: token, ...env },
  });
  const read = (name: string): string | null => {
    const path = join(workDir, name);

    return existsSync(path) ? readFileSync(path, "utf8") : null;
  };

  return {
    result,
    output,
    reportFile: read("lore-test-report.json"),
    traceCalls: read("trace-calls"),
    traceEnv: read("trace-env"),
  };
};

describe("lore-tests.yml suite step on a push", () => {
  const push = { GITHUB_EVENT_NAME: "push" };

  it("posts the report through the binary and writes no report of its own", () => {
    const { result, output, reportFile, traceCalls, traceEnv } = runSuite(0, push);

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/::(warning|error)::/);
    expect(result.stderr).toContain("[lore-code-trace] running");
    expect(traceCalls).toBe("call:--post\n");
    expect(result.stdout + result.stderr).not.toContain(token);
    expect(traceEnv).toBe(
      `LORE_API_URL=https://lore-api.example.test LORE_INGEST_TOKEN=${token}\n`
    );
    expect(reportFile).toBeNull();
    expect(output).toBe("");
  });

  it("errors and exits 1 when the binary fails to run or to post", () => {
    const { result, output } = runSuite(1, push);

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::Lore test run or ingest failed/m);
    expect(output).toBe("");
  });

  it("errors and exits 1 without running the binary when LORE_API_URL is empty", () => {
    const { result, traceCalls } = runSuite(0, { ...push, LORE_API_URL: "" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::LORE_API_URL or LORE_INGEST_TOKEN is not configured/m);
    expect(traceCalls).toBeNull();
  });

  it("errors and exits 1 without running the binary when LORE_INGEST_TOKEN is empty", () => {
    const { result, traceCalls } = runSuite(0, { ...push, LORE_INGEST_TOKEN: "" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::LORE_API_URL or LORE_INGEST_TOKEN is not configured/m);
    expect(traceCalls).toBeNull();
  });
});

describe("lore-tests.yml suite step on a pull_request", () => {
  const pull = { GITHUB_EVENT_NAME: "pull_request", LORE_API_URL: "", LORE_INGEST_TOKEN: "" };

  it("runs the binary without --post and keeps its stdout as the report", () => {
    const { result, output, reportFile, traceCalls, traceEnv } = runSuite(0, pull);

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/::(warning|error)::/);
    expect(traceCalls).toBe("call:\n");
    expect(traceEnv).toBe("LORE_API_URL= LORE_INGEST_TOKEN=\n");
    expect(reportFile).toBe(reportJson);
    expect(output).toBe("report=true\n");
  });

  it("warns and exits 0 still marking report=true when lore-code-trace fails", () => {
    const { result, output, reportFile } = runSuite(1, pull);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::Lore test run failed/m);
    expect(output).toBe("report=true\n");
    expect(reportFile).toBe(reportJson);
  });

  it("marks no output when lore-code-trace fails having written an empty report", () => {
    const { result, output, reportFile } = runSuite(1, pull, "");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::Lore test run failed/m);
    expect(output).toBe("");
    expect(reportFile).toBe("");
  });

  it("posts nothing even when the token leaks into the environment", () => {
    const { result, output, traceCalls } = runSuite(0, {
      GITHUB_EVENT_NAME: "pull_request",
      LORE_INGEST_TOKEN: token,
    });

    expect(result.status).toBe(0);
    expect(traceCalls).toBe("call:\n");
    expect(output).toBe("report=true\n");
  });
});
