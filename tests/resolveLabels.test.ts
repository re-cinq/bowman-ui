import { resolveLabels } from "../src/labels.js";

interface MessageLabels {
  copy: string;
  retry: string;
  deletedCount: (count: number) => string;
}

const defaults: Required<MessageLabels> = {
  copy: "Copy message",
  retry: "Try again",
  deletedCount: (count) => `${count} messages deleted`,
};

describe("resolveLabels", () => {
  it('{ copy: "Copiar" } replaces copy and keeps every other default', () => {
    expect(resolveLabels(defaults, { copy: "Copiar" })).toEqual({
      copy: "Copiar",
      retry: "Try again",
      deletedCount: defaults.deletedCount,
    });
  });

  it("an undefined overrides argument returns the defaults", () => {
    expect(resolveLabels(defaults, undefined)).toEqual(defaults);
  });

  it('{ copy: undefined } - a consumer\'s missed catalogue lookup - returns "Copy message", not undefined', () => {
    expect(resolveLabels(defaults, { copy: undefined })).toMatchObject({ copy: "Copy message" });
  });

  it("a function-valued label overrides like any other key, pinning the interpolation form", () => {
    const resolved = resolveLabels(defaults, {
      deletedCount: (count) => `${count} mensajes eliminados`,
    });
    expect(resolved.deletedCount(3)).toBe("3 mensajes eliminados");
    expect(defaults.deletedCount(3)).toBe("3 messages deleted");
  });

  it("mutates neither argument", () => {
    const frozenCopy = JSON.parse(JSON.stringify({ copy: defaults.copy, retry: defaults.retry }));
    const overrides = { copy: "Copiar", retry: undefined };

    resolveLabels(defaults, overrides);

    expect({ copy: defaults.copy, retry: defaults.retry }).toEqual(frozenCopy);
    expect(overrides).toEqual({ copy: "Copiar", retry: undefined });
  });

  it("accepts Object.freeze(defaults) without throwing and returns a fresh object", () => {
    const frozen = Object.freeze({ copy: "Copy message", retry: "Try again" });

    const resolved = resolveLabels(frozen, { copy: "Copiar" });

    expect(resolved).toEqual({ copy: "Copiar", retry: "Try again" });
    expect(resolved).not.toBe(frozen);
    expect(frozen).toEqual({ copy: "Copy message", retry: "Try again" });
  });
});
