import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
const stylesStart = readme.indexOf("\n## Styles\n");
const stylesSection = readme.slice(stylesStart + 1).split("\n## ")[0];
const consumerLines = (stylesSection.match(/```css\n([\s\S]*?)```/)?.[1] ?? "")
  .split("\n")
  .filter((line) => line !== "");

describe("README Styles section", () => {
  it('shows exactly two consumer lines: @import "@re-cinq/bowman-ui/styles.css" and the @source line', () => {
    expect(stylesStart).toBeGreaterThan(-1);
    expect(consumerLines).toEqual([
      '@import "@re-cinq/bowman-ui/styles.css";',
      '@source "../node_modules/@re-cinq/bowman-ui/dist";',
    ]);
  });

  it("names Tailwind CSS v4 as required, ships only what Tailwind cannot generate, and scans the installed dist", () => {
    expect(stylesSection).toMatch(/Tailwind CSS v4 is required/);
    expect(stylesSection).toMatch(/ships only what Tailwind cannot generate from a class name/);
    expect(stylesSection).toMatch(/by scanning the installed `dist`/);
  });
});
