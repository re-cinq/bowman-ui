import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * docs/design-notes.md decision 4 records the one React version CI installs and
 * tests. That record has to describe the tree: the version it names, the
 * version package-lock.json resolves for react/react-dom, the version each
 * example consumer (examples/chat-demo, examples/rsc-fixture) pins and the
 * version README.md claims the components are tested against must all be the
 * same, so the "one tested version" claim stays true and cannot silently
 * drift apart again.
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

const readmeVersion = (): string => {
  const match = /tested against \(React (\d+\.\d+\.\d+)\)/.exec(read("README.md"));

  if (match === null) {
    throw new Error("README.md § Requirements no longer names the React version tested against");
  }

  return match[1];
};

const lockfileVersion = (packageName: string): string => {
  const lock = JSON.parse(read("package-lock.json")) as {
    packages: Record<string, { version: string }>;
  };

  return lock.packages[`node_modules/${packageName}`].version;
};

const examplePin = (example: string, packageName: string): string => {
  const manifest = JSON.parse(read(`examples/${example}/package.json`)) as {
    dependencies: Record<string, string>;
  };

  return manifest.dependencies[packageName];
};

describe("the one tested React version", () => {
  it("is the same in decision 4, the README, the lockfile, the chat-demo pin and the rsc-fixture pin", () => {
    const recorded = designNotesVersion();

    expect({
      readme: readmeVersion(),
      lockReact: lockfileVersion("react"),
      lockReactDom: lockfileVersion("react-dom"),
      demoReact: examplePin("chat-demo", "react"),
      demoReactDom: examplePin("chat-demo", "react-dom"),
      fixtureReact: examplePin("rsc-fixture", "react"),
      fixtureReactDom: examplePin("rsc-fixture", "react-dom"),
    }).toEqual({
      readme: recorded,
      lockReact: recorded,
      lockReactDom: recorded,
      demoReact: recorded,
      demoReactDom: recorded,
      fixtureReact: recorded,
      fixtureReactDom: recorded,
    });
  });
});
