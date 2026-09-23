import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/lore-tests.yml"), "utf8");

const workflowBody = workflow.slice(workflow.indexOf("\nname: "));
const ingestJobStart = workflowBody.indexOf("\n  lore-tests-ingest:\n");

if (ingestJobStart < 0) {
  throw new Error("job not found in workflow: lore-tests-ingest");
}
const vitestJob = workflowBody.slice(0, ingestJobStart);
const ingestJob = workflowBody.slice(ingestJobStart);

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
const runStep = stepContaining("- name: Run test suite");
const postStep = stepContaining("- name: Post test report");
const fetchRunBlock = runBlockOf(fetchStep);
const suiteRunBlock = runBlockOf(runStep);
const postRunBlock = runBlockOf(postStep);
const pinnedSha256 = workflow.match(/^ {10}LORE_CODE_TRACE_SHA256: ([0-9a-f]{64})$/m)?.[1];
const fetchedGate = "if: steps.fetch.outputs.fetched == 'true'";
const reportGate = "if: always() && steps.run.outputs.report == 'true'";
const tokenBinding = "LORE_INGEST_TOKEN: ${{ secrets.LORE_INGEST_TOKEN }}";
const hasTool = (tool: string): boolean => spawnSync(tool, ["--version"]).status === 0;
const fetchIt = it.skipIf(!hasTool("sha256sum"));
const postIt = it.skipIf(!hasTool("jq"));

const curlStub = `#!/usr/bin/env bash
printf '%s\\n' "$@" > "\${CURL_STUB_ARGS:-/dev/null}"
[ "\${CURL_STUB_EXIT:-0}" = "0" ] || exit "\${CURL_STUB_EXIT}"
while [ $# -gt 1 ]; do
  [ "$1" = "-o" ] && printf '%s' "\${CURL_STUB_BODY:-}" > "$2"
  [ "$1" = "--data-binary" ] && cp "\${2#@}" "\${CURL_STUB_SENT:-/dev/null}"
  shift
done
printf '%s' "\${CURL_STUB_STATUS:-}"
exit 0
`;

const sha256Of = (body: string): string => createHash("sha256").update(body).digest("hex");

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
      LORE_CODE_TRACE_SHA256: pinnedSha256 ?? "",
      CURL_STUB_BODY: "not the pinned binary",
      ...env,
    },
  });
  const binaryPath = join(workDir, "lore-code-trace");
  const isExecutable = existsSync(binaryPath) && (statSync(binaryPath).mode & 0o111) !== 0;

  return { result, output, binaryExists: existsSync(binaryPath), isExecutable };
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

  it("gives the fetch step the id the gates read and interpolates no expression into any script", () => {
    expect(fetchStep).toContain("\n        id: fetch\n");
    expect([fetchRunBlock, suiteRunBlock, postRunBlock].join("\n")).not.toContain("${{");
  });

  it("gates the node install and the suite run on the fetch output and installs no browsers", () => {
    expect(stepContaining("uses: ./.github/actions/setup-node-install")).toContain(fetchedGate);
    expect(runStep).toContain(fetchedGate);
    expect(vitestJob).not.toMatch(/playwright/i);
  });

  it("pins every action to a 40-hex commit with its version, or uses a local action", () => {
    const uses = workflow.split("\n").filter((line) => line.includes("uses:"));

    expect(uses.length).toBeGreaterThanOrEqual(4);

    for (const line of uses) {
      expect(line).toMatch(
        /^\s+(- )?uses: (\.\/\.github\/actions\/[\w-]+|[\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+)$/
      );
    }
  });
});

