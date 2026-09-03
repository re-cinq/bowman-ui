import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve(process.cwd(), "scripts/check-client-directives.mjs"), "utf8");

const triggerList = (): string[] => {
  const block = script.match(/const BROWSER_GLOBALS = new Set\(\[([\s\S]*?)\]\);/);

  if (!block) {
    throw new Error("BROWSER_GLOBALS is no longer declared inline in check-client-directives.mjs");
  }

  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
};

describe("the browser-global trigger list", () => {
  it("carries exactly the 18 measured names, the navigator and WebSocket silent divergences included", () => {
    expect(triggerList().sort()).toEqual([
      "FileReader",
      "IntersectionObserver",
      "MutationObserver",
      "ResizeObserver",
      "WebSocket",
      "XMLHttpRequest",
      "alert",
      "cancelAnimationFrame",
      "document",
      "getComputedStyle",
      "history",
      "localStorage",
      "location",
      "matchMedia",
      "navigator",
      "requestAnimationFrame",
      "sessionStorage",
      "window",
    ]);
  });

  it("excludes the server-defined globals and the DOM type names", () => {
    const list = new Set(triggerList());
    const excluded = [
      "fetch",
      "crypto",
      "URL",
      "performance",
      "structuredClone",
      "Blob",
      "Event",
      "CustomEvent",
      "HTMLElement",
      "Element",
      "Node",
      "SVGSVGElement",
    ];

    for (const name of excluded) {
      expect(list.has(name)).toEqual(false);
    }
  });
});
