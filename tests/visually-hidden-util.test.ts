import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : [join(dir, entry.name)]
  );

describe("the visually-hidden style utility", () => {
  const srcFiles = sourceFiles(resolve(process.cwd(), "src")).filter((f) => /\.(ts|tsx)$/.test(f));

  it('the clip "rect(0, 0, 0, 0)" literal is not duplicated — it appears in exactly one src/ file', () => {
    const filesWithClip = srcFiles.filter((f) =>
      readFileSync(f, "utf8").includes("rect(0, 0, 0, 0)")
    );
    expect(filesWithClip).toHaveLength(1);
  });
});
