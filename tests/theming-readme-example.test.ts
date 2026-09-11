import { describe, expect, it } from "vitest";
import {
  bowmanTokenNamesIn as tokenNames,
  readFromRepoRoot as read,
} from "./helpers/theme-token-source.js";

const allTokens = new Set([
  ...tokenNames(read("src/theme/tokens.ts")),
  ...tokenNames(read("src/styles.css")),
]);

const twinnedLightTokens = new Set(
  [...allTokens].filter((name) => !name.endsWith("-dark") && allTokens.has(`${name}-dark`))
);

const bowmanCssBlocks = (markdown: string): string[] =>
  [...markdown.matchAll(/```css\n([\s\S]*?)```/g)]
    .map((match) => match[1])
    .filter((code) => code.includes("--bowman-"));

const ruleBodies = (css: string): string[] =>
  [...css.matchAll(/\{([^}]*)\}/g)].map((match) => match[1]);

const assignedTokens = (body: string): string[] =>
  [...body.matchAll(/(--bowman-[a-z-]+)\s*:/g)].map((match) => match[1]);

const readmeBlocks = bowmanCssBlocks(read("README.md"));

describe("README theming example", () => {
  it("assigns only real --bowman tokens", () => {
    const used = readmeBlocks.flatMap((block) => ruleBodies(block).flatMap(assignedTokens));
    const unknown = used.filter((name) => !allTokens.has(name));

    expect(unknown).toEqual([]);
  });

  it("sets the -dark twin wherever it sets a twinned light token", () => {
    const missing = readmeBlocks.flatMap((block) =>
      ruleBodies(block).flatMap((body) => {
        const assigned = new Set(assignedTokens(body));

        return [...assigned]
          .filter((name) => twinnedLightTokens.has(name) && !assigned.has(`${name}-dark`))
          .map((name) => `${name}-dark`);
      })
    );

    expect(missing).toEqual([]);
  });
});
