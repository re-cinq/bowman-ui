import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
  name: string;
  version: string;
  type: string;
  exports: Record<string, unknown>;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

describe("the package manifest", () => {
  it('names the package "@re-cinq/bowman-ui"', () => {
    expect(packageJson.name).toEqual("@re-cinq/bowman-ui");
  });

  it("carries a MAJOR.MINOR.PATCH semver version", () => {
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("declares react and react-dom as the only peer dependencies", () => {
    expect(Object.keys(packageJson.peerDependencies).sort()).toEqual(["react", "react-dom"]);
  });

  it("requires React 19 through the ^19.0.0 peer ranges", () => {
    expect(packageJson.peerDependencies).toEqual({ react: "^19.0.0", "react-dom": "^19.0.0" });
  });

  it('distributes ESM only: "type" is "module" and the "." export carries no require condition', () => {
    expect(packageJson.type).toEqual("module");
    expect(Object.keys(packageJson.exports).sort()).toEqual([".", "./styles.css"]);
    expect(packageJson.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      default: "./dist/index.js",
    });
  });

  it("keeps the runtime dependencies to react-markdown and remark-gfm", () => {
    expect(Object.keys(packageJson.dependencies).sort()).toEqual(["react-markdown", "remark-gfm"]);
  });

  it("commits package-lock.json for reproducible installs", () => {
    const lock = JSON.parse(readFileSync(resolve(process.cwd(), "package-lock.json"), "utf8")) as {
      name: string;
    };
    expect(lock.name).toEqual("@re-cinq/bowman-ui");
  });
});

describe("the code quality gates", () => {
  it("tsconfig.json enforces strict mode", () => {
    const tsconfig = JSON.parse(readFileSync(resolve(process.cwd(), "tsconfig.json"), "utf8")) as {
      compilerOptions: { strict: boolean };
    };
    expect(tsconfig.compilerOptions.strict).toEqual(true);
  });

  it("the committed coverage floor is at least 80 on every threshold", () => {
    const config = readFileSync(resolve(process.cwd(), "vitest.config.ts"), "utf8");
    const match = config.match(
      /thresholds: \{ lines: (\d+), functions: (\d+), statements: (\d+), branches: (\d+) \}/
    );
    if (!match) {
      throw new Error("vitest.config.ts no longer declares the coverage thresholds inline");
    }
    for (const threshold of match.slice(1).map(Number)) {
      expect(threshold).toBeGreaterThanOrEqual(80);
    }
  });

  it("no built file under dist/ calls console", () => {
    const distDir = resolve(process.cwd(), "dist");
    const builtScripts = readdirSync(distDir, { recursive: true, encoding: "utf8" }).filter(
      (name) => name.endsWith(".js")
    );
    expect(builtScripts.length).toBeGreaterThan(0);
    for (const name of builtScripts) {
      expect(readFileSync(join(distDir, name), "utf8")).not.toMatch(/\bconsole\./);
    }
  });
});
