#!/usr/bin/env node
// issue 97: the mechanical half of the assistive-technology pass. CI
// cannot hear a screen reader, but it can check that the record of a human
// listening exists, is complete, and has not been invalidated by a later edit
// to the components it certified.
//
// Usage:
//   node scripts/check-at-pass.mjs --structure [root]
//   node scripts/check-at-pass.mjs --freshness [root]
//
// --structure validates the newest docs/accessibility/at-pass-*.md: every
// required front-matter field present, every row A1-A7 carrying a verdict on
// both stacks, `not-run` only on the VoiceOver row and only with a reason,
// every `fail` naming a fixing issue or an accepting person, every `waived`
// carrying waived-by and an unexpired expires, and no placeholder left behind.
// With no record at all it passes and says so: the first record is created by
// the first human pass, and pull requests must not be hostage to a listening
// session that has not happened yet.
//
// --freshness is the release gate and inverts that: no record is a failure,
// because publishing a package whose chat surface nobody has ever listened to
// is exactly what this issue exists to prevent. With a record present it fails
// when the last commit touching any path in the record's `covers` list is not
// an ancestor of the record's `commit` - editing ChatMessageList.tsx
// mechanically invalidates the pass that certified it - and when a waiver has
// expired, with the same exit code as a stale record.
//
// Exit 1 lists every violation on stderr. Exit 2 is a usage or environment
// error: an unknown flag, or a tree that is not a git repository.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const ROWS = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];
const STACKS = ["nvda", "voiceover"];
const NOT_RUN_STACK = "voiceover";
const VERDICTS = ["pass", "fail", "waived", "not-run"];
const SCALAR_FIELDS = ["date", "runner", "commit", "package"];
const STACK_FIELDS = ["screenReader", "browser", "platform", "voice"];
const PLACEHOLDER = /\b(tbd|todo|fixme|xxx)\b|<[^>]+>/i;
const RECORD_DIRECTORY = join("docs", "accessibility");