describe("lore-tests.yml token scoping (issue 166)", () => {
  it("runs the binary without --post and with no env block in the suite step", () => {
    expect(workflowBody).not.toContain("--post");
    expect(runStep).toContain("\n        id: run\n");
    expect(runStep).toContain("\n        shell: bash\n");
    expect(runStep).not.toContain("env:");
    expect(suiteRunBlock).toContain("./lore-code-trace > lore-test-report.json");
  });

  it("binds LORE_INGEST_TOKEN in the post step only, never at job level", () => {
    expect(workflowBody.split(tokenBinding)).toHaveLength(2);
    expect(postStep).toContain(tokenBinding);
    expect(vitestJob).not.toContain("LORE_INGEST_TOKEN");
    expect(workflowBody).not.toMatch(/^ {4}env:$/m);
  });

  it("hands the report to a separate job through an artifact gated on the suite output", () => {
    const uploadStep = stepContaining("uses: actions/upload-artifact@");

    expect(uploadStep).toContain(reportGate);
    expect(uploadStep).toContain("\n          name: lore-test-report\n");
    expect(uploadStep).toContain("\n          path: lore-test-report.json\n");
    expect(uploadStep).toContain("\n          retention-days: 1\n");
    expect(uploadStep).toContain("\n          overwrite: true\n");
    expect(vitestJob).toContain("\n    outputs:\n      report: ${{ steps.run.outputs.report }}\n");
    expect(ingestJob).toContain("\n    needs: lore-tests-vitest\n");
    expect(ingestJob).toContain(
      "\n    if: always() && needs.lore-tests-vitest.outputs.report == 'true'\n"
    );
    expect(stepContaining("uses: actions/download-artifact@")).toContain(
      "\n          name: lore-test-report\n"
    );
  });

  it("checks out nothing and runs no repository code in the ingest job", () => {
    expect(ingestJob).not.toContain("actions/checkout");
    expect(ingestJob).not.toContain("setup-node-install");
    expect(ingestJob.match(/uses:/g)).toHaveLength(1);
    expect(postRunBlock).not.toMatch(/\.\/|\bnode\b|\bnpm\b|\bnpx\b/);
    expect(postStep).toContain("\n        shell: bash\n");
    expect(postStep).toContain("LORE_WEBHOOK_URL: ${{ vars.LORE_WEBHOOK_URL }}");
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

const report = { commit: "0123abc", branch: "feature/example", tests: [], results: [] };
const reportJson = `${JSON.stringify(report)}\n`;

const runSuite = (traceExit: number, eventName: string, stdout = reportJson) => {
  const traceStub = `#!/usr/bin/env bash
echo "[lore-code-trace] running" >&2
printf '%s' '${stdout}'
exit ${traceExit}
`;
  const { workDir, result, output } = runStepScript({
    prefix: "lore-tests-suite-",
    script: suiteRunBlock,
    stubs: { "lore-code-trace": traceStub },
    env: { GITHUB_EVENT_NAME: eventName },
  });
  const reportPath = join(workDir, "lore-test-report.json");

  return {
    result,
    output,
    reportFile: existsSync(reportPath) ? readFileSync(reportPath, "utf8") : null,
  };
};

describe("lore-tests.yml suite step", () => {
  it("writes the binary's stdout to lore-test-report.json and marks report=true on exit 0", () => {
    const { result, output, reportFile } = runSuite(0, "push");

    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/::(warning|error)::/);
    expect(result.stderr).toContain("[lore-code-trace] running");
    expect(output).toBe("report=true\n");
    expect(reportFile).toBe(reportJson);
  });

  it("warns and exits 0 still marking report=true when lore-code-trace fails in a pull_request", () => {
    const { result, output, reportFile } = runSuite(1, "pull_request");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::Lore test run failed/m);
    expect(output).toBe("report=true\n");
    expect(reportFile).toBe(reportJson);
  });

  it("warns and exits 1 still marking report=true when lore-code-trace fails in a push", () => {
    const { result, output, reportFile } = runSuite(1, "push");

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::Lore test run failed/m);
    expect(output).toBe("report=true\n");
    expect(reportFile).toBe(reportJson);
  });

  it("marks no output when lore-code-trace fails having written an empty report", () => {
    const { result, output, reportFile } = runSuite(1, "push", "");

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::Lore test run failed/m);
    expect(output).toBe("");
    expect(reportFile).toBe("");
  });
});

const token = "example-ingest-token-0123456789";

const runPost = (env: Record<string, string>, reportFile = reportJson) => {
  const { workDir, result, output } = runStepScript({
    prefix: "lore-tests-post-",
    script: postRunBlock,
    stubs: { curl: curlStub },
    files: { "lore-test-report.json": reportFile },
    env: {
      LORE_WEBHOOK_URL: "https://lore-webhook.example.test",
      LORE_INGEST_TOKEN: token,
      GITHUB_REPOSITORY: "example-org/example-repo",
      CURL_STUB_ARGS: "curl-args",
      CURL_STUB_SENT: "sent-body.json",
      CURL_STUB_STATUS: "202",
      CURL_STUB_BODY: '{"ingested":1}',
      ...env,
    },
  });
  const argsPath = join(workDir, "curl-args");
  const sentPath = join(workDir, "sent-body.json");
  const args = existsSync(argsPath) ? readFileSync(argsPath, "utf8").split("\n") : null;

  return {
    result,
    output,
    args,
    sent: existsSync(sentPath) ? JSON.parse(readFileSync(sentPath, "utf8")) : null,
  };
};

