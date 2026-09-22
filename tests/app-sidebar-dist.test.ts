import {
  expectClientDirectiveFirst,
  expectPackedWithTypes,
  expectTypeAssertionsCompile,
} from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/AppSidebar.js";

describe("the built sidebar surface", () => {
  it('dist/components/AppSidebar.js opens with "use client"; as its first statement', () => {
    expectClientDirectiveFirst(BUILT_FILE);
  });

  it("npm pack --dry-run ships dist/components/AppSidebar.js with its d.ts", () => {
    expectPackedWithTypes([BUILT_FILE]);
  });

  it("tsc accepts app-sidebar-type-assertions.tsx against dist via the '.' exports entry, pinning the @ts-expect-error fixtures", () => {
    expectTypeAssertionsCompile("tests/types/app-sidebar-type-assertions.tsx");
  });
});
