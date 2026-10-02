import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { git, gitOut, initRepo, writeInRepo } from "./helpers/script-runner.js";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/lore-ingest.yml"), "utf8");
const scriptPath = resolve(process.cwd(), "scripts/lore-post.sh");

const lines = workflow.split("\n");

const stepIndexOf = (stepName: string): number => {
  const stepIndex = lines.findIndex((line) => line.trim() === `- name: ${stepName}`);

  if (stepIndex === -1) {
    throw new Error(`step not found in workflow: ${stepName}`);
  }

  return stepIndex;
};

const extractRunBlock = (stepName: string): string => {
  const stepIndex = stepIndexOf(stepName);
  const runIndex = lines.findIndex((line, index) => index > stepIndex && line.trim() === "run: |");
  const body: string[] = [];

  for (const line of lines.slice(runIndex + 1)) {
    if (line !== "" && !line.startsWith("          ")) {
      break;
    }
    body.push(line.slice(10));
  }

  return body.join("\n");
};

const extractStepEnv = (stepName: string): string => {
  const stepIndex = stepIndexOf(stepName);
  const envIndex = lines.findIndex((line, index) => index > stepIndex && line.trim() === "env:");
  const runIndex = lines.findIndex((line, index) => index > stepIndex && line.trim() === "run: |");

  return lines.slice(envIndex + 1, runIndex).join("\n");
};

const extractBlock = (opener: string): string[] => {
  const openerIndex = lines.indexOf(opener);

  if (openerIndex === -1) {
    throw new Error(`block not found in workflow: ${opener}`);
  }

  const closerIndex = lines.findIndex((line, index) => index > openerIndex && line === "");

  if (closerIndex === -1) {
    throw new Error(`block has no closing blank line in workflow: ${opener}`);
  }

  return lines.slice(openerIndex + 1, closerIndex);
};

const triggerPaths = extractBlock("    paths:").map((line) =>
  line.trim().replace(/^- "(.*?)(\/\*\*)?"$/, "$1")
);

const zeroSha = "0".repeat(40);

const commitFile = (repo: string, path: string): string => {
  writeInRepo(repo, path, `${path} at commit\n`);
  git(repo, "add", "-A");
  git(repo, "commit", "-q", "-m", `touch ${path}`);

  return gitOut(repo, "rev-parse", "HEAD");
};

const runChangedFilesStep = (repo: string, before: string): string[] => {
  const outputPath = join(repo, "github-output");
  const result = spawnSync("bash", ["-e", "-c", extractRunBlock("Get changed files")], {
    cwd: repo,
    encoding: "utf8",
    env: {
      ...process.env,
      BEFORE: before,
      AFTER: gitOut(repo, "rev-parse", "HEAD"),
      GITHUB_OUTPUT: outputPath,
    },
  });

  expect(result).toMatchObject({ status: 0 });

  const output = readFileSync(outputPath, "utf8").trim();

  return JSON.parse(output.replace(/^files=/, "")) as string[];
};

const curlStub = `#!/usr/bin/env bash
out=""
prev=""
for arg in "$@"; do
  if [ "$prev" = "-o" ]; then out="$arg"; fi
  prev="$arg"
done
if [ -n "$out" ]; then printf '%s' "\${CURL_STUB_BODY:-}" > "$out"; fi
printf '%s' "\${CURL_STUB_STATUS:-000}"
exit "\${CURL_STUB_EXIT:-0}"
`;

const runLorePost = (env: Record<string, string>) => {
  const workDir = mkdtempSync(join(tmpdir(), "lore-ingest-test-"));
  const stubPath = join(workDir, "curl");

  writeFileSync(stubPath, curlStub);
  chmodSync(stubPath, 0o755);

  return spawnSync(
    "bash",
    [
      "-e",
      scriptPath,
      "/api/ingest",
      '{"files": ["README.md"], "repo": "re-cinq/bowman-ui", "commit": "' + "f".repeat(40) + '"}',
      "context was NOT ingested",
    ],
    {
      encoding: "utf8",
      env: {
        PATH: `${workDir}:${process.env.PATH}`,
        TMPDIR: workDir,
        FILES: '["README.md"]',
        LORE_INGEST_URL: "https://lore-api.example.test",
        LORE_INGEST_TOKEN: "test-token",
        ...env,
      },
    }
  );
};

