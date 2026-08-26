// Green fixture for scripts/check-client-directives.mjs: hook-shaped names
// arriving as type-only imports, in both the declaration and the specifier
// form. Type-only imports are erased at compile time and must not fire. The
// specifiers never resolve; the check only parses.
import type { useDeclaredHook } from "./useDeclaredHook.js";
import { type useInlineHook } from "./useInlineHook.js";

export type DeclaredHook = typeof useDeclaredHook;
export type InlineHook = typeof useInlineHook;
