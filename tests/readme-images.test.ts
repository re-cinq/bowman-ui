import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const prose = readFileSync(resolve(root, "README.md"), "utf8").replace(/`[^`]*`/g, "");
const imageSources = [...prose.matchAll(/(?:!\[[^\]]*\]\(|<img\b[^>]*\ssrc=")([^)\s"]+)/g)].map(
  (match) => match[1]
);

describe("README images", () => {
  it("references the three screenshots by repository-relative path", () => {
    expect(imageSources).toEqual([
      "docs/assets/hero-split.png",
      "docs/assets/anatomy.png",
      "docs/assets/mobile-drawer.png",
    ]);
  });

  it("every referenced screenshot exists in the tree", () => {
    const missing = imageSources.filter((source) => !existsSync(resolve(root, source)));

    expect(missing).toEqual([]);
  });
});
