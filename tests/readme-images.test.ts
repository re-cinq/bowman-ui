import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const rawPrefix = "https://raw.githubusercontent.com/re-cinq/bowman-ui/main/";
const prose = readFileSync(resolve(root, "README.md"), "utf8").replace(/`[^`]*`/g, "");
const imageSources = [...prose.matchAll(/(?:!\[[^\]]*\]\(|<img\b[^>]*\ssrc=")([^)\s"]+)/g)].map(
  (match) => match[1]
);

describe("README images", () => {
  it("references the three screenshots by absolute raw URL on main", () => {
    expect(imageSources).toEqual([
      `${rawPrefix}docs/assets/hero-split.png`,
      `${rawPrefix}docs/assets/anatomy.png`,
      `${rawPrefix}docs/assets/mobile-drawer.png`,
    ]);
  });

  it("every referenced screenshot exists in the tree at the path the URL names", () => {
    const missing = imageSources
      .map((source) => source.slice(rawPrefix.length))
      .filter((path) => !existsSync(resolve(root, path)));

    expect(missing).toEqual([]);
  });
});
