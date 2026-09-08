import { expectClientDirectiveFirst, expectPackedWithTypes } from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/Toast.js";

describe("the built toast surface", () => {
  it('dist/components/Toast.js opens with "use client"; as its first statement', () => {
    expectClientDirectiveFirst(BUILT_FILE);
  });

  it("npm pack --dry-run ships dist/components/Toast.js with its d.ts", () => {
    expectPackedWithTypes([BUILT_FILE]);
  });
});
