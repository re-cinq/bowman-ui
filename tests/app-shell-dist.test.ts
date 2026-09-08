import { expectClientDirectiveFirst, expectPackedWithTypes } from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/AppShell.js";

describe("the built app shell surface", () => {
  it('dist/components/AppShell.js opens with "use client"; as its first statement', () => {
    expectClientDirectiveFirst(BUILT_FILE);
  });

  it("npm pack --dry-run ships dist/components/AppShell.js with its d.ts", () => {
    expectPackedWithTypes([BUILT_FILE]);
  });
});
