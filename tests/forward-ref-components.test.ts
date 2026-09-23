import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { listFiles } from "./helpers/source-hygiene.js";

/**
 * docs/design-notes.md decision 4: the package uses forwardRef throughout, and no
 * cleanup may rewrite it away. Issue 133 showed that a ref-as-prop rewrite keeps
 * every behavioural ref test green under React 19, so the idiom is pinned here on
 * the built package for every ref-taking component at once. The fixture is the
 * closed list, name to declaring file: a seventh forwardRef component, or one
 * fewer, is a deliberate edit of tests/fixtures/forward-ref-components.json.
 */
const FORWARD_REF = Symbol.for("react.forward_ref");
const fixturePath = resolve(process.cwd(), "tests/fixtures/forward-ref-components.json");
const committed = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, string>;
const committedNames = Object.keys(committed);

const elementTypeOf = (value: unknown): symbol | undefined => {
  if (typeof value !== "object" || value === null || !("$$typeof" in value)) {
    return undefined;
  }

  return typeof value.$$typeof === "symbol" ? value.$$typeof : undefined;
};

const builtBarrel = (): Promise<Record<string, unknown>> =>
  import(resolve(process.cwd(), "dist/index.js"));

describe("decision 4's forwardRef idiom across the built package", () => {
  it("every committed forwardRef component is a forwardRef exotic component in the built package", async () => {
    const built = await builtBarrel();

    for (const name of committedNames) {
      expect(elementTypeOf(built[name]), name).toBe(FORWARD_REF);
    }
  });

  it("the built exports that are forwardRef exotic components are exactly the committed forwardRef components", async () => {
    const built = await builtBarrel();
    const forwardRefExports = Object.entries(built)
      .filter(([, value]) => elementTypeOf(value) === FORWARD_REF)
      .map(([name]) => name)
      .sort();

    expect(forwardRefExports).toEqual(committedNames);
  });

  it("the source files that call forwardRef are exactly the committed declaring files, each declaring its name", () => {
    const root = process.cwd();
    const declaringFiles = listFiles(resolve(root, "src"))
      .filter((file) => /\bforwardRef[<(]/.test(readFileSync(file, "utf8")))
      .map((file) => relative(root, file).replaceAll("\\", "/"))
      .sort();

    expect(declaringFiles).toEqual(Object.values(committed).sort());

    for (const [name, file] of Object.entries(committed)) {
      expect(readFileSync(resolve(root, file), "utf8")).toMatch(
        new RegExp(`\\b${name} = forwardRef[<(]`)
      );
    }
  });

  it("the fixture is sorted by component name and maps each name to a distinct file", () => {
    expect(committedNames).toEqual([...committedNames].sort());
    expect(new Set(Object.values(committed)).size).toBe(committedNames.length);
  });
});
