import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeInRepo } from "./helpers/script-runner.js";
import { listSpecDocs } from "../scripts/lib/spec-corpus.mjs";

const makeTree = (): string => {
  const root = mkdtempSync(join(tmpdir(), "spec-corpus-"));

  writeInRepo(root, "specs/lamp-oil/spec.md", "");
  writeInRepo(root, "specs/lamp/spec.md", "");
  writeInRepo(root, "specs/buoy/spec.md", "");
  writeInRepo(root, "specs/README.md", "");
  writeInRepo(root, ".specify/spec.md", "");
  writeInRepo(root, "adrs/ADR-002-tide.md", "");
  writeInRepo(root, "adrs/ADR-001-kite.md", "");
  writeInRepo(root, "adrs/notes.txt", "");

  return root;
};

const sortedSpecs = ["specs/buoy/spec.md", "specs/lamp/spec.md", "specs/lamp-oil/spec.md"];
const sortedAdrs = ["adrs/ADR-001-kite.md", "adrs/ADR-002-tide.md"];

describe("listSpecDocs", () => {
  const root = makeTree();

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("lists only the spec directories in slug order, lamp before lamp-oil, when neither extra is asked for", () => {
    expect(listSpecDocs(root, {})).toEqual(sortedSpecs);
  });

  it("includeSystemSpec appends .specify/spec.md after the sorted specs", () => {
    expect(listSpecDocs(root, { includeSystemSpec: true })).toEqual([
      ...sortedSpecs,
      ".specify/spec.md",
    ]);
  });

  it("includeAdrs appends the sorted adrs/*.md files and skips non-markdown entries", () => {
    expect(listSpecDocs(root, { includeAdrs: true })).toEqual([...sortedSpecs, ...sortedAdrs]);
  });

  it("both extras order the system spec before the adrs", () => {
    expect(listSpecDocs(root, { includeSystemSpec: true, includeAdrs: true })).toEqual([
      ...sortedSpecs,
      ".specify/spec.md",
      ...sortedAdrs,
    ]);
  });
});
