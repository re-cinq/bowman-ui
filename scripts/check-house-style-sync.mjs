// Byte-compares the two verbatim mirrors of re-cinq/lore's shared config -
// eslint.house-style.mjs and .prettierrc - against the canonical files on
// lore's main branch. Both mirrors are .prettierignore'd, so lore is the
// format authority for their bytes and equality really is byte equality.
//
// Exit 0: mirrors match. Exit 1: a mirror drifted - run with --write to
// refresh it from lore, then commit. Exit 2: a canonical file could not be
// fetched (network or GitHub problem, NOT drift) - retry before concluding
// anything.

/* global fetch */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const CANONICAL_BASE = "https://raw.githubusercontent.com/re-cinq/lore/main";
const MIRRORS = ["eslint.house-style.mjs", ".prettierrc"];
const writeMode = process.argv.includes("--write");

let drifted = 0;

for (const mirror of MIRRORS) {
  const url = `${CANONICAL_BASE}/${mirror}`;
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    process.stderr.write(
      `fetch failed for ${url}: ${error.message} (network problem, not drift)\n`,
    );
    process.exit(2);
  }

  if (!response.ok) {
    process.stderr.write(
      `fetch failed for ${url}: HTTP ${response.status} (not drift)\n`,
    );
    process.exit(2);
  }
  const canonical = await response.text();
  const local = readFileSync(join(root, mirror), "utf8");

  if (local === canonical) {
    process.stdout.write(`in sync: ${mirror}\n`);
    continue;
  }

  if (writeMode) {
    writeFileSync(join(root, mirror), canonical);
    process.stdout.write(`refreshed: ${mirror}\n`);
    continue;
  }
  drifted += 1;
  process.stderr.write(
    `drifted: ${mirror} no longer matches ${url} - run with --write to refresh\n`,
  );
}

process.exit(drifted > 0 ? 1 : 0);
