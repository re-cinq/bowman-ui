import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/lore-ingest.yml"), "utf8");

const extractIngestScript = (): string => {
  const lines = workflow.split("\n");
  const stepIndex = lines.findIndex((line) => line.trim() === "- name: Submit to Lore ingest API");
  const runIndex = lines.findIndex((line, index) => index > stepIndex && line.trim() === "run: |");
  const body: string[] = [];
  for (const line of lines.slice(runIndex + 1)) {
    if (line !== "" && !line.startsWith("          ")) break;
    body.push(line.slice(10));
  }
  return body
    .join("\n")
    .replaceAll("${{ github.repository }}", "re-cinq/bowman-ui")
    .replaceAll("${{ github.sha }}", "f".repeat(40));
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

const runIngestScript = (env: Record<string, string>) => {
  const workDir = mkdtempSync(join(tmpdir(), "lore-ingest-test-"));
  const scriptPath = join(workDir, "ingest.sh");
  const stubPath = join(workDir, "curl");
  writeFileSync(scriptPath, extractIngestScript());
  writeFileSync(stubPath, curlStub);
  chmodSync(stubPath, 0o755);
  return spawnSync("bash", ["-e", scriptPath], {
    encoding: "utf8",
    env: {
      PATH: `${workDir}:${process.env.PATH}`,
      TMPDIR: workDir,
      FILES: '["README.md"]',
      LORE_API_URL: "https://lore-api.example.test",
      LORE_INGEST_TOKEN: "test-token",
      ...env,
    },
  });
};

it("exits 1 with ::error when LORE_API_URL is empty", () => {
  const result = runIngestScript({ LORE_API_URL: "" });
  expect(result.status).toBe(1);
  expect(result.stdout).toContain("::error::LORE_API_URL");
});

it("exits 1 with ::error when LORE_INGEST_TOKEN is empty", () => {
  const result = runIngestScript({ LORE_INGEST_TOKEN: "" });
  expect(result.status).toBe(1);
  expect(result.stdout).toContain("::error::LORE_INGEST_TOKEN");
});

it("exits 0 and prints HTTP 200 on success without warnings", () => {
  const result = runIngestScript({ CURL_STUB_STATUS: "200" });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("HTTP 200");
  expect(result.stdout).not.toContain("::warning");
  expect(result.stdout).not.toContain("::error");
});

it("exits 1 with ::error and prints the response body on HTTP 401", () => {
  const result = runIngestScript({
    CURL_STUB_STATUS: "401",
    CURL_STUB_BODY: '{"error":"unauthorized"}',
  });
  expect(result.status).toBe(1);
  expect(result.stdout).toMatch(/^::error::/m);
  expect(result.stdout).toContain("401");
  expect(result.stdout).toContain("unauthorized");
});

it("exits 1 with ::error on HTTP 308 redirect", () => {
  const result = runIngestScript({ CURL_STUB_STATUS: "308" });
  expect(result.status).toBe(1);
  expect(result.stdout).toMatch(/^::error::/m);
  expect(result.stdout).toContain("308");
});

it("exits 0 with ::warning on HTTP 503", () => {
  const result = runIngestScript({ CURL_STUB_STATUS: "503" });
  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/^::warning::/m);
  expect(result.stdout).toContain("503");
});

it("exits 0 with ::warning on connection-refused curl exit 7", () => {
  const result = runIngestScript({ CURL_STUB_STATUS: "000", CURL_STUB_EXIT: "7" });
  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/^::warning::/m);
  expect(result.stdout).toContain("curl exit 7");
});

it("exits 1 with ::error on unresolvable host curl exit 6", () => {
  const result = runIngestScript({ CURL_STUB_STATUS: "000", CURL_STUB_EXIT: "6" });
  expect(result.status).toBe(1);
  expect(result.stdout).toMatch(/^::error::/m);
  expect(result.stdout).toContain("exit 6");
});

it("indents the response body so it cannot start a workflow command", () => {
  const result = runIngestScript({
    CURL_STUB_STATUS: "503",
    CURL_STUB_BODY: "::notice::injected",
  });
  expect(result.stdout).not.toMatch(/^::notice::/m);
  expect(result.stdout).toContain("  ::notice::injected");
});
