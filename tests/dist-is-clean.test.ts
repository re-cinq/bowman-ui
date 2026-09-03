import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// The build compiles into dist/ without cleaning it first - or did, until the
// rm -rf this suite guards. tsc happily leaves output from deleted sources in
// place, `files: ["dist"]` ships whatever is there, and the tarball's contents
// start depending on the build machine's history instead of on src/. That is
// not hypothetical: dist/Placeholder.js survived 022's deletion of its source
// in every working tree that had ever built it, and npm pack counted 42 files
// where a clean build produces 40.
//
// The guard maps every built file back to a source file. It runs after the
// suite's own build (npm test builds first), so a stale artifact fails here
// before it can ship.
const root = process.cwd();

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const expectedSource = (builtFile: string): string[] => {
  const rel = relative(join(root, "dist"), builtFile);

  if (rel === "styles.css") {
    return [join(root, "src", "styles.css")];
  }
  const base = rel.replace(/\.d\.ts$/, "").replace(/\.js$/, "");

  return [join(root, "src", `${base}.ts`), join(root, "src", `${base}.tsx`)];
};

describe("dist matches src", () => {
  it("every built file traces back to a source file - no stale artifacts ship", () => {
    const built = walk(resolve(root, "dist"));
    const orphans = built.filter(
      (file) => !expectedSource(file).some((candidate) => candidateExists(candidate))
    );

    expect(orphans.map((file) => relative(root, file))).toEqual([]);
  });
});

const candidateExists = (path: string): boolean => {
  try {
    statSync(path);

    return true;
  } catch {
    return false;
  }
};
