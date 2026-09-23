/**
 * Shared AST readers for the bowman rules. Each returns the name a rule
 * matches against, or null when the node is not that shape - so a denylist
 * lookup (`SET.has(name)`) is false for anything else without a guard.
 */

export function identifierName(node) {
  return node?.type === "Identifier" ? node.name : null;
}

// A string literal or a template literal without substitutions, read as its text.
function stringSpelling(node) {
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }

  return node?.type === "Literal" && typeof node.value === "string" ? node.value : null;
}

// The property name of `object.property`, of its computed string spelling
// `object["property"]` or of a substitution-free template `object[`property`]`;
// null for any other computed property (an identifier, a template with
// substitutions, a number) or a private name (`object.#property`).
export function memberPropertyName(node) {
  if (node?.type !== "MemberExpression") {
    return null;
  }

  if (node.computed) {
    return stringSpelling(node.property);
  }

  return identifierName(node.property);
}
