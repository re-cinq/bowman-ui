// Red fixture for scripts/check-client-directives.mjs: a named import of
// createContext without "use client" - rule 2 alone must fire.
import { createContext } from "react";

export const ThemeContext = createContext("light");
