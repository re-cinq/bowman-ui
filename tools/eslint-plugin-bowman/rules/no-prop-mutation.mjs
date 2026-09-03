/**
 * no-prop-mutation — a component receives its data as read-only props and, to
 * change state, invokes a callback prop rather than mutating what it was
 * handed. This flags mutation of the props parameter: assignment, update and
 * delete through it, and in-place mutating method calls (push/sort/set/...)
 * on it - see docs/design-notes.md § Lint guardrails.
 *
 * Scope-based: each mutation's root identifier is resolved back to the
 * props-param variable, so a local that merely shares a prop's name is never
 * flagged. Only the FIRST parameter is treated as props — a forwardRef's
 * second `ref` argument and its `.current` writes are left alone. A function
 * counts as a component when it carries a capitalized name OR is passed
 * directly to memo/forwardRef — the wrapped form is usually anonymous.
 *
 * Detect-only: the fix is lifting state to the owner and passing a callback
 * down, which needs human judgment.
 */

const MUTATORS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
  "set",
  "add",
  "delete",
  "clear",
]);

function componentName(node) {
  if (node.id && node.id.type === "Identifier") {
    return node.id.name;
  }

  const parent = node.parent;

  if (parent && parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return parent.id.name;
  }

  return null;
}

function isComponentName(name) {
  return typeof name === "string" && /^[A-Z]/.test(name);
}

const COMPONENT_WRAPPERS = new Set(["memo", "forwardRef"]);

function calleeName(callee) {
  if (callee.type === "Identifier") {
    return callee.name;
  }

  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }

  return null;
}

function isWrappedComponent(node) {
  const parent = node.parent;

  return (
    parent?.type === "CallExpression" &&
    parent.arguments.includes(node) &&
    COMPONENT_WRAPPERS.has(calleeName(parent.callee) ?? "")
  );
}

function rootIdentifier(node) {
  let current = node;

  while (current && current.type === "MemberExpression") {
    current = current.object;
  }

  return current && current.type === "Identifier" ? current : null;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "disallow mutating props in components - data flows down read-only, changes flow up via callback props - see docs/design-notes.md § Lint guardrails",
    },
    schema: [],
    messages: {
      propMutation:
        "Don't mutate props ('{{name}}') - data flows down read-only; send the change up via a callback prop - see docs/design-notes.md § Lint guardrails.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const propRefs = new Set();

    function collectProps(node) {
      if (!node.params[0]) {
        return;
      }

      if (!isComponentName(componentName(node)) && !isWrappedComponent(node)) {
        return;
      }

      const [start, end] = node.params[0].range;

      for (const variable of sourceCode.getDeclaredVariables(node)) {
        const def = variable.defs[0];

        if (!def || def.type !== "Parameter") {
          continue;
        }

        if (def.name.range[0] < start || def.name.range[1] > end) {
          continue;
        }

        for (const reference of variable.references) {
          propRefs.add(reference.identifier);
        }
      }
    }

    function flagIfProp(target, reportNode) {
      const root = rootIdentifier(target);

      if (root && propRefs.has(root)) {
        context.report({
          node: reportNode,
          messageId: "propMutation",
          data: { name: sourceCode.getText(target) },
        });
      }
    }

    return {
      FunctionDeclaration: collectProps,
      FunctionExpression: collectProps,
      ArrowFunctionExpression: collectProps,

      AssignmentExpression(node) {
        flagIfProp(node.left, node);
      },
      UpdateExpression(node) {
        flagIfProp(node.argument, node);
      },
      UnaryExpression(node) {
        if (node.operator === "delete") {
          flagIfProp(node.argument, node);
        }
      },
      CallExpression(node) {
        const callee = node.callee;

        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          MUTATORS.has(callee.property.name)
        ) {
          flagIfProp(callee.object, node);
        }
      },
    };
  },
};
