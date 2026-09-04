// Labels merge (design-notes § Labels): an explicit undefined override counts as missing, unlike a plain spread.
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
