#!/usr/bin/env node
// Re-anchors the `[label](../../path#Lnn)` links in specs/*/spec.md,
// .specify/spec.md and adrs/*.md after this branch edits a cited repository
// file (the drift class of issues 36 and 37). Deterministic, no content
// search (docs/design-notes.md § Lint guardrails decision 14):
//
// - A link labelled `[validated by <title>]` into a test file moves to the
//   line of the one `it()`/`test()` carrying that title, unless the anchor
//   already lies inside that test's span. A title two tests carry is reported;
//   a title no test carries falls through to the hunk mapping below.
// - Every other link - the untitled `[validated by]`, `[Lnnn]` and
//   descriptive forms, and every link into a non-test file (a script, README,
//   a doc, a workflow, a config) - is paired with its copy in the merge base's
//   version of the markdown and mapped through the `git diff -U0` hunks of the
//   cited file from that merge base. Reading the merge-base copy, never the
//   working one, makes a second run a no-op.
// - A link whose cited line the diff deleted or rewrote is reported for a
//   manual fix. A link this branch added, or whose href this branch edited by
//   hand, has no base anchor to map from and is kept as authored.
//
// Scope: only links into files this branch changed against the merge base
// (committed, staged, unstaged or untracked), so a pull request never carries
// unrelated spec churn; --all extends the title relocation to every link.
// Independent of scope, every anchor must land on an existing, content-carrying
// line (issue 46), and a bare `[Lnnn]` label must name its own href's line
// (issue 18): a plain run syncs the label, --check reports it.
//
// Usage:
//   node scripts/reanchor-spec-links.mjs [--check] [--all] [base-ref]
//
// base-ref defaults to origin/main; the merge base of it and HEAD is the
// baseline. --check rewrites nothing and exits 1 when any link would move or
// any label disagrees with its href. Both modes exit 1 on an unmapped or
// rotten link, and 2 on a bad flag or a base ref that does not resolve.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, posix } from "node:path";
import process from "node:process";
import { parseFlags } from "./lib/cli-args.mjs";
import { listSpecDocs } from "./lib/spec-corpus.mjs";

const USAGE = "usage: reanchor-spec-links.mjs [--check] [--all] [base-ref]";

const LINK = /\[([^\]]*)\]\(((?:\.\.\/)+[^)#\s]+)#L(\d+)\)/g;
const DECLARATION =
  /^\s*(?:it|test)(?:\.(?:only|skip|todo|concurrent|sequential|fails))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const TEST_PATH = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const TITLED_LABEL = /^validated by\s+(\S[\s\S]*)$/;
const LINE_LABEL = /^L\d+$/;
const CONTENTLESS = /^[)\]}>,;]*$/;

const { flags, positional } = parseFlags(process.argv.slice(2), ["--check", "--all"], USAGE);

if (positional.length > 1) {
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}
const checkMode = flags.includes("--check");
const sweepAll = flags.includes("--all");
const baseRef = positional[0] ?? "origin/main";
const root = process.cwd();

const git = (args) => {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    return null;
  }
};

if (git(["rev-parse", "--verify", "--quiet", `${baseRef}^{commit}`]) === null) {
  process.stderr.write(`base ref does not resolve to a commit: ${baseRef}\n`);
  process.exit(2);
}
const mergeBase = git(["merge-base", baseRef, "HEAD"])?.trim();

if (!mergeBase) {
  process.stderr.write(`no merge base between ${baseRef} and HEAD\n`);
  process.exit(2);
}

const lines = (text) => text.split("\n");

const changedPaths = new Set(
  lines(
    `${git(["diff", "--name-only", mergeBase]) ?? ""}\n${git(["ls-files", "--others", "--exclude-standard"]) ?? ""}`
  ).filter(Boolean)
);

const workingCache = new Map();
const workingFile = (path) => {
  if (!workingCache.has(path)) {
    const full = join(root, path);
    const isFile = !path.startsWith("..") && existsSync(full) && statSync(full).isFile();

    workingCache.set(path, isFile ? readFileSync(full, "utf8") : null);
  }

  return workingCache.get(path);
};

const hunkCache = new Map();
const hunksFor = (path) => {
  if (!hunkCache.has(path)) {
    const diff = git(["diff", "-U0", mergeBase, "--", path]) ?? "";

    hunkCache.set(
      path,
      [...diff.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)].map((match) => ({
        oldStart: Number(match[1]),
        oldCount: match[2] === undefined ? 1 : Number(match[2]),
        newCount: match[4] === undefined ? 1 : Number(match[4]),
      }))
    );
  }

  return hunkCache.get(path);
};

