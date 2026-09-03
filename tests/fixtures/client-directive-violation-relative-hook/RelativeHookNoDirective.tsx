// Red fixture for scripts/check-client-directives.mjs: imports a hook-shaped
// name from a relative specifier, not from "react" - the rule matches
// /^use[A-Z]/ named imports from any module specifier. The module does not
// exist; the check parses, it never resolves.
import { useWidgetState } from "./useWidgetState.js";

export const RelativeHookNoDirective = () => {
  const widget = useWidgetState();

  return <span>{widget}</span>;
};
