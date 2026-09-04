import maxBooleanOperators from "./rules/max-boolean-operators.mjs";
import noCatchAsControlFlow from "./rules/no-catch-as-control-flow.mjs";
import noInlineStyles from "./rules/no-inline-styles.mjs";
import noNetworkEgress from "./rules/no-network-egress.mjs";
import noPropMutation from "./rules/no-prop-mutation.mjs";

/**
 * eslint-plugin-bowman — repo-local ESLint rules codifying bowman-ui house
 * conventions (docs/design-notes.md § Lint guardrails). Loaded by
 * eslint.config.mjs via relative import — no package.json, no build, no
 * publish; the flat config is the only consumer.
 */
export default {
  meta: { name: "eslint-plugin-bowman", version: "0.1.0" },
  rules: {
    "max-boolean-operators": maxBooleanOperators,
    "no-catch-as-control-flow": noCatchAsControlFlow,
    "no-inline-styles": noInlineStyles,
    "no-network-egress": noNetworkEgress,
    "no-prop-mutation": noPropMutation,
  },
};
