import { spawnSync } from "node:child_process";
import { expectClientDirectiveFirst, expectPackedWithTypes } from "./helpers/built-package.js";

const BUILT_FILE = "dist/components/ChatComposer.js";

describe("the built chat composer surface", () => {
  it('dist/components/ChatComposer.js opens with "use client"; as its first statement', () => {
    expectClientDirectiveFirst(BUILT_FILE);
  });

  it("npm pack --dry-run ships dist/components/ChatComposer.js with its d.ts", () => {
    expectPackedWithTypes([BUILT_FILE]);
  });

  it("tsc accepts chat-composer-type-assertions.tsx against dist via the '.' exports entry, pinning the @ts-expect-error fixture", () => {
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
        "tests/types/chat-composer-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});
