import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { listSourceFiles } from "../scripts/lib/list-source-files.mjs";

// The directory sorts between the files on purpose: a walk that listed files
// first and recursed afterwards would place "m" last instead of in its slot.
const tree = ["a.ts", "z.tsx", "z.mts", "z.cts", "z.js", "m/f.ts", "m/g.css", "m/deeper/h.tsx"];

describe("listSourceFiles", () => {
  const root = mkdtempSync(join(tmpdir(), "bowman-list-source-files-"));

  beforeAll(() => {
    for (const path of tree) {
      mkdirSync(join(root, path, ".."), { recursive: true });
      writeFileSync(join(root, path), "");
    }
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const listed = (extensions?: string[]): string[] =>
    listSourceFiles(root, extensions).map((file) => relative(root, file).split(sep).join("/"));

  it("lists .ts, .tsx, .mts and .cts files at every depth by default", () => {
    expect(listed().sort()).toEqual([
      "a.ts",
      "m/deeper/h.tsx",
      "m/f.ts",
      "z.cts",
      "z.mts",
      "z.tsx",
    ]);
  });

  it('lists only .ts and .tsx files when given [".ts", ".tsx"]', () => {
    expect(listed([".ts", ".tsx"]).sort()).toEqual(["a.ts", "m/deeper/h.tsx", "m/f.ts", "z.tsx"]);
  });

  it("expands a subdirectory in place, in the directory's own entry order", () => {
    const entryOrder = readdirSync(root).filter((name) => name !== "z.js");
    const topLevelRuns = listed()
      .map((file) => file.split("/")[0])
      .filter((name, index, names) => names[index - 1] !== name);

    expect(topLevelRuns).toEqual(entryOrder);
  });
});
