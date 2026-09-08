import { readdirSync } from "node:fs";
import { join } from "node:path";

export const listSourceFiles = (directory) => {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};
