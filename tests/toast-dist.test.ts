import { existsSync, readFileSync } from "node:fs";
import { packedPaths, stripLeadingTrivia } from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/Toast.js";

describe("the built toast surface", () => {
  it('dist/components/Toast.js opens with "use client"; as its first statement', () => {
    expect(existsSync(BUILT_FILE)).toBe(true);
    const firstStatement = stripLeadingTrivia(readFileSync(BUILT_FILE, "utf8"));

    expect(firstStatement.startsWith('"use client";')).toBe(true);
  });

  it("npm pack --dry-run ships dist/components/Toast.js with its d.ts", () => {
    const paths = packedPaths();

    expect(paths).toContain(BUILT_FILE);
    expect(paths).toContain(BUILT_FILE.replace(/\.js$/, ".d.ts"));
  });
});
