/**
 * lore-shared — LOCAL, not a mirror and not byte-compared.
 *
 * Upstream this file is a shim onto the published `@re-cinq/lore-shared`
 * package, which this repo cannot install (it is unbuilt, inside lore's
 * monorepo). Here it re-exports the same names from the verbatim mirrors under
 * `tools/lore-shared/`, so `status-coverage.mjs` — which IS a mirror — stays
 * byte-identical to lore's while resolving its `./lore-shared.mjs` import.
 *
 * It loads only under `scripts/check-spec-status.mjs`, which runs Node with
 * `--experimental-strip-types` and registers
 * `scripts/lib/lore-domain-resolve.mjs`; ESLint never reaches it, because the
 * three rules that would import it (`require-statement-links`,
 * `require-intro-paragraph`, `require-status-matches-coverage`) are recorded as
 * excluded in `scripts/check-lore-plugin-sync.mjs` and are not mirrored.
 */

export { parseDocStatus, statusTier } from "../../../lore-shared/domain/spec-status.ts";
export {
  coverageTier,
  expectedStatus,
  statementCoverage,
  unlinkedTestableStatements,
} from "../../../lore-shared/work/spec-status-coverage.ts";
export {
  linksForStatements,
  resolveLinkPath,
} from "../../../lore-shared/domain/spec-link-parser.ts";
export { isTestFile } from "../../../lore-shared/domain/test-paths.ts";
