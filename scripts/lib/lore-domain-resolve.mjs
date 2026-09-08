// Module-customization hook letting tools/lore-shared/ keep lore's `.js`
// relative imports untouched: inside that tree only, a relative `.js`
// specifier resolves to the mirrored `.ts` file.

const MIRROR_DIR = new URL("../../tools/lore-shared/", import.meta.url).href;

const isMirroredRelativeImport = (specifier, parentURL) =>
  Boolean(parentURL) && parentURL.startsWith(MIRROR_DIR) && /^\.{1,2}\/.+\.js$/.test(specifier);

export function resolve(specifier, context, next) {
  if (isMirroredRelativeImport(specifier, context.parentURL)) {
    return next(specifier.replace(/\.js$/, ".ts"), context);
  }

  return next(specifier, context);
}
