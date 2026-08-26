// Red fixture for scripts/check-client-directives.mjs: the only client
// reference is localStorage.getItem - no hook, no createContext, no class
// heritage, no JSX. The browser-global rule alone must fire.
export const readStoredTheme = () => localStorage.getItem("theme");
