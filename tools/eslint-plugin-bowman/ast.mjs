/**
 * Shared AST readers for the bowman rules. Each returns the name a rule
 * matches against, or null when the node is not that shape - so a denylist
 * lookup (`SET.has(name)`) is false for anything else without a guard.
 */

export function identifierName(node) {
  return node?.type === "Identifier" ? node.name : null;
}

// The property name of a non-computed `object.property`; null for a computed
// member (`object["property"]`) or a private name (`object.#property`).
export function memberPropertyName(node) {
  if (node?.type !== "MemberExpression" || node.computed) {
    return null;
  }

  return identifierName(node.property);
}
