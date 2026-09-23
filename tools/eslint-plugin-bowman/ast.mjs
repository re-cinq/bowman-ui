/**
 * Shared AST readers for the bowman rules. Each returns the name a rule
 * matches against, or null when the node is not that shape - so a denylist
 * lookup (`SET.has(name)`) is false for anything else without a guard.
 */

export function identifierName(node) {
  return node?.type === "Identifier" ? node.name : null;
}

function stringLiteralValue(node) {
  return node?.type === "Literal" && typeof node.value === "string" ? node.value : null;
}

// The property name of `object.property` or of its computed string spelling
// `object["property"]`; null for any other computed property (an identifier,
// a template literal) or a private name (`object.#property`).
export function memberPropertyName(node) {
  if (node?.type !== "MemberExpression") {
    return null;
  }

  if (node.computed) {
    return stringLiteralValue(node.property);
  }

  return identifierName(node.property);
}
