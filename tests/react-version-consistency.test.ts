import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * docs/design-notes.md decision 4 records the one React version CI installs and
 * tests. That record has to describe the tree: the version it names, the
 * version package-lock.json resolves for react/react-dom, and the version the
 * examples/chat-demo consumer pins must all be the same, so the "one tested
 * version" claim stays true and cannot silently drift apart again.
 */

const read = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

const designNotesVersion = (): string => {
  const match = /React (\d+\.\d+\.\d+) is what CI installs/.exec(read("docs/design-notes.md"));

  if (match === null) {
    throw new Error("docs/design-notes.md decision 4 no longer names a React version CI installs");
  }

  return match[1];
};

const lockfileVersion = (packageName: string): string => {
  const lock = JSON.parse(read("package-lock.json")) as {
    packages: Record<string, { version: string }>;
  };

  return lock.packages[`node_modules/${packageName}`].version;
};

const demoPin = (packageName: string): string => {
  const demo = JSON.parse(read("examples/chat-demo/package.json")) as {
    dependencies: Record<string, string>;
  };

  return demo.dependencies[packageName];
};

describe("the one tested React version", () => {
  it("is the same in decision 4, the lockfile and the chat-demo pin", () => {
    const recorded = designNotesVersion();

    expect({
      lockReact: lockfileVersion("react"),
      lockReactDom: lockfileVersion("react-dom"),
      demoReact: demoPin("react"),
      demoReactDom: demoPin("react-dom"),
    }).toEqual({
      lockReact: recorded,
      lockReactDom: recorded,
      demoReact: recorded,
      demoReactDom: recorded,
    });
  });
});
