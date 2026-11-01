import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const script = resolve(process.cwd(), "scripts/check-audit.mjs");
const workspaces: string[] = [];

// A stub npm on PATH is the one seam: it answers `audit` and `explain` and keeps the arguments each was given.
const workspace = (report: string, exitCode = 1, explain = { answer: "", exitCode: 1 }): string => {
  const dir = mkdtempSync(join(tmpdir(), "check-audit-"));
  const stub = join(dir, "bin", "npm");

  workspaces.push(dir);
  mkdirSync(join(dir, "bin"));
  writeFileSync(
    stub,
    `#!/bin/sh\nif [ "$1" = explain ]; then\nprintf '%s\\n' "$@" > "${join(dir, "explain-args")}"\ncat <<'EXPLAIN'\n${explain.answer}\nEXPLAIN\nexit ${explain.exitCode}\nfi\nprintf '%s\\n' "$@" > "${join(dir, "npm-args")}"\ncat <<'REPORT'\n${report}\nREPORT\nexit ${exitCode}\n`
  );
  chmodSync(stub, 0o755);

  return dir;
};

const acknowledge = (dir: string, entries: unknown[]): void => {
  mkdirSync(join(dir, ".github"), { recursive: true });
  writeFileSync(join(dir, ".github", "audit-acknowledgements.json"), JSON.stringify(entries));
};

const run = (dir: string) => {
  const result = spawnSync(process.execPath, [script], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}` },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const advisory = (id: string, title: string) => ({
  source: 1,
  name: "left-pad",
  title,
  url: `https://github.com/advisories/${id}`,
  severity: "critical",
});

const leftPadReport = (via: unknown[]) =>
  JSON.stringify({
    vulnerabilities: {
      "left-pad": {
        name: "left-pad",
        severity: "critical",
        isDirect: true,
        via,
        range: "<1.3.0",
        nodes: ["node_modules/left-pad"],
        effects: [],
      },
    },
    metadata: { vulnerabilities: { critical: 1, high: 0, moderate: 0, low: 0 } },
  });

const critical = leftPadReport([advisory("GHSA-9999-9999-9999", "Remote code execution")]);

const acknowledgement = (id: string, expires = "2099-01-01") => ({
  advisory: id,
  package: "left-pad",
  why: "triaged, not reachable from this package",
  expires,
  acknowledged_by: "a maintainer",
});

afterAll(() => {
  for (const dir of workspaces) {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("asks npm for the whole tree, dev included: npm audit --json and no other argument", () => {
  const dir = workspace(critical);

  run(dir);

  expect(readFileSync(join(dir, "npm-args"), "utf8")).toBe("audit\n--json\n");
});

it("exits 1 on an unacknowledged critical advisory, naming its severity, package, installed version, range, GHSA id and a direct dependency", () => {
  const dir = workspace(critical);

  mkdirSync(join(dir, "node_modules", "left-pad"), { recursive: true });
  writeFileSync(
    join(dir, "node_modules", "left-pad", "package.json"),
    JSON.stringify({ version: "1.2.0" })
  );

  expect(run(dir)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining(
      "check-audit: critical: left-pad 1.2.0 installed, affected <1.3.0 — GHSA-9999-9999-9999 Remote code execution, a direct dependency"
    ),
  });
});

it("names the package a transitive finding is reached through, and fabricates no advisory when two packages reach each other", () => {
  const dir = workspace(
    JSON.stringify({
      vulnerabilities: {
        foo: {
          name: "foo",
          severity: "high",
          isDirect: true,
          range: "*",
          via: ["bar"],
          effects: [],
        },
        bar: {
          name: "bar",
          severity: "high",
          isDirect: false,
          range: "<2",
          via: [{ ...advisory("GHSA-aaaa-bbbb-cccc", "Prototype pollution"), name: "bar" }, "foo"],
          effects: ["foo"],
        },
      },
      metadata: { vulnerabilities: { critical: 0, high: 2 } },
    })
  );
  const { status, stderr } = run(dir);

  expect({
    status,
    findings: stderr.split("\n").filter((line) => line.startsWith("check-audit: high:")),
  }).toEqual({
    status: 1,
    findings: [
      "check-audit: high: foo not resolvable on disk installed, affected * — GHSA-aaaa-bbbb-cccc Prototype pollution, a direct dependency",
      "check-audit: high: bar not resolvable on disk installed, affected <2 — GHSA-aaaa-bbbb-cccc Prototype pollution, reached through foo",
    ],
  });
});

it("exits 0 when an acknowledgement names that advisory in that package", () => {
  const dir = workspace(critical);

  acknowledge(dir, [acknowledgement("GHSA-9999-9999-9999")]);

  expect(run(dir)).toMatchObject({
    status: 0,
    stdout: "check-audit: clean at high and above (1 critical), 1 acceptance(s).\n",
  });
});

it("lets an acknowledgement cover no other advisory in its package, and reports it as stale", () => {
  const dir = workspace(critical);

  acknowledge(dir, [acknowledgement("GHSA-1111-1111-1111")]);

  expect(run(dir)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining(
      'acceptance for GHSA-1111-1111-1111 in "left-pad" matches no current advisory'
    ),
  });
});

it("still exits 1 on a second unacknowledged advisory in an otherwise acknowledged package", () => {
  const dir = workspace(
    leftPadReport([
      advisory("GHSA-1111-1111-1111", "Prototype pollution"),
      advisory("GHSA-9999-9999-9999", "Remote code execution"),
    ])
  );

  acknowledge(dir, [acknowledgement("GHSA-1111-1111-1111")]);

  expect(run(dir)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining("GHSA-9999-9999-9999 Remote code execution"),
  });
});

