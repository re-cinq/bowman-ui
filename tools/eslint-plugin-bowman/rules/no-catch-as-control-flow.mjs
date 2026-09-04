/**
 * no-catch-as-control-flow — flag a catch clause that swallows the error AND
 * fabricates a return value (returns a call or constructor result). That
 * shape is try/catch used as an if: the error is never observed, it is
 * silently traded for an alternate code path. Return a sentinel
 * (`catch { return null; }` stays legal), or reference the error before
 * mapping it - see docs/design-notes.md § Lint guardrails.
 *
 * A catch *swallows* when it has no parameter or never references it. A catch
 * *fabricates* when a return in its own scope (nested functions excluded)
 * returns a call, constructor, or awaited-call result — literals, identifiers
 * and object literals are sentinel fallbacks and stay legal. Detect-only.
 */

const FUNCTION_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

function referencesName(node, name) {
  if (!node || typeof node.type !== "string") {
    return false;
  }

  if (node.type === "Identifier") {
    return node.name === name;
  }

  // A non-computed property name is not a reference: `settings.err` never
  // observes the caught `err`. Same for `{ err: value }` keys. Computed
  // access (`settings[err]`) falls through to the generic walk, where the
  // identifier genuinely is a reference.
  if (node.type === "MemberExpression" && !node.computed) {
    return referencesName(node.object, name);
  }

  if (node.type === "Property" && !node.computed) {
    return referencesName(node.value, name);
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }

    const value = node[key];

    if (Array.isArray(value)) {
      if (value.some((child) => referencesName(child, name))) {
        return true;
      }
    } else if (
      value &&
      typeof value.type === "string" &&
      referencesName(value, name)
    ) {
      return true;
    }
  }

  return false;
}

function ownReturns(node, acc = []) {
  if (!node || typeof node.type !== "string" || FUNCTION_TYPES.has(node.type)) {
    return acc;
  }

  if (node.type === "ReturnStatement") {
    acc.push(node);

    return acc;
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }

    const value = node[key];

    if (Array.isArray(value)) {
      value.forEach((child) => ownReturns(child, acc));
    } else if (value && typeof value.type === "string") {
      ownReturns(value, acc);
    }
  }

  return acc;
}

function fabricatesValue(returnStatement) {
  let argument = returnStatement.argument;

  if (!argument) {
    return false;
  }

  if (argument.type === "AwaitExpression") {
    argument = argument.argument;
  }

  return (
    argument.type === "CallExpression" || argument.type === "NewExpression"
  );
}

function swallowsError(catchClause) {
  if (!catchClause.param) {
    return true;
  }

  if (catchClause.param.type !== "Identifier") {
    return false;
  }

  return !referencesName(catchClause.body, catchClause.param.name);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow catch clauses that swallow the error and fabricate a return value - see docs/design-notes.md § Lint guardrails",
    },
    schema: [],
    messages: {
      catchAsControlFlow:
        "This catch swallows the error and fabricates a return value - try/catch as control flow. Return a sentinel, or reference the error before mapping it - see docs/design-notes.md § Lint guardrails.",
    },
  },

  create(context) {
    return {
      CatchClause(node) {
        if (!swallowsError(node)) {
          return;
        }

        if (!ownReturns(node.body).some(fabricatesValue)) {
          return;
        }

        context.report({ node, messageId: "catchAsControlFlow" });
      },
    };
  },
};
