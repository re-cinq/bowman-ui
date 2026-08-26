// Red fixture for scripts/check-client-directives.mjs: the hook arrives as a
// namespace-member call, React.useState(...), with no named import in sight.
// The old textual matcher caught this; the AST rewrite must not narrow it away.
import * as React from "react";

export const useCounter = () => {
  const [count] = React.useState(0);
  return count;
};
