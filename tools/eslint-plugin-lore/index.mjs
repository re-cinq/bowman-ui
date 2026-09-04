import maxCommentLines from "./rules/max-comment-lines.mjs";
import noForwardingClass from "./rules/no-forwarding-class.mjs";
import noNestedIf from "./rules/no-nested-if.mjs";
import noNestedLoop from "./rules/no-nested-loop.mjs";
import noVagueNames from "./rules/no-vague-names.mjs";
import preferEarlyReturn from "./rules/prefer-early-return.mjs";
import preferEnforceTrue from "./rules/prefer-enforce-true.mjs";

/**
 * The generic subset of re-cinq/lore's eslint-plugin-lore, mirrored verbatim.
 * This index is LOCAL (it selects which upstream rules this repo consumes);
 * every file under rules/ is a byte-for-byte mirror of lore's, refreshed and
 * policed by scripts/check-house-style-sync.mjs, which also fails when lore
 * publishes a rule this repo has neither mirrored nor recorded as excluded
 * (the exclusion list and its reasons live in that script). Never edit the
 * mirrored rule files here; bowman-specific rules live in
 * tools/eslint-plugin-bowman.
 */
export default {
  meta: { name: "eslint-plugin-lore-mirror", version: "0.1.0" },
  rules: {
    "max-comment-lines": maxCommentLines,
    "no-forwarding-class": noForwardingClass,
    "no-nested-if": noNestedIf,
    "no-nested-loop": noNestedLoop,
    "no-vague-names": noVagueNames,
    "prefer-early-return": preferEarlyReturn,
    "prefer-enforce-true": preferEnforceTrue,
  },
};
