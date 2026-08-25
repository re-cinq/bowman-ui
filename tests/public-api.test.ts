import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The published surface, guarded. Everything else in this suite asserts that a
 * component behaves; nothing asserted what the package *promises*, so an export
 * could be renamed or dropped and 402 green tests would not notice - while every
 * consumer's build broke on install.
 *
 * Read from dist rather than src (the same choice as the *-dist tests): the
 * built artifact is what ships, and a barrel that compiles is not the same
 * claim as a barrel that exports what it meant to.
 *
 * When this fails, do not reflexively regenerate the snapshot. An addition is a
 * minor; a removal or a rename is a BREAKING change and needs a major.
 * Regenerate deliberately with:
 *   npm run build && node scripts/write-public-api.mjs
 */
const snapshotPath = resolve(process.cwd(), "tests/fixtures/public-api.json");
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
  values: string[];
  types: string[];
};

// Type-only exports vanish at runtime, so they cannot be read from the module
// object - they are parsed out of the emitted declarations instead. tsc prints
// one `export type { ... }` per source statement, optionally trailing-comma'd.
const declaredTypeExports = (): string[] =>
  [
    ...readFileSync(resolve(process.cwd(), "dist/index.d.ts"), "utf8").matchAll(
      /export type \{([^}]*)\}/g
    ),
  ]
    .flatMap((match) => match[1].split(","))
    .map((name) => name.trim())
    .filter(Boolean)
    .sort();

describe("public API surface", () => {
  it("the built runtime exports are exactly the 45 committed names", async () => {
    const built = await import("../dist/index.js");

    expect(Object.keys(built).sort()).toEqual(snapshot.values);
  });

  it("the emitted type exports are exactly the 29 committed names", () => {
    expect(declaredTypeExports()).toEqual(snapshot.types);
  });

  it("the snapshot itself is sorted and free of duplicates", () => {
    for (const list of [snapshot.values, snapshot.types]) {
      expect(list).toEqual([...list].sort());
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it("every labelled component ships its defaults object alongside it", () => {
    const labelled = snapshot.values.filter((name) => name.startsWith("default"));
    const components = labelled.map((name) => name.replace(/^default(.+)Labels$/, "$1"));

    expect(components.every((component) => snapshot.values.includes(component))).toBe(true);
    expect(components.every((component) => snapshot.types.includes(`${component}Labels`))).toBe(
      true
    );
  });
});