// A merge-base line's line in the working copy, or null when a hunk deleted or rewrote it.
const mapLine = (line, hunks) => {
  let shift = 0;

  for (const hunk of hunks) {
    const insertionAfter = hunk.oldCount === 0 && line <= hunk.oldStart;

    if (insertionAfter || line < hunk.oldStart) {
      return line + shift;
    }

    if (line < hunk.oldStart + hunk.oldCount) {
      return null;
    }
    shift += hunk.newCount - hunk.oldCount;
  }

  return line + shift;
};

const declarationsCache = new Map();
const declarationsIn = (path) => {
  if (!declarationsCache.has(path)) {
    const found = lines(workingFile(path) ?? "").flatMap((text, index) => {
      const match = DECLARATION.exec(text);

      return match
        ? [{ title: normalizeTitle(match[2].replace(/\\(.)/g, "$1")), line: index + 1 }]
        : [];
    });

    declarationsCache.set(path, found);
  }

  return declarationsCache.get(path);
};

const normalizeTitle = (title) =>
  title
    .replace(/^`([\s\S]*)`$/, "$1")
    .replace(/\s+/g, " ")
    .trim();

const titleOf = (label) => {
  const match = TITLED_LABEL.exec(label.trim());

  return match ? normalizeTitle(match[1]) : null;
};

// Title lookup: the declaration's line, the unchanged anchor when it already
// lies inside that test, a failure for a shared title, or null to fall through.
const byTitle = (link) => {
  const title = titleOf(link.label);

  if (title === null || !TEST_PATH.test(link.target)) {
    return null;
  }
  const declarations = declarationsIn(link.target);
  const index = declarations.findIndex((declaration) => declaration.title === title);

  if (index === -1) {
    return null;
  }

  if (declarations.some((declaration, other) => other !== index && declaration.title === title)) {
    return { failure: `several tests carry the title "${title}"` };
  }
  const start = declarations[index].line;
  const end = declarations[index + 1]?.line ?? Infinity;

  return { line: link.line >= start && link.line < end ? link.line : start };
};

const byHunks = (link) => {
  if (link.baseLine === null) {
    return { authored: true };
  }
  const mapped = mapLine(link.baseLine, hunksFor(link.target));
  const untouched = link.line === link.baseLine;

  if (mapped === null) {
    return untouched
      ? { failure: `#L${link.baseLine} was deleted or rewritten on this branch` }
      : { authored: true };
  }

  return untouched || link.line === mapped ? { line: mapped } : { authored: true };
};

const resolve = (link) => {
  if (!sweepAll && !changedPaths.has(link.target)) {
    return { outOfScope: true };
  }

  return byTitle(link) ?? byHunks(link);
};

const rottenReason = (link, line) => {
  const content = workingFile(link.target);

  if (content === null) {
    return `${link.target} does not exist in the working tree`;
  }
  const text = lines(content)[line - 1];

  if (text === undefined) {
    return `#L${line} is beyond the end of ${link.target}`;
  }

  return CONTENTLESS.test(text.trim()) ? `#L${line} lands on a blank or closing line` : null;
};

const linksIn = (markdownLines, docPath) =>
  markdownLines.map((text, lineIndex) =>
    [...text.matchAll(LINK)].map((match) => ({
      label: match[1],
      linkPath: match[2],
      line: Number(match[3]),
      target: posix.normalize(posix.join(posix.dirname(docPath), match[2])),
      lineIndex,
    }))
  );