describe("lore-tests.yml post step", () => {
  postIt(
    "posts the report plus the repo slug with the token in a header file, exit 0 on 202 in a push",
    () => {
      const { result, args, sent } = runPost({ GITHUB_EVENT_NAME: "push" });
      const authArg = args?.find((arg) => arg.startsWith("@/"));

      expect(result.status).toBe(0);
      expect(result.stdout).not.toMatch(/::(warning|error)::/);
      expect(sent).toEqual({ ...report, repo: "example-org/example-repo" });
      expect(args).toContain("https://lore-webhook.example.test/api/webhook/ci-tests");
      expect(args).toContain("--retry");
      expect(args?.join("\n")).not.toContain(token);
      expect(args?.[args.indexOf(authArg ?? "") - 1]).toBe("-H");
      expect(existsSync((authArg ?? "@").slice(1))).toBe(false);
    }
  );

  postIt("prints the response body prefixed so it cannot forge a workflow command", () => {
    const { result } = runPost({ CURL_STUB_BODY: "::error::forged by the server" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("| ::error::forged by the server");
    expect(result.stdout).not.toMatch(/^::error::/m);
  });

  postIt("warns and exits 0 on a 503 in a pull_request", () => {
    const { result } = runPost({ CURL_STUB_STATUS: "503" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::Lore test ingest failed \(HTTP 503/m);
  });

  postIt("warns and exits 1 on a 503 in a push", () => {
    const { result } = runPost({ CURL_STUB_STATUS: "503", GITHUB_EVENT_NAME: "push" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::Lore test ingest failed \(HTTP 503/m);
  });

  postIt("warns as transient when curl exits 7 without a status, exit 1 in a push", () => {
    const { result } = runPost({ CURL_STUB_EXIT: "7", GITHUB_EVENT_NAME: "push" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::Lore test ingest failed \(HTTP 000/m);
  });

  postIt("reports curl exit 6 (unresolvable host) as ::error and exits 0 in a pull_request", () => {
    const { result } = runPost({ CURL_STUB_EXIT: "6" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::error::Lore test ingest could not reach .* \(curl exit 6\)/m);
  });

  postIt("reports a 401 as ::error and exits 0 in a pull_request", () => {
    const { result } = runPost({ CURL_STUB_STATUS: "401" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::error::Lore test ingest rejected \(HTTP 401/m);
  });

  postIt("reports a 401 as ::error and exits 1 in a push", () => {
    const { result } = runPost({ CURL_STUB_STATUS: "401", GITHUB_EVENT_NAME: "push" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::Lore test ingest rejected \(HTTP 401/m);
  });

  postIt("warns and exits 0 without calling curl when LORE_INGEST_TOKEN is empty", () => {
    const { result, args } = runPost({ LORE_INGEST_TOKEN: "" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /^::warning::LORE_WEBHOOK_URL or LORE_INGEST_TOKEN is not configured/m
    );
    expect(args).toBeNull();
  });

  postIt("exits 1 without calling curl when LORE_WEBHOOK_URL is empty in a push", () => {
    const { result, args } = runPost({ LORE_WEBHOOK_URL: "", GITHUB_EVENT_NAME: "push" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(
      /^::warning::LORE_WEBHOOK_URL or LORE_INGEST_TOKEN is not configured/m
    );
    expect(args).toBeNull();
  });

  postIt("warns and exits 0 without calling curl when the report is not JSON", () => {
    const { result, args } = runPost({}, "not json {");

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::Lore test report is not one JSON object/m);
    expect(args).toBeNull();
  });

  postIt("exits 1 without calling curl when the report holds two JSON values in a push", () => {
    const { result, args } = runPost({ GITHUB_EVENT_NAME: "push" }, `${reportJson}{"extra":1}\n`);

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::warning::Lore test report is not one JSON object/m);
    expect(args).toBeNull();
  });
});
