import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { rolldown } from "rolldown";
import { packedPaths } from "./helpers/built-package.js";

// The tree-shaking guarantee lives in the bundle, not in the module: a
// consumer that imports one icon must not ship the other 21. sideEffects only
// governs whether the whole module survives; the /*#__PURE__*/ annotation on
// each createUniformIcon call is what lets a bundler drop the unused ones. This
// bundles a one-icon consumer against the real built dist with rolldown and
// asserts the outcome - the used icon's path data present, an unused icon's
// absent - so a dropped annotation fails here, not just in the source pin.
const bundleOneIconConsumer = async (importedIcon: string): Promise<string> => {
  const distIndex = resolve(process.cwd(), "dist/icons/index.js");
  const consumerDir = mkdtempSync(join(tmpdir(), "bowman-ui-icon-treeshake-"));
  const entry = join(consumerDir, "entry.js");

  writeFileSync(
    entry,
    `import { ${importedIcon} } from ${JSON.stringify(distIndex)};\nexport { ${importedIcon} };\n`,
  );

  try {
    const bundle = await rolldown({ input: entry, external: [/^react/] });
    const { output } = await bundle.generate({ format: "esm" });

    await bundle.close();

    return output
      .map((chunk) => ("code" in chunk ? chunk.code : ""))
      .join("\n");
  } finally {
    rmSync(consumerDir, { recursive: true, force: true });
  }
};

// Path data is the robust anchor: strings survive minification untouched, while
// export identifiers can be renamed by the bundler.
const usedIconPath = "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"; // SearchIcon
const unusedIconPath = "M12 4v16m8-8H4"; // PlusIcon

describe("the built icon surface tree-shakes to the imported icons", () => {
  it("bundling a SearchIcon-only consumer against dist drops the unused PlusIcon path", async () => {
    const code = await bundleOneIconConsumer("SearchIcon");

    expect(code).toContain(usedIconPath);
    expect(code).not.toContain(unusedIconPath);
  });
});

describe("the built icon surface", () => {
  it("tsc accepts icon-type-assertions.tsx against dist via the '.' exports entry", () => {
    const result = spawnSync(
      "node",
      [
        "node_modules/typescript7/bin/tsc",
        "--ignoreConfig",
        "--noEmit",
        "--strict",
        "--target",
        "es2022",
        "--module",
        "nodenext",
        "--moduleResolution",
        "nodenext",
        "--skipLibCheck",
        "--jsx",
        "react-jsx",
        "tests/types/icon-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });

  it("npm pack --dry-run ships dist/icons/Icon and dist/icons/index with their d.ts files", () => {
    const paths = packedPaths();

    for (const built of [
      "dist/icons/Icon.js",
      "dist/icons/Icon.d.ts",
      "dist/icons/index.js",
      "dist/icons/index.d.ts",
    ]) {
      expect(paths).toContain(built);
    }
  });
});
