import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { packedPaths } from "./helpers/built-package.js";

const stylesPath = resolve(process.cwd(), "dist/styles.css");

const readStyles = (): string => {
  if (!existsSync(stylesPath)) {
    throw new Error("dist/styles.css is missing - run npm run build first");
  }

  return readFileSync(stylesPath, "utf8");
};

const keyframeBlock = (css: string, name: string): string => {
  const match = css.match(new RegExp(`@keyframes ${name} \\{[\\s\\S]*?\\n\\}`));

  if (!match) {
    throw new Error(`@keyframes ${name} not found in dist/styles.css`);
  }

  return match[0];
};

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
  exports: Record<string, unknown>;
  sideEffects: string[];
};

describe("dist/styles.css", () => {
  it("declares exactly the four keyframes bowman-fade-in, bowman-toast-fade-in, bowman-fade-dot and bowman-pulse-subtle", () => {
    const names = [...readStyles().matchAll(/@keyframes ([\w-]+)/g)].map((match) => match[1]);

    expect(names).toEqual([
      "bowman-fade-in",
      "bowman-toast-fade-in",
      "bowman-fade-dot",
      "bowman-pulse-subtle",
    ]);
  });

  it("pairs each keyframe with a utility rule of the same name", () => {
    const css = readStyles();

    for (const name of [
      "bowman-fade-in",
      "bowman-toast-fade-in",
      "bowman-fade-dot",
      "bowman-pulse-subtle",
    ]) {
      expect(css).toMatch(new RegExp(`\\.${name} \\{\\n  animation: ${name} `));
    }
  });

  it('contains no @theme block, no @import "tailwindcss" and no @plugin line', () => {
    const css = readStyles();

    expect(css).not.toMatch(/@theme/);
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/@plugin/);
  });

  it("animates opacity and translateY only in bowman-fade-in - no translateX", () => {
    const fadeIn = keyframeBlock(readStyles(), "bowman-fade-in");

    expect(fadeIn).not.toMatch(/translateX/);
    expect(fadeIn).toMatch(/opacity/);
    expect(fadeIn).toMatch(/translateY/);
  });

  it("reads --bowman-accent-glow and --bowman-pulse-outline in the 50% stop of bowman-pulse-subtle, falling back to rgba(59, 130, 246, 0.1) and rgba(59, 130, 246, 0.5)", () => {
    const pulse = keyframeBlock(readStyles(), "bowman-pulse-subtle");

    expect(pulse).toMatch(
      /50% \{\n {4}box-shadow: 0 0 0 4px var\(--bowman-accent-glow, rgba\(59, 130, 246, 0\.1\)\);\n {4}outline: 2px solid var\(--bowman-pulse-outline, rgba\(59, 130, 246, 0\.5\)\);/
    );
    expect(pulse).toMatch(/box-shadow: 0 0 0 0 rgba\(59, 130, 246, 0\);/);
  });

  it("restates translateX(-50%) in both stops of bowman-toast-fade-in", () => {
    const toastFadeIn = keyframeBlock(readStyles(), "bowman-toast-fade-in");
    const fromStop = toastFadeIn.match(/from \{[\s\S]*?\}/);
    const toStop = toastFadeIn.match(/to \{[\s\S]*?\}/);

    expect(fromStop?.[0]).toMatch(/translateX\(-50%\)/);
    expect(toStop?.[0]).toMatch(/translateX\(-50%\)/);
  });

  it("neutralises all four animations under prefers-reduced-motion, touching no transform, with no data-animations selector", () => {
    const css = readStyles();
    const media = css.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/);

    expect(media?.[0]).toMatch(
      /\.bowman-fade-in,\n {2}\.bowman-toast-fade-in,\n {2}\.bowman-fade-dot,\n {2}\.bowman-pulse-subtle \{\n {4}animation: none;/
    );
    expect(media?.[0]).not.toMatch(/transform/);
    expect(css).not.toMatch(/data-animations/);
  });

  it("declares no :root block - every --bowman-* default lives only in its var() fallback", () => {
    expect(readStyles()).not.toMatch(/:root/);
  });
});

describe("package.json stylesheet contract", () => {
  it('exports gains "./styles.css" alongside the unchanged "." entry', () => {
    expect(packageJson.exports).toEqual({
      ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
      "./styles.css": "./dist/styles.css",
    });
  });

  it('sideEffects includes "*.css"', () => {
    expect(packageJson.sideEffects).toContain("*.css");
  });

  it("mentions @tailwindcss/typography in no field", () => {
    expect(JSON.stringify(packageJson)).not.toMatch(/@tailwindcss\/typography/);
  });

  it("lists dist/styles.css in npm pack --dry-run", () => {
    expect(packedPaths()).toContain("dist/styles.css");
  });
});

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : [join(dir, entry.name)]
  );

describe("the typography-plugin replacement", () => {
  it('grep for "prose" in src/ returns nothing', () => {
    const hits = sourceFiles(resolve(process.cwd(), "src")).filter((file) =>
      readFileSync(file, "utf8").includes("prose")
    );

    expect(hits).toEqual([]);
  });

  it("no src file hand-writes a visually-hidden clip; bowman-sr-only is the one definition", () => {
    const handWrittenClip = /rect\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)|\.style\.clip\b|clipPath/;
    const hits = sourceFiles(resolve(process.cwd(), "src")).filter((file) =>
      handWrittenClip.test(readFileSync(file, "utf8"))
    );

    expect(hits).toEqual([]);
  });

  it("styles.css declares the bowman-sr-only rule the markdown notice, Toast, ConversationList and useFocusGroups depend on", () => {
    expect(readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8")).toMatch(
      /\.bowman-sr-only \{/
    );
  });
});
