#!/usr/bin/env node
// Re-points specs' [validated by](../../tests/X.test.tsx#Lnn) anchors after
// test-file edits (the drift class of issue 36): each anchor's line number is
// resolved to the content it cited in the base ref's copy of the test file,
// that content is found in the working copy, and the anchor is rewritten to
// the nearest exact match.
//
// Usage:
//   node scripts/repoint-spec-anchors.mjs [--check] [base-ref]
//
// base-ref defaults to origin/main and must be the baseline the anchors were
// last correct against. Baseline line numbers are read from the base ref's
// copy of each spec, never from the working copy, so re-running against the
// same baseline is a no-op instead of a second translation. A spec whose
// anchor set (the ordered list of test paths it cites) differs from the base
// ref is skipped whole: its anchors were authored against the working tree,
// and no baseline exists to repoint them from.
//
// --check rewrites nothing and exits 1 when any anchor is stale (its baseline
// content now lives on a different line) or unresolved (that content no
// longer exists). Without --check, stale anchors are rewritten in place and
// unresolved ones are reported for manual fix with exit 1.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import process from "node:process";

const ANCHOR = /((?:\.\.\/)+tests\/[\w./-]+\.(?:tsx|ts))#L(\d+)/g;

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const positional = args.filter((arg) => !arg.startsWith("--"));
if (flags.some((flag) => flag !== "--check") || positional.length > 1) {
  process.stderr.write("usage: repoint-spec-anchors.mjs [--check] [base-ref]\n");
  process.exit(2);
}
const checkMode = flags.includes("--check");
const baseRef = positional[0] ?? "origin/main";

const root = process.cwd();

const refResolves = () => {
  try {
    execFileSync("git", ["rev-parse", "--verify", "--quiet", `${baseRef}^{commit}`], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};
if (!refResolves()) {
  process.stderr.write(`base ref does not resolve to a commit: ${baseRef}\n`);
  process.exit(2);
}

const readBaseFile = (path) => {
  try {
    return execFileSync("git", ["show", `${baseRef}:${path}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
};

const baseFileCache = new Map();
const baseFile = (path) => {
  if (!baseFileCache.has(path)) baseFileCache.set(path, readBaseFile(path));
  return baseFileCache.get(path);
};

const workingFileCache = new Map();
const workingFile = (path) => {
  if (workingFileCache.has(path)) return workingFileCache.get(path);
  const fullPath = join(root, path);
  const content = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : null;
  workingFileCache.set(path, content);
  return content;
};

const extractAnchors = (source) =>
  [...source.matchAll(ANCHOR)].map((match) => ({ path: match[1], line: Number(match[2]) }));

const sameAnchorPaths = (a, b) =>
  a.length === b.length && a.every((anchor, index) => anchor.path === b[index].path);

// Resolves one anchor: the content its baseline line held at the base ref,
// located in the working copy of the same test file, nearest match first
// (ties go to the smaller line number). Returns { expectedLine } or
// { failure } with the reason a manual fix is needed.
const resolveAnchor = (anchor, baselineLine, specDir) => {
  const testPath = normalize(join(specDir, anchor.path));
  const base = baseFile(testPath);
  if (base === null) return { failure: `${testPath} does not exist at ${baseRef}` };
  const working = workingFile(testPath);
  if (working === null) return { failure: `${testPath} does not exist in the working tree` };
  const target = base.split("\n")[baselineLine - 1];
  if (target === undefined) {
    return { failure: `#L${baselineLine} is beyond the end of ${testPath} at ${baseRef}` };
  }
  const candidates = working
    .split("\n")
    .flatMap((line, index) => (line === target ? [index + 1] : []));
  if (candidates.length === 0) {
    return { failure: `"${target.trim().slice(0, 70)}" no longer exists in ${testPath}` };
  }
  candidates.sort((a, b) => Math.abs(a - baselineLine) - Math.abs(b - baselineLine) || a - b);
  return { expectedLine: candidates[0] };
};

const specFiles = [
  ...readdirSync(join(root, "specs"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `specs/${entry.name}/spec.md`)
    .sort(),
  ".specify/spec.md",
].filter((spec) => existsSync(join(root, spec)));

let moved = 0;
let upToDate = 0;
const unresolved = [];
const staleDetails = [];

for (const spec of specFiles) {
  const source = readFileSync(join(root, spec), "utf8");
  const anchors = extractAnchors(source);
  if (anchors.length === 0) continue;
  const baseSpec = baseFile(spec);
  if (baseSpec === null) {
    process.stderr.write(`skipped ${spec}: not present at ${baseRef}\n`);
    continue;
  }
  const baseAnchors = extractAnchors(baseSpec);
  if (!sameAnchorPaths(anchors, baseAnchors)) {
    process.stderr.write(
      `skipped ${spec}: anchor set differs from ${baseRef} (anchors are taken as authored against the working tree)\n`
    );
    continue;
  }
  const specDir = dirname(spec);
  const resolutions = anchors.map((anchor, index) =>
    resolveAnchor(anchor, baseAnchors[index].line, specDir)
  );
  resolutions.forEach((resolution, index) => {
    const anchor = anchors[index];
    if (resolution.failure) {
      unresolved.push(`${spec}: ${anchor.path}#L${anchor.line} -> ${resolution.failure}`);
      return;
    }
    if (resolution.expectedLine === anchor.line) {
      upToDate += 1;
      return;
    }
    moved += 1;
    staleDetails.push(`${spec}: ${anchor.path}#L${anchor.line} -> #L${resolution.expectedLine}`);
  });
  if (checkMode) continue;
  let occurrence = -1;
  const rewritten = source.replace(ANCHOR, (whole, relPath) => {
    occurrence += 1;
    const resolution = resolutions[occurrence];
    if (resolution.failure || resolution.expectedLine === anchors[occurrence].line) return whole;
    return `${relPath}#L${resolution.expectedLine}`;
  });
  if (rewritten !== source) writeFileSync(join(root, spec), rewritten);
}

const movedLabel = checkMode ? "stale" : "repointed";
process.stdout.write(
  `${movedLabel}: ${moved}, up to date: ${upToDate}, unresolved: ${unresolved.length}\n`
);
if (checkMode) {
  for (const detail of staleDetails) process.stderr.write(`stale ${detail}\n`);
}
for (const detail of unresolved) process.stderr.write(`unresolved ${detail}\n`);

const failed = unresolved.length > 0 || (checkMode && moved > 0);
process.exit(failed ? 1 : 0);
