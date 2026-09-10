import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const rawPrefix = "https://raw.githubusercontent.com/re-cinq/bowman-ui/main/";
const prose = readFileSync(resolve(root, "README.md"), "utf8").replace(/`[^`]*`/g, "");
const imageSources = [...prose.matchAll(/(?:!\[[^\]]*\]\(|<img\b[^>]*\ssrc=")([^)\s"]+)/g)].map(
  (match) => match[1]
);
const screenshots = imageSources.filter((source) => source.startsWith(rawPrefix));
const badges = imageSources.filter((source) => !source.startsWith(rawPrefix));

describe("README images", () => {
  it("references the three screenshots by absolute raw URL on main", () => {
    expect(screenshots).toEqual([
      `${rawPrefix}docs/assets/hero-split.png`,
      `${rawPrefix}docs/assets/anatomy.png`,
      `${rawPrefix}docs/assets/mobile-drawer.png`,
    ]);
  });

  it("every referenced screenshot exists in the tree at the path the URL names", () => {
    const missing = screenshots
      .map((source) => source.slice(rawPrefix.length))
      .filter((path) => !existsSync(resolve(root, path)));

    expect(missing).toEqual([]);
  });

  it("the only other images are the npm, CI and license badges", () => {
    expect(badges).toEqual([
      "https://img.shields.io/npm/v/%40re-cinq%2Fbowman-ui",
      "https://github.com/re-cinq/bowman-ui/actions/workflows/ci.yml/badge.svg",
      "https://img.shields.io/badge/license-Apache--2.0-blue",
    ]);
  });
});
