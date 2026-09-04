/**
 * no-inline-styles — styling lives in src/styles.css or a Tailwind class, not
 * in a JSX style prop, so a shared decision has one home - see
 * docs/design-notes.md § Lint guardrails.
 *
 * A computed `style={obj}` is reported too — the styling decision is still
 * sitting in the component. A component whose styling genuinely cannot leave
 * the element turns the rule off by path in eslint.config.mjs, where the
 * exemption is visible and reviewable, rather than by silent tolerance here.
 *
 * The one shape that passes is an object of nothing but CSS custom
 * properties — `style={{ "--meter-ratio": ratio }}`. That is not a styling
 * decision in the component: the rules still live in the stylesheet, which
 * reads the variable; the component only hands it a value.
 */

/** `"--x"`, `` `--x` ``, and the `["--x" as string]` cast the TS types force. */
function customPropertyName(node) {
  if (node?.type === "TSAsExpression" || node?.type === "TSTypeAssertion") {
    return customPropertyName(node.expression);
  }

  if (node?.type === "Literal") {
    return typeof node.value === "string" && node.value.startsWith("--");
  }

  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked?.startsWith("--") === true;
  }

  return false;
}

/**
 * An object literal that sets custom properties and nothing else. Unwraps the
 * `as CSSProperties` cast callers need, since `CSSProperties` has no index
 * signature for `--*` keys.
 */
function customPropertiesOnly(node) {
  if (node?.type === "TSAsExpression" || node?.type === "TSTypeAssertion") {
    return customPropertiesOnly(node.expression);
  }

  if (node?.type !== "ObjectExpression" || node.properties.length === 0) {
    return false;
  }

  return node.properties.every(
    (property) =>
      property.type === "Property" && customPropertyName(property.key),
  );
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "styling lives in the stylesheet or a class, not in a JSX style prop - see docs/design-notes.md § Lint guardrails",
    },
    schema: [],
    messages: {
      inlineStyle:
        "Inline style on <{{element}}>. Move it to src/styles.css or a class - an inline object cannot be shared, so the same rule ends up copied. Objects of only CSS custom properties are allowed - see docs/design-notes.md § Lint guardrails.",
    },
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.type !== "JSXIdentifier" || node.name.name !== "style") {
          return;
        }

        if (
          node.value?.type === "JSXExpressionContainer" &&
          customPropertiesOnly(node.value.expression)
        ) {
          return;
        }

        const owner = node.parent?.name;

        context.report({
          node,
          messageId: "inlineStyle",
          data: {
            element: owner?.type === "JSXIdentifier" ? owner.name : "element",
          },
        });
      },
    };
  },
};
