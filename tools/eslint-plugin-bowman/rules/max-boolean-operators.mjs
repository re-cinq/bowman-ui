/**
 * max-boolean-operators — a single condition may chain at most `max` boolean
 * logical operators (`&&` / `||`). Anything denser reads as a puzzle; the fix
 * is to lift the expression into a named predicate so the branch reveals its
 * intent — see docs/design-notes.md § Lint guardrails.
 *
 * Counted contexts: `if`, `while`/`do-while`/`for` tests, ternary conditions,
 * the right-hand side of variable declarations and assignments, and JSX
 * conditional renders (`{a && b && c && <Menu />}`). `??` is value-selection,
 * not boolean branching, so it never counts toward the budget — but it is not
 * a boundary either: `&&`/`||` on both sides of a `??` share one budget.
 *
 * Detect-only: naming the predicate is human judgment, not a mechanical
 * rewrite. Default `max` is 2 (a third operator fires).
 */

const BOOLEAN_OPERATORS = new Set(["&&", "||"]);

function countBooleanOperators(node) {
  if (!node || typeof node !== "object" || node.type !== "LogicalExpression") {
    return 0;
  }

  const self = BOOLEAN_OPERATORS.has(node.operator) ? 1 : 0;

  return self + countBooleanOperators(node.left) + countBooleanOperators(node.right);
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "limit the boolean logical operators chained in a single condition or assignment - see docs/design-notes.md § Lint guardrails",
    },
    schema: [
      {
        type: "object",
        properties: { max: { type: "integer", minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyOperators:
        "Condition chains {{count}} boolean operators (max {{max}}). Extract a named predicate so the branch reveals its intent - see docs/design-notes.md § Lint guardrails.",
    },
  },
  create(context) {
    const max = context.options[0]?.max ?? 2;

    function check(expression) {
      if (!expression) {
        return;
      }

      const count = countBooleanOperators(expression);

      if (count > max) {
        context.report({ node: expression, messageId: "tooManyOperators", data: { count, max } });
      }
    }

    return {
      IfStatement: (node) => check(node.test),
      WhileStatement: (node) => check(node.test),
      DoWhileStatement: (node) => check(node.test),
      ForStatement: (node) => check(node.test),
      ConditionalExpression: (node) => check(node.test),
      VariableDeclarator: (node) => check(node.init),
      AssignmentExpression: (node) => check(node.right),
      JSXExpressionContainer: (node) => check(node.expression),
    };
  },
};
