// Registers the resolve hook the lore mirrors need and exposes the repo root;
// importing this module before a dynamic import of tools/lore-shared/** is
// what lets the .ts mirrors load (docs/design-notes.md § Lint guardrails 10).
import { register } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

register(new URL("./lore-domain-resolve.mjs", import.meta.url));

export const root = join(fileURLToPath(import.meta.url), "..", "..", "..");
