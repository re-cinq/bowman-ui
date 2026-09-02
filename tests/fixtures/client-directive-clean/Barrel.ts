// Green fixture for scripts/check-client-directives.mjs: the barrel shape.
// Re-exports six client-only names with no directive of its own - the
// correct shape under docs/design-notes.md decision 1. export ... from is not an
// import; a text-matching implementation breaks this silently. The specifiers
// never resolve; the check only parses.
export { useDebounce } from "./hooks/useDebounce.js";
export { useFocusTrap } from "./hooks/useFocusTrap.js";
export { useFocusGroups } from "./hooks/useFocusGroups.js";
export { useReducedMotion } from "./hooks/useReducedMotion.js";
export { useSidebarState } from "./hooks/useSidebarState.js";
export { ErrorBoundary } from "./components/ErrorBoundary.js";
export type { FocusGroupsOptions } from "./hooks/useFocusGroups.js";
