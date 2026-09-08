import { expectClientDirectiveFirst, expectPackedWithTypes } from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/ConversationList.js";

describe("the built conversation list surface", () => {
  it('dist/components/ConversationList.js opens with "use client"; as its first statement', () => {
    expectClientDirectiveFirst(BUILT_FILE);
  });

  it("npm pack --dry-run ships dist/components/ConversationList.js with its d.ts", () => {
    expectPackedWithTypes([BUILT_FILE]);
  });
});
