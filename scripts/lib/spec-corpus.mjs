// The spec corpus as the check-spec and repoint scripts walk it: every
// `specs/<slug>/spec.md` in sorted slug order, then the caller's extras in
// the order the tests pin (`.specify/spec.md` for links and repoint, the
// sorted `adrs/*.md` for status). Every caller names its corpus: the
// options are load-bearing because each script scans a different one.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const SYSTEM_SPEC = ".specify/spec.md";

// Slugs sort before mapping: a path sort would put `x-y/spec.md` ahead of `x/spec.md`.
const specSlugDocs = (root) =>
  readdirSync(join(root, "specs"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((slug) => `specs/${slug}/spec.md`);

const adrDocs = (root) =>
  readdirSync(join(root, "adrs"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `adrs/${entry.name}`)
    .sort();

export const listSpecDocs = (root, { includeSystemSpec = false, includeAdrs = false }) => [
  ...specSlugDocs(root),
  ...(includeSystemSpec ? [SYSTEM_SPEC] : []),
  ...(includeAdrs ? adrDocs(root) : []),
];

// `noun` is the word the message calls the file ("spec", "doc"); the tests pin it.
export const readRepoFileOrExit = (root, path, noun) => {
  try {
    return readFileSync(join(root, path), "utf8");
  } catch (error) {
    process.stderr.write(`cannot read ${noun} ${path}: ${error.message}\n`);
    process.exit(2);
  }
};