describe("scripts/lore-post.sh", () => {
  it("exits 1 with ::error when LORE_INGEST_URL is empty", () => {
    const result = runLorePost({ LORE_INGEST_URL: "" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("::error::LORE_INGEST_URL");
  });

  it("exits 1 with ::error when LORE_INGEST_TOKEN is empty", () => {
    const result = runLorePost({ LORE_INGEST_TOKEN: "" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("::error::LORE_INGEST_TOKEN");
  });

  it("exits 0 and prints HTTP 200 on success without warnings", () => {
    const result = runLorePost({ CURL_STUB_STATUS: "200" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("HTTP 200");
    expect(result.stdout).not.toContain("::warning");
    expect(result.stdout).not.toContain("::error");
  });

  it("exits 1 with ::error and prints the response body on HTTP 401", () => {
    const result = runLorePost({
      CURL_STUB_STATUS: "401",
      CURL_STUB_BODY: '{"error":"unauthorized"}',
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::/m);
    expect(result.stdout).toContain("401");
    expect(result.stdout).toContain("unauthorized");
  });

  it("exits 1 with ::error on HTTP 308 redirect", () => {
    const result = runLorePost({ CURL_STUB_STATUS: "308" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::/m);
    expect(result.stdout).toContain("308");
  });

  it("exits 0 with ::warning on HTTP 503", () => {
    const result = runLorePost({ CURL_STUB_STATUS: "503" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::/m);
    expect(result.stdout).toContain("503");
  });

  it("exits 0 with ::warning on connection-refused curl exit 7", () => {
    const result = runLorePost({ CURL_STUB_STATUS: "000", CURL_STUB_EXIT: "7" });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^::warning::/m);
    expect(result.stdout).toContain("curl exit 7");
  });

  it("exits 1 with ::error on unresolvable host curl exit 6", () => {
    const result = runLorePost({ CURL_STUB_STATUS: "000", CURL_STUB_EXIT: "6" });

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^::error::/m);
    expect(result.stdout).toContain("exit 6");
  });

  it("prefixes the response body so it cannot forge a workflow command even after TrimStart", () => {
    const result = runLorePost({
      CURL_STUB_STATUS: "503",
      CURL_STUB_BODY: "::notice::injected",
    });

    expect(result.stdout).not.toMatch(/^\s*::notice::/m);
    expect(result.stdout).toContain("| ::notice::injected");
  });
});

describe("workflow wiring", () => {
  it("invokes scripts/lore-post.sh from the ingest step with the /api/ingest endpoint and failure noun", () => {
    const runBlock = extractRunBlock("Notify Lore to ingest");

    expect(runBlock).toContain("scripts/lore-post.sh");
    expect(runBlock).toContain("/api/ingest");
    expect(runBlock).toContain("context was NOT ingested");
    expect(runBlock).toContain("${FILES}");
    expect(runBlock).toContain("${{ github.repository }}");
    expect(runBlock).toContain("${{ github.sha }}");
  });

  it("declares LORE_INGEST_URL and LORE_INGEST_TOKEN as secrets, and FILES, on the ingest step", () => {
    const env = extractStepEnv("Notify Lore to ingest");

    expect(env).toContain("LORE_INGEST_TOKEN: ${{ secrets.LORE_INGEST_TOKEN }}");
    expect(env).toContain("LORE_INGEST_URL: ${{ secrets.LORE_INGEST_URL }}");
    expect(env).toContain("FILES: ${{ steps.changes.outputs.files }}");
  });

  it("fetches lore-code-trace with a secret-only URL, no vars fallback", () => {
    const env = extractStepEnv("Fetch lore-code-trace");
    const runBlock = extractRunBlock("Fetch lore-code-trace");

    expect(env).toContain("LORE_INGEST_TOKEN: ${{ secrets.LORE_INGEST_TOKEN }}");
    expect(env).toContain("LORE_INGEST_URL: ${{ secrets.LORE_INGEST_URL }}");
    expect(env).not.toContain("vars.");
    expect(runBlock).toContain("/dist/lore-code-trace/");
    expect(runBlock).toContain("sha256sum -c -");
  });

  it("projects specs and ADRs with lore-code-trace docs --post, no longer posting to ingest-graph", () => {
    const env = extractStepEnv("Project specs and ADRs into the graph");
    const runBlock = extractRunBlock("Project specs and ADRs into the graph");

    expect(env).toContain("LORE_API_URL: ${{ secrets.LORE_INGEST_URL }}");
    expect(env).not.toContain("vars.");
    expect(runBlock).toContain("./lore-code-trace docs --post");
    expect(runBlock).not.toContain("ingest-graph");
    expect(runBlock.indexOf("./lore-code-trace docs |")).toBeLessThan(
      runBlock.indexOf("./lore-code-trace docs --post")
    );
  });

  it("passes the push's before and after commits to the changed-files step", () => {
    const env = extractStepEnv("Get changed files");

    expect(env).toContain("BEFORE: ${{ github.event.before }}");
    expect(env).toContain("AFTER: ${{ github.event.after }}");
  });

  it("scopes the changed-files diff to the pathspec of on.push.paths", () => {
    expect(triggerPaths).toEqual([
      "CLAUDE.md",
      "AGENTS.md",
      "adrs",
      "runbooks",
      "specs",
      "teams",
      ".specify",
      "tests",
      "examples/chat-demo/tests",
    ]);
    expect(extractRunBlock("Get changed files")).toContain(`-- ${triggerPaths.join(" ")}`);
  });

  it("checks the ingest job out with the full history the before..after diff needs", () => {
    const ingestJob = lines.slice(lines.indexOf("  ingest:"), lines.indexOf("  graph:"));

    expect(ingestJob).toContain("          fetch-depth: 0");
  });

  it("checks the graph job out with the full history the delta diff needs", () => {
    const graphJob = lines.slice(lines.indexOf("  graph:"));

    expect(graphJob).toContain("          fetch-depth: 0");
  });

  it("serialises runs in one lore-ingest concurrency group without cancelling the running one", () => {
    expect(extractBlock("concurrency:")).toEqual([
      "  group: lore-ingest",
      "  cancel-in-progress: false",
    ]);
  });

  it("grants the workflow contents: read and nothing else", () => {
    expect(extractBlock("permissions:")).toEqual(["  contents: read"]);
  });

  it("pins every action to a 40-hex commit SHA with its version comment", () => {
    const uses = lines.filter((line) => line.includes("uses:"));

    expect(uses.length).toBeGreaterThan(0);

    for (const line of uses) {
      expect(line).toMatch(/^\s+- uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    }
  });
});

describe("the graph job's fetch step", () => {
  const script = extractRunBlock("Fetch lore-code-trace");

  const runFetchStep = (env: Record<string, string>) => {
    const workDir = mkdtempSync(join(tmpdir(), "lore-ingest-fetch-test-"));
    const stubPath = join(workDir, "curl");

    writeFileSync(stubPath, curlStub);
    chmodSync(stubPath, 0o755);

    return {
      workDir,
      result: spawnSync("bash", ["-e", "-c", script], {
        encoding: "utf8",
        cwd: workDir,
        env: {
          PATH: `${workDir}:${process.env.PATH}`,
          LORE_INGEST_URL: "https://lore.example.test",
          LORE_INGEST_TOKEN: "test-ingest-token",
          ...env,
        },
      }),
    };
  };

  it("exits 1 with ::error when LORE_INGEST_URL is empty", () => {
    const { result } = runFetchStep({ LORE_INGEST_URL: "" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("::error::LORE_INGEST_URL");
  });

  it("exits 1 with ::error when LORE_INGEST_TOKEN is empty", () => {
    const { result } = runFetchStep({ LORE_INGEST_TOKEN: "" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("::error::LORE_INGEST_TOKEN");
  });

  it("exits 0 with ::warning and leaves no binary behind when Lore cannot be reached", () => {
    const { result, workDir } = runFetchStep({ CURL_STUB_EXIT: "22" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("::warning::");
    expect(existsSync(join(workDir, "lore-code-trace"))).toBe(false);
  });

  it("fails and leaves no executable when the binary does not match its checksum", () => {
    const { result, workDir } = runFetchStep({ CURL_STUB_BODY: "not a checksum list" });

    expect(result.status).not.toBe(0);
    expect(existsSync(join(workDir, "lore-code-trace"))).toBe(false);
  });
});

describe("Get changed files step", () => {
  let repo: string;

  beforeEach(() => {
    repo = initRepo(mkdtempSync(join(tmpdir(), "lore-ingest-changes-")));
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it("lists the watched files of every commit of a three-commit push, ignoring unwatched paths", () => {
    const before = commitFile(repo, "specs/a/spec.md");

    commitFile(repo, "CLAUDE.md");
    commitFile(repo, "adrs/001.md");
    commitFile(repo, "src/index.ts");

    expect(runChangedFilesStep(repo, before)).toEqual(["CLAUDE.md", "adrs/001.md"]);
  });

  it("lists the whole watched corpus when before is all zeros", () => {
    commitFile(repo, "specs/a/spec.md");
    commitFile(repo, "src/index.ts");
    commitFile(repo, ".specify/spec.md");

    expect(runChangedFilesStep(repo, zeroSha)).toEqual([".specify/spec.md", "specs/a/spec.md"]);
  });

  it("lists changed files under tests/ and examples/chat-demo/tests/, still ignoring src/", () => {
    const before = commitFile(repo, "specs/a/spec.md");

    commitFile(repo, "tests/added.test.ts");
    commitFile(repo, "examples/chat-demo/tests/added.spec.ts");
    commitFile(repo, "src/index.ts");

    expect(runChangedFilesStep(repo, before)).toEqual([
      "examples/chat-demo/tests/added.spec.ts",
      "tests/added.test.ts",
    ]);
  });
});
