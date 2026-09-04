// Regenerates tests/fixtures/public-api.json from the built package.
//
// Run this only after deciding the surface change is intended:
//   npm run build && node scripts/write-public-api.mjs
//
// An added export is a minor. A removed or renamed one is BREAKING and needs a
// major - the guard exists so that decision is made by a person, not absorbed
// silently by a passing suite.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const built = await import(resolve(root, "dist/index.js"));
const declarations = readFileSync(resolve(root, "dist/index.d.ts"), "utf8");

const types = [...declarations.matchAll(/export type \{([^}]*)\}/g)]
  .flatMap((match) => match[1].split(","))
  .map((name) => name.trim())
  .filter(Boolean)
  .sort();

const surface = { values: Object.keys(built).sort(), types };

writeFileSync(
  resolve(root, "tests/fixtures/public-api.json"),
  `${JSON.stringify(surface, null, 2)}\n`,
);

process.stdout.write(
  `public-api.json written: ${surface.values.length} values, ${types.length} types\n`,
);
