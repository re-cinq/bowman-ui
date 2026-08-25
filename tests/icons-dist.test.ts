import { execFileSync, spawnSync } from "node:child_process";

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
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(result).toMatchObject({ status: 0, stderr: "" });
  });

  it("npm pack --dry-run ships dist/icons/Icon and dist/icons/index with their d.ts files", () => {
    const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const [pack] = JSON.parse(output) as [{ files: { path: string }[] }];
    const paths = pack.files.map((file) => file.path);
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
