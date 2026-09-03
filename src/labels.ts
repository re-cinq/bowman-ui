// The labels convention's merge helper (docs/design-notes.md § Labels): shallow-merges
// a consumer's partial overrides over a component's complete English defaults.
// An override key holding an explicit `undefined` counts as missing - that is
// what a consumer's own optional-chained catalogue lookup produces - so a
// plain spread would be wrong here. Neither argument is mutated.
export const resolveLabels = <T extends object>(
  defaults: Required<T>,
  overrides?: Partial<T>
): Required<T> => {
  const resolved: Required<T> = { ...defaults };

  if (!overrides) {
    return resolved;
  }

  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const value = overrides[key];

    if (value !== undefined) {
      resolved[key] = value as Required<T>[typeof key];
    }
  }

  return resolved;
};