it("exits 1 on an acknowledgement whose expiry has passed, naming it by advisory and package", () => {
  const dir = workspace(critical);

  acknowledge(dir, [acknowledgement("GHSA-9999-9999-9999", "2020-01-01")]);

  expect(run(dir)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining(
      'acceptance for GHSA-9999-9999-9999 in "left-pad" expired 2020-01-01'
    ),
  });
});

it("exits 1 on an acknowledgement missing one of its five fields", () => {
  const dir = workspace(critical);
  const unexplained = Object.fromEntries(
    Object.entries(acknowledgement("GHSA-9999-9999-9999")).filter(([field]) => field !== "why")
  );

  acknowledge(dir, [unexplained]);

  expect(run(dir)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining(".github/audit-acknowledgements.json[0] is missing why"),
  });
});

it("exits 0 on a clean report with no acknowledgements file", () => {
  const dir = workspace(
    JSON.stringify({
      vulnerabilities: {},
      metadata: { vulnerabilities: { critical: 0, high: 0 } },
    }),
    0
  );

  expect(run(dir)).toMatchObject({
    status: 0,
    stdout: "check-audit: clean at high and above (nothing reported), 0 acceptance(s).\n",
  });
});

it("refuses to report clean on npm's registry-failure document", () => {
  const dir = workspace(JSON.stringify({ error: { code: "E401", summary: "Unauthorized" } }));

  expect(run(dir)).toMatchObject({
    status: 1,
    stderr: expect.stringContaining("returned no vulnerability report"),
  });
});

it("refuses to report clean when npm prints no JSON at all", () => {
  expect(run(workspace("npm ERR! network timeout"))).toMatchObject({
    status: 1,
    stderr: expect.stringContaining("did not return JSON"),
  });
});

it("refuses a report carrying metadata counts but no vulnerabilities map", () => {
  const dir = workspace(
    JSON.stringify({ metadata: { vulnerabilities: { critical: 1, high: 0 } } })
  );

  expect(run(dir)).toMatchObject({ status: 1 });
});

it("reports an advisory reached twice through via once, not twice", () => {
  const shared = { ...advisory("GHSA-dddd-dddd-dddd", "Shared root cause"), severity: "high" };
  const dir = workspace(
    JSON.stringify({
      vulnerabilities: {
        top: { name: "top", severity: "high", isDirect: true, range: "*", via: ["left", "right"] },
        left: { name: "left", severity: "high", isDirect: false, range: "<2", via: [shared] },
        right: { name: "right", severity: "high", isDirect: false, range: "<3", via: [shared] },
      },
      metadata: { vulnerabilities: { critical: 0, high: 3 } },
    })
  );

  expect(
    run(dir)
      .stderr.split("\n")
      .filter((line) => line.includes("high: top "))
  ).toHaveLength(1);
});

it("keeps two advisories on one package apart when neither carries a GHSA url", () => {
  const dir = workspace(
    JSON.stringify({
      vulnerabilities: {
        p: {
          name: "p",
          severity: "high",
          isDirect: true,
          range: "*",
          via: [
            { source: 101, name: "p", title: "A", severity: "high" },
            { source: 101, name: "p", title: "B", severity: "high" },
          ],
        },
      },
      metadata: { vulnerabilities: { critical: 0, high: 1 } },
    })
  );

  expect(run(dir).stderr).toContain("npm:101:B");
});

// npm names a dependent in `effects` only when it is vulnerable too, so a transitive finding asks npm explain.
const deep = JSON.stringify({
  vulnerabilities: {
    deep: {
      name: "deep",
      severity: "high",
      isDirect: false,
      range: "<9",
      via: [{ ...advisory("GHSA-eeee-eeee-eeee", "Deep flaw"), name: "deep" }],
      nodes: ["node_modules/deep"],
      effects: [],
    },
  },
  metadata: { vulnerabilities: { critical: 0, high: 1 } },
});

it("says reached through an undisclosed path when npm explain cannot say which dependency pulls a transitive finding in", () => {
  const { status, stderr } = run(workspace(deep));

  expect({
    status,
    line: stderr.includes("Deep flaw, reached through an undisclosed path"),
  }).toEqual({
    status: 1,
    line: true,
  });
});

it("names the dependencies the project and its workspaces declare that pull a transitive finding in, as npm explain reports them", () => {
  // npm's own shape: the project root explains itself by location alone, and a workspace says it is one.
  const root = { location: "/project" };
  const edge = (name: string, from: object) => ({ type: "dev", name, spec: "*", from });
  const node = (name: string, location: string, dependents: object[]) => ({
    name,
    version: "1.0.0",
    location,
    isWorkspace: false,
    dependents,
  });
  const workspaceNode = (name: string, location: string, dependents: object[]) => ({
    ...node(name, location, dependents),
    isWorkspace: true,
  });
  const answer = JSON.stringify([
    node("deep", "node_modules/deep", [
      edge(
        "deep",
        node("mid", "node_modules/mid", [
          edge("mid", node("glob", "node_modules/glob", [edge("glob", root)])),
          edge("mid", node("eslint", "node_modules/eslint", [edge("eslint", root)])),
          edge("mid", workspaceNode("@acme/web", "packages/web", [edge("@acme/web", root)])),
        ])
      ),
    ]),
  ]);
  const dir = workspace(deep, 1, { answer, exitCode: 0 });

  const { stderr } = run(dir);

  expect({
    line: stderr.split("\n").find((line) => line.startsWith("check-audit: high:")),
    explained: readFileSync(join(dir, "explain-args"), "utf8"),
  }).toEqual({
    line: "check-audit: high: deep not resolvable on disk installed, affected <9 — GHSA-eeee-eeee-eeee Deep flaw, reached through eslint, glob, mid",
    explained: "explain\nnode_modules/deep\n--json\n",
  });
});
