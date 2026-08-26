// Red fixture for scripts/check-client-directives.mjs: createContext without
// "use client", both as a named import and as a namespace-member reference -
// the old textual matcher caught React.createContext, so the AST rewrite must
// not narrow it away.
import { createContext } from "react";
import * as React from "react";

export const ThemeContext = createContext("light");
export const LocaleContext = React.createContext("da");
