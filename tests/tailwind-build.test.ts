import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// A consumer app assembled the way the README prescribes: the published
// package "installed" into node_modules (real package.json, the real built
// dist/styles.css, plus a stand-in component file carrying bg-slate-800),
// compiled by the real Tailwind v4 CLI.
const repoRoot = process.cwd();
const fixtureDir = resolve(repoRoot, "tests/fixtures/tailwind-consumer");
const tailwindCli = resolve(
  repoRoot,
  "node_modules/@tailwindcss/cli/dist/index.mjs",
);

const buildConsumer = (): {
  withSource: string;
  withoutSource: string;
  cleanup: () => void;
} => {
  const builtStyles = resolve(repoRoot, "dist/styles.css");

  if (!existsSync(builtStyles)) {
    throw new Error("dist/styles.css is missing - run npm run build first");
  }
  const consumerDir = mkdtempSync(
    join(tmpdir(), "bowman-ui-tailwind-consumer-"),
  );
  const installedPackageDir = join(
    consumerDir,
    "node_modules",
    "@re-cinq",
    "bowman-ui",
  );

  mkdirSync(join(installedPackageDir, "dist"), { recursive: true });
  copyFileSync(
    resolve(repoRoot, "package.json"),
    join(installedPackageDir, "package.json"),
  );
  copyFileSync(builtStyles, join(installedPackageDir, "dist", "styles.css"));
  copyFileSync(
    join(fixtureDir, "FixtureComponent.js"),
    join(installedPackageDir, "dist", "FixtureComponent.js"),
  );
  symlinkSync(
    resolve(repoRoot, "node_modules/tailwindcss"),
    join(consumerDir, "node_modules", "tailwindcss"),
  );

  const compile = (inputName: string): string => {
    copyFileSync(join(fixtureDir, inputName), join(consumerDir, inputName));
    const outputPath = join(consumerDir, inputName.replace(".css", ".out.css"));

    execFileSync(
      process.execPath,
      [tailwindCli, "-i", inputName, "-o", outputPath],
      {
        cwd: consumerDir,
        encoding: "utf8",
      },
    );

    return readFileSync(outputPath, "utf8");
  };

  return {
    withSource: compile("input-with-source.css"),
    withoutSource: compile("input-without-source.css"),
    cleanup: () => rmSync(consumerDir, { recursive: true, force: true }),
  };
};

describe("the README's two lines against a real Tailwind v4 build", () => {
  let withSource = "";
  let withoutSource = "";
  let cleanup = (): void => undefined;

  beforeAll(() => {
    ({ withSource, withoutSource, cleanup } = buildConsumer());
  }, 120000);

  afterAll(() => {
    cleanup();
  });

  it("with the @source line, the compiled CSS contains the bg-slate-800 rule from the installed dist", () => {
    expect(withSource).toMatch(/\.bg-slate-800\s*\{/);
  });

  it("without the @source line, the same build does not emit bg-slate-800", () => {
    expect(withoutSource).not.toMatch(/\.bg-slate-800/);
  });

  it("resolves the styles.css import through the package exports map in both builds", () => {
    expect(withSource).toMatch(/@keyframes bowman-fade-in/);
    expect(withoutSource).toMatch(/@keyframes bowman-fade-in/);
  });
});
