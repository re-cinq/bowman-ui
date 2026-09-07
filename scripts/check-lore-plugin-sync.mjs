// Polices tools/eslint-plugin-lore/rules/**: verbatim mirrors of the generic
// subset of re-cinq/lore's eslint plugin (rule files and their lib helpers),
// each byte-compared against the canonical file on lore's main branch. The
// mirrors are .prettierignore'd and eslint-ignored, so lore is the format
// authority and equality really is byte equality. The local index.mjs is this
// repo's own subset selector and is not compared.
//
// The gate also fetches lore's canonical plugin index and fails when lore
// publishes a rule this repo has neither mirrored nor recorded in
// EXCLUDED_RULES below - a new upstream rule is a decision, not drift.
//
// Exit 0: everything matches. Exit 1: a mirror drifted or an undecided
// upstream rule exists - run with --write to refresh mirrors (new upstream
// rules still need a decision here). Exit 2: a canonical file could not be
// fetched (network or GitHub problem, NOT drift) - retry before concluding
// anything.

/* global fetch */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const CANONICAL_BASE = "https://raw.githubusercontent.com/re-cinq/lore/main";
const PLUGIN_DIR = "tools/eslint-plugin-lore";

const MIRRORED_RULES = [
  "max-comment-lines",
  "no-forwarding-class",
  "no-nested-if",
  "no-nested-loop",
  "no-reexport-only-module",
  "no-vague-names",
  "prefer-early-return",
  "prefer-enforce-true",
];

// Upstream rules deliberately not mirrored. Each entry is a recorded decision
// (docs/design-notes.md § Lint guardrails decision 9); a new lore rule missing
// from MIRRORED_RULES and this map fails the gate until it is placed in one.
const EXCLUDED_RULES = new Map([
  ["max-boolean-operators", "bowman's port also counts JSX conditional renders"],
  ["no-catch-as-control-flow", "bowman's port also counts property-name references"],
  [
    "no-inline-styles",
    "path-gated to lore's /apps/web-ui/ - vacuous here; bowman's port is path-free",
  ],
  [
    "no-prop-mutation",
    "path-gated to lore's /apps/web-ui/ - vacuous here; bowman's port is path-free",
  ],
  ["test-imports-its-subject", "rejected: *-dist tests read dist/ by design"],
  ["default-export-matches-filename", "vacuous: default exports are banned outright"],
  ["require-fetch-timeout", "vacuous: network egress is banned outright in src/"],
  ["require-colocated-tests", "rejected: tests live flat in tests/ by design"],
  ["prefer-api-error", "lore-specific (hapi servers)"],
  ["no-infra-sdk-in-floor", "lore-specific"],

  ["no-io-in-view", "lore-specific"],
  ["no-sql-in-web-ui", "lore-specific"],
  ["no-row-types-outside-models", "lore-specific"],
  ["require-spec-link", "lore-specific spec machinery (needs the unpublished shared package)"],
  ["require-statement-links", "lore-specific spec machinery"],
  ["require-intro-paragraph", "lore-specific spec machinery"],
  ["require-status-matches-coverage", "lore-specific spec machinery"],
  [
    "no-cross-layer-import",
    "lore-specific: monorepo layering read from a layers.yaml (plus a yaml dependency); bowman is one flat package",
  ],
  [
    "no-dead-md-links",
    "deferred: needs @eslint/markdown over *.md and a decision on the seven deliberate at-pass-<date>.md placeholder links in specs/bowman-ui-assistive-technology-pass",
  ],
]);

const MIRRORS = [
  `${PLUGIN_DIR}/rules/lib/error-shape.mjs`,
  `${PLUGIN_DIR}/rules/lib/guard-shape.mjs`,
  ...MIRRORED_RULES.map((rule) => `${PLUGIN_DIR}/rules/${rule}.mjs`),
];

const writeMode = process.argv.includes("--write");

const fetchCanonical = async (url) => {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    process.stderr.write(
      `fetch failed for ${url}: ${error.message} (network problem, not drift)\n`
    );
    process.exit(2);
  }

  if (!response.ok) {
    process.stderr.write(`fetch failed for ${url}: HTTP ${response.status} (not drift)\n`);
    process.exit(2);
  }

  return response.text();
};

let failed = 0;

for (const mirror of MIRRORS) {
  const url = `${CANONICAL_BASE}/${mirror}`;
  const canonical = await fetchCanonical(url);
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
  failed += 1;
  process.stderr.write(
    `drifted: ${mirror} no longer matches ${url} - run with --write to refresh\n`
  );
}

const upstreamIndex = await fetchCanonical(`${CANONICAL_BASE}/${PLUGIN_DIR}/index.mjs`);
const upstreamRules = [...upstreamIndex.matchAll(/"\.\/rules\/([\w-]+)\.mjs"/g)].map(
  (match) => match[1]
);

for (const rule of upstreamRules) {
  if (MIRRORED_RULES.includes(rule) || EXCLUDED_RULES.has(rule)) {
    continue;
  }
  failed += 1;
  process.stderr.write(
    `undecided upstream rule: lore ships ${rule} - mirror it or record it in EXCLUDED_RULES\n`
  );
}

process.exit(failed > 0 ? 1 : 0);
