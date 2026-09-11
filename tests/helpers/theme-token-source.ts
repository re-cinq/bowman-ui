import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const readFromRepoRoot = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), "utf8");

export const bowmanTokenNamesIn = (source: string): string[] =>
  source.match(/--bowman-[a-z-]+/g) ?? [];
