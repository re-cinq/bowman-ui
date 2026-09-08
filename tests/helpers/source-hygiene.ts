import { readdirSync } from "node:fs";
import { join } from "node:path";

export const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)]
  );

export const expectNoEgress = (source: string): void => {
  expect(source).not.toMatch(
    /console\.|localStorage|sessionStorage|fetch|sendBeacon|analytics|indexedDB/i
  );
};

export const expectImportHygiene = (source: string): void => {
  expect(source).not.toMatch(/@clerk|swr|next-intl|next\/|@\/|lucide-react/);
  const relativeImports = [...source.matchAll(/from\s+"(\.[^"]+)"/g)].map(([, spec]) => spec);

  expect(relativeImports.length).toBeGreaterThan(0);

  for (const spec of relativeImports) {
    expect(spec).toMatch(/\.js$/);
  }
};
