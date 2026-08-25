import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const builtPlaceholder = resolve(process.cwd(), "dist/Placeholder.js");

it('emits "use client"; as the first line of dist/Placeholder.js', () => {
  if (!existsSync(builtPlaceholder)) {
    throw new Error("dist/Placeholder.js is missing - run npm run build first");
  }
  const firstLine = readFileSync(builtPlaceholder, "utf8").split("\n")[0];
  expect(firstLine).toBe('"use client";');
});