// Lines compare with every #Lnn and [Lnnn] label blanked, so the re-anchor's own
// rewrites never make a markdown line differ from its merge-base copy.
const comparable = (text) => text.replace(/#L\d+\)/g, "#L)").replace(/\[L\d+\]\(/g, "[L](");

const pairKey = (link) => `${LINE_LABEL.test(link.label) ? "L" : link.label}\0${link.target}`;

// Longest common subsequence of the two docs' comparable lines, as
// [baseIndex, workingIndex] pairs in order.
const matchedLines = (baseLines, workingLines) => {
  const base = baseLines.map(comparable);
  const working = workingLines.map(comparable);
  const table = Array.from({ length: base.length + 1 }, () => new Uint32Array(working.length + 1));

  for (let i = base.length - 1; i >= 0; i -= 1) {
    for (let j = working.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        base[i] === working[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;

  while (i < base.length && j < working.length) {
    if (base[i] === working[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return pairs;
};

const stretch = (byLine, from, to) => byLine.slice(from + 1, to).flat();

// Links on an unchanged line pair by position; links in an edited stretch pair
// by label and target, in order, only when both sides carry the same number.
const pairWithBase = (workingLinks, baseLinks, baseLines, workingLines) => {
  const pairs = [...matchedLines(baseLines, workingLines), [baseLines.length, workingLines.length]];
  let previous = [-1, -1];

  for (const [baseIndex, workingIndex] of pairs) {
    const baseGroups = Map.groupBy(stretch(baseLinks, previous[0], baseIndex), pairKey);

    for (const [key, group] of Map.groupBy(
      stretch(workingLinks, previous[1], workingIndex),
      pairKey
    )) {
      const baseGroup = baseGroups.get(key) ?? [];

      if (baseGroup.length === group.length) {
        group.forEach((link, index) => (link.baseLine = baseGroup[index].line));
      }
    }
    (workingLinks[workingIndex] ?? []).forEach(
      (link, index) => (link.baseLine = baseLinks[baseIndex][index].line)
    );
    previous = [baseIndex, workingIndex];
  }
};

const docs = listSpecDocs(root, { includeSystemSpec: true, includeAdrs: true }).filter((doc) =>
  existsSync(join(root, doc))
);
const counts = { moved: 0, upToDate: 0, authored: 0, outOfScope: 0, relabelled: 0 };
const reports = { moved: [], unmapped: [], rotten: [], mislabelled: [] };

for (const doc of docs) {
  const source = readFileSync(join(root, doc), "utf8");
  const workingLines = lines(source);
  const workingLinks = linksIn(workingLines, doc);
  const baseSource = git(["show", `${mergeBase}:${doc}`]);
  const baseLines = baseSource === null ? [] : lines(baseSource);

  workingLinks.flat().forEach((link) => (link.baseLine = null));
  pairWithBase(workingLinks, linksIn(baseLines, doc), baseLines, workingLines);

  const rewritten = workingLines.map((text, lineIndex) => {
    const onLine = workingLinks[lineIndex];
    let position = -1;

    return text.replace(LINK, (whole) => {
      position += 1;
      const link = onLine[position];
      const resolution = resolve(link);
      const where = `${doc}: ${link.linkPath}#L${link.line}`;
      const line = resolution.line ?? link.line;

      if (resolution.outOfScope) {
        counts.outOfScope += 1;
      } else if (resolution.authored) {
        counts.authored += 1;
      } else if (resolution.failure) {
        reports.unmapped.push(`${where} -> ${resolution.failure}`);
      } else if (line === link.line) {
        counts.upToDate += 1;
      } else {
        counts.moved += 1;
        reports.moved.push(`${where} -> #L${line}`);
      }
      const reason = rottenReason(link, line);

      if (reason !== null) {
        reports.rotten.push(`${where} -> ${reason}`);
      }
      const labelIsLine = LINE_LABEL.test(link.label);

      if (labelIsLine && link.label !== `L${link.line}`) {
        reports.mislabelled.push(`${where} -> label reads ${link.label}`);
      }

      if (checkMode) {
        return whole;
      }
      const label = labelIsLine ? `L${line}` : link.label;

      if (label !== link.label) {
        counts.relabelled += 1;
      }

      return `[${label}](${link.linkPath}#L${line})`;
    });
  });

  if (!checkMode && rewritten.join("\n") !== source) {
    writeFileSync(join(root, doc), rewritten.join("\n"));
  }
}

const movedWord = checkMode ? "stale" : "re-anchored";
const labelWord = checkMode ? "mislabelled" : "relabelled";

process.stdout.write(
  `${movedWord}: ${counts.moved}, up to date: ${counts.upToDate}, ` +
    `kept as authored: ${counts.authored}, out of scope: ${counts.outOfScope}, ` +
    `unmapped: ${reports.unmapped.length}, rotten: ${reports.rotten.length}, ` +
    `${labelWord}: ${checkMode ? reports.mislabelled.length : counts.relabelled}\n`
);

for (const [kind, details] of [
  [movedWord, reports.moved],
  ["unmapped", reports.unmapped],
  ["rotten", reports.rotten],
  ...(checkMode ? [["mislabelled", reports.mislabelled]] : []),
]) {
  details.forEach((detail) => process.stderr.write(`${kind} ${detail}\n`));
}

const stale = checkMode && reports.moved.length + reports.mislabelled.length > 0;

process.exit(reports.unmapped.length + reports.rotten.length > 0 || stale ? 1 : 0);
