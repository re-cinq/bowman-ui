import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { packedPaths, stripLeadingTrivia } from "./helpers/built-package.js";

const BUILT_FILES = [
  "dist/components/ChatMessage.js",
  "dist/components/InlineThinkingIndicator.js",
];

describe("the built chat message surface", () => {
  it('each built chat message component opens with "use client"; as its first statement', () => {
    for (const built of BUILT_FILES) {
      expect(existsSync(built)).toBe(true);
      const firstStatement = stripLeadingTrivia(readFileSync(built, "utf8"));

      expect(firstStatement.startsWith('"use client";')).toBe(true);
    }
  });

  it("npm pack --dry-run ships both components with their d.ts files and react-markdown as a runtime dependency", () => {
    const paths = packedPaths();

    for (const built of BUILT_FILES) {
      expect(paths).toContain(built);
      expect(paths).toContain(built.replace(/\.js$/, ".d.ts"));
    }
  });

  it("tsc accepts chat-message-type-assertions.tsx against dist via the '.' exports entry, pinning both @ts-expect-error fixtures", () => {
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
        "tests/types/chat-message-type-assertions.tsx",
      ],
      { cwd: process.cwd(), encoding: "utf8" }
    );

    expect(result).toMatchObject({ status: 0, stderr: "" });
  });
});

describe("the manifest after 023", () => {
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };

  it("react-markdown 10 and remark-gfm 4 are runtime dependencies and no longer devDependencies", () => {
    expect(manifest.dependencies).toMatchObject({
      "react-markdown": "^10.1.0",
      "remark-gfm": "^4.0.1",
    });
    expect(manifest.devDependencies).not.toHaveProperty("react-markdown");
    expect(manifest.devDependencies).not.toHaveProperty("remark-gfm");
  });

  it("rehype-raw appears in no dependency field, and no hal-engine package in any field (C-18)", () => {
    const fields = [
      manifest.dependencies ?? {},
      manifest.devDependencies ?? {},
      manifest.peerDependencies ?? {},
      manifest.optionalDependencies ?? {},
    ];

    for (const field of fields) {
      expect(field).not.toHaveProperty("rehype-raw");

      for (const name of Object.keys(field)) {
        expect(name).not.toMatch(/hal-engine/);
      }
    }
  });
});