const stripQuotes = (value) => value.replace(/^["'](.*)["']$/, "$1").trim();

const pairOf = (text) => {
  const match = text.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
  return match === null ? null : { key: match[1], value: stripQuotes(match[2]) };
};

// A deliberately small front-matter reader for the one shape this record uses:
// top-level scalars, a list of strings, and a list of flat maps. No YAML
// dependency - the format is defined by docs/accessibility/README.md and a
// record that strays from it is a finding, not a parser upgrade.
const parseFrontMatter = (source) => {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (match === null) {
    return { error: "no `---` front-matter block at the top of the file" };
  }
  const lines = match[1]
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"));
  const data = {};
  let list = null;
  let item = null;
  for (const line of lines) {
    const text = line.trim();
    const indented = line.startsWith(" ");
    if (!indented) {
      const pair = pairOf(text);
      if (pair === null) {
        return { error: `unparseable front-matter line: ${text}` };
      }
      item = null;
      list = pair.value === "" ? [] : null;
      data[pair.key] = list === null ? pair.value : list;
      continue;
    }
    if (list === null) {
      return { error: `unparseable front-matter line: ${text}` };
    }
    if (text.startsWith("- ")) {
      const entry = text.slice(2).trim();
      const pair = pairOf(entry);
      if (pair === null) {
        list.push(stripQuotes(entry));
        item = null;
        continue;
      }
      item = { [pair.key]: pair.value };
      list.push(item);
      continue;
    }
    const pair = pairOf(text);
    if (pair === null || item === null) {
      return { error: `unparseable front-matter line: ${text}` };
    }
    item[pair.key] = pair.value;
  }
  return { data };
};

const isFilledString = (value) => typeof value === "string" && value.trim() !== "";

const isMapList = (value) =>
  Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === "object");

const today = () => new Date().toISOString().slice(0, 10);

const checkScalars = (data) => {
  const violations = [];
  for (const field of SCALAR_FIELDS) {
    if (!isFilledString(data[field])) {
      violations.push(`front matter is missing the required field \`${field}\``);
    }
  }
  if (isFilledString(data.date) && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    violations.push(`\`date\` must be YYYY-MM-DD, found "${data.date}"`);
  }
  if (isFilledString(data.commit) && !/^[0-9a-f]{40}$/.test(data.commit)) {
    violations.push(`\`commit\` must be a 40-hex commit sha, found "${data.commit}"`);
  }
  return violations;
};

const checkCovers = (data) => {
  const covers = data.covers;
  if (!Array.isArray(covers) || covers.length === 0) {
    return ["front matter is missing the required field `covers` (a non-empty path list)"];
  }
  return covers.every(isFilledString) ? [] : ["`covers` must be a list of paths"];
};

const identifyStack = (screenReader) => {
  const text = typeof screenReader === "string" ? screenReader.trim() : "";
  if (/^nvda\b/i.test(text)) {
    return "nvda";
  }
  if (/^voiceover\b/i.test(text)) {
    return "voiceover";
  }
  return null;
};

const checkStacks = (data) => {
  if (!isMapList(data.stacks)) {
    return ["front matter is missing the required field `stacks` (a non-empty list)"];
  }
  const violations = [];
  data.stacks.forEach((stack, index) => {
    for (const field of STACK_FIELDS) {
      if (!isFilledString(stack[field])) {
        violations.push(`stacks[${index}] is missing \`${field}\``);
      }
    }
  });
  if (violations.length > 0) {
    return violations;
  }
  const identified = data.stacks.map((stack) => identifyStack(stack.screenReader));
  const identifiesEachStackOnce = STACKS.every(
    (name) => identified.filter((entry) => entry === name).length === 1
  );
  if (data.stacks.length !== STACKS.length || !identifiesEachStackOnce) {
    return [
      '`stacks` must contain exactly one nvda stack (`screenReader` starting with "NVDA") ' +
        `and one voiceover stack (\`screenReader\` starting with "VoiceOver"), found ` +
        `${data.stacks.length} entr${data.stacks.length === 1 ? "y" : "ies"}`,
    ];
  }
  return [];
};

const checkRowVerdict = (row, now) => {
  const where = `row ${row.id} on stack ${row.stack}`;
  if (!VERDICTS.includes(row.verdict)) {
    return [`${where} carries no verdict from ${VERDICTS.join(" | ")}`];
  }
  if (row.verdict === "not-run" && row.stack !== NOT_RUN_STACK) {
    return [`${where} is \`not-run\`, which is legal only on the ${NOT_RUN_STACK} stack`];
  }
  if (row.verdict === "not-run" && !isFilledString(row.reason)) {
    return [`${where} is \`not-run\` without a \`reason\``];
  }
  if (
    row.verdict === "fail" &&
    !isFilledString(row["fixing-issue"]) &&
    !isFilledString(row["accepted-by"])
  ) {
    return [`${where} is \`fail\` without a \`fixing-issue\` or an \`accepted-by\``];
  }
  if (row.verdict !== "waived") {
    return [];
  }
  if (!isFilledString(row["waived-by"]) || !isFilledString(row.expires)) {
    return [`${where} is \`waived\` without both \`waived-by\` and \`expires\``];
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.expires)) {
    return [
      `${where} is \`waived\` with an \`expires\` of "${row.expires}", which is not YYYY-MM-DD`,
    ];
  }
  if (row.expires < now) {
    return [`${where} is \`waived\` with an expiry of ${row.expires}, already past on ${now}`];
  }
  return [];
};

const checkRows = (data, now) => {
  if (!isMapList(data.rows)) {
    return ["front matter is missing the required field `rows` (a non-empty list)"];
  }
  const violations = [];
  for (const rowId of ROWS) {
    for (const stack of STACKS) {
      const row = data.rows.find((entry) => entry.id === rowId && entry.stack === stack);
      if (row === undefined) {
        violations.push(`row ${rowId} carries no verdict on stack ${stack}`);
        continue;
      }
      violations.push(...checkRowVerdict(row, now));
    }
  }
  return violations;
};

const checkPlaceholders = (source) => {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  const block = match === null ? "" : match[1];
  const offending = block.split("\n").filter((line) => PLACEHOLDER.test(line));
  return offending.map((line) => `front matter still carries a placeholder: ${line.trim()}`);
};

// The filename's date segment is not decorative: it is what `newestRecord`
// sorts on to pick which record the gate reads. A record whose filename date
// disagrees with its own front-matter `date` can silently outrank a genuinely
// newer record by lying about how recent it is, in both --structure and
// --freshness, so a mismatch is a structural violation on its own.
const checkFilenameDate = (name, data) => {
  const match = name.match(/^at-pass-(.+)\.md$/);
  const filenameDate = match === null ? null : match[1];
  if (filenameDate === null || !isFilledString(data.date) || filenameDate === data.date) {
    return [];
  }
  return [`filename date \`${filenameDate}\` does not match front matter \`date: ${data.date}\``];
};

const validateRecord = (source, now, name) => {
  const parsed = parseFrontMatter(source);
  if (parsed.error !== undefined) {
    return { violations: [parsed.error] };
  }
  const violations = [
    ...checkScalars(parsed.data),
    ...checkFilenameDate(name, parsed.data),
    ...checkCovers(parsed.data),
    ...checkStacks(parsed.data),
    ...checkRows(parsed.data, now),
    ...checkPlaceholders(source),
  ];
  return { data: parsed.data, violations };
};

const newestRecord = (root) => {
  const directory = join(root, RECORD_DIRECTORY);
  if (!existsSync(directory)) {
    return null;
  }
  const names = readdirSync(directory)
    .filter((name) => /^at-pass-.+\.md$/.test(name))
    .sort();
  const newest = names.at(-1);
  return newest === undefined ? null : { name: newest, path: join(directory, newest) };
};

const git = (root, ...args) => {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const isAncestor = (root, ancestor, descendant) => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const checkFreshness = (root, data, recordName) => {
  if (git(root, "rev-parse", "--git-dir") === null) {
    return { fatal: `${root} is not a git repository; --freshness needs git history` };
  }
  const recordCommit = data.commit;
  if (git(root, "rev-parse", "--verify", "--quiet", `${recordCommit}^{commit}`) === null) {
    return { fatal: `${recordName} names a commit this repository does not have: ${recordCommit}` };
  }
  const violations = [];
  for (const path of data.covers) {
    const lastCommit = git(root, "log", "-n", "1", "--format=%H", "--", path);
    if (lastCommit === null || lastCommit === "") {
      violations.push(
        `${recordName}: no commit in this repository touches the covered path ${path}`
      );
      continue;
    }
    if (isAncestor(root, lastCommit, recordCommit)) {
      continue;
    }
    violations.push(
      `${recordName} is stale for ${path}: its last commit ${lastCommit} is not an ancestor of the record's commit ${recordCommit}`
    );
  }
  return { violations };
};

const fail = (violations) => {
  for (const violation of violations) {
    process.stderr.write(`${violation}\n`);
  }
  process.exit(1);
};

const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const positional = args.filter((arg) => !arg.startsWith("--"));
const mode = flags[0];
if (flags.length !== 1 || !["--structure", "--freshness"].includes(mode) || positional.length > 1) {
  process.stderr.write("usage: check-at-pass.mjs --structure|--freshness [root]\n");
  process.exit(2);
}

const root = positional[0] === undefined ? process.cwd() : resolve(positional[0]);
const record = newestRecord(root);

if (record === null && mode === "--structure") {
  process.stdout.write(
    `check-at-pass: no ${RECORD_DIRECTORY}/at-pass-*.md record yet - structure check has nothing to validate.\n` +
      "The first record is written by the first human screen-reader pass (issue 97); until then this check passes and --freshness blocks publishing.\n"
  );
  process.exit(0);
}

if (record === null) {
  fail([
    `no ${RECORD_DIRECTORY}/at-pass-*.md record exists; the package must not be published before a human has run the assistive-technology pass (issue 97)`,
  ]);
}

const source = readFileSync(record.path, "utf8");
const validated = validateRecord(source, today(), record.name);
const prefixed = validated.violations.map((violation) => `${record.name}: ${violation}`);

if (mode === "--structure") {
  if (prefixed.length > 0) {
    fail(prefixed);
  }
  process.stdout.write(`check-at-pass: ${record.name} is structurally complete\n`);
  process.exit(0);
}

if (prefixed.length > 0) {
  fail(prefixed);
}

const freshness = checkFreshness(root, validated.data, record.name);
if (freshness.fatal !== undefined) {
  process.stderr.write(`check-at-pass: ${freshness.fatal}\n`);
  process.exit(2);
}
if (freshness.violations.length > 0) {
  fail(freshness.violations);
}

process.stdout.write(`check-at-pass: ${record.name} covers the current tree\n`);
