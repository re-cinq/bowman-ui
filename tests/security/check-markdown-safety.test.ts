import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const script = join(process.cwd(), "scripts", "check-markdown-safety.mjs");

type RunResult = { status: number | null; stdout: string; stderr: string };

const run = (root: string): RunResult => {
  const result = spawnSync(process.execPath, [script, root], { encoding: "utf8" });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

const write = (root: string, path: string, content: string) => {
  mkdirSync(join(root, dirname(path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const FROZEN_SCHEMES = 'Object.freeze(["https", "mailto", "tel"])';

const EXACT_SET_MESSAGE = 'allowedSchemes literals must be exactly ["https", "mailto", "tel"]';

const SPREAD_MESSAGE = "defaultMarkdownPolicy must not spread another object";

const cleanPolicy = `export const defaultMarkdownPolicy = Object.freeze({
  allowedSchemes: ${FROZEN_SCHEMES},
  allowRelativeUrls: false,
  linkTarget: "_blank",
  allowImages: false,
});
`;

const makeTree = (): string => {
  const root = mkdtempSync(join(tmpdir(), "check-markdown-safety-"));

  write(root, "package.json", JSON.stringify({ name: "fixture", dependencies: {} }));
  write(root, "src/markdown/urlPolicy.ts", cleanPolicy);
  write(root, "src/index.ts", "export const noop = () => undefined;\n");

  return root;
};

describe("check-markdown-safety", () => {
  let root: string;

  beforeEach(() => {
    root = makeTree();
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("exits 0 on a clean crafted tree", () => {
    const result = run(root);

    expect(result).toMatchObject({ status: 0 });
    expect(result.stdout).toContain("markdown pipeline invariants hold");
  });

  it("exits 0 on the real repository tree", () => {
    const result = run(resolve(process.cwd()));

    expect(result).toMatchObject({ status: 0 });
  });

  it("exits 1 when package.json declares rehype-raw", () => {
    write(
      root,
      "package.json",
      JSON.stringify({ name: "fixture", dependencies: { "rehype-raw": "^7" } })
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("rehype-raw");
  });

  it("exits 1 when a src file imports rehype-raw", () => {
    write(root, "src/markdown/components.tsx", 'import rehypeRaw from "rehype-raw";\n');

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("rehype");
  });

  it("exits 1 when a src file uses dangerouslySetInnerHTML", () => {
    write(root, "src/render.tsx", "export const x = { dangerouslySetInnerHTML: { __html: y } };\n");

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("dangerouslySetInnerHTML");
  });

  it("exits 1 when a src file re-enables raw HTML with skipHtml={false}", () => {
    write(
      root,
      "src/render.tsx",
      "const node = <ReactMarkdown skipHtml={false}>{x}</ReactMarkdown>;\n"
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("skipHtml");
  });

  it("exits 1 when the default policy flips allowImages to true", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace("allowImages: false", "allowImages: true")
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("allowImages");
  });

  it("exits 1 when the default allowlist admits http", () => {
    write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace('"tel"', '"tel", "http"'));

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(EXACT_SET_MESSAGE);
    expect(result.stderr).toContain('"http"');
  });

  it("exits 1 when the default allowlist drops tel", () => {
    write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace(', "tel"', ""));

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(EXACT_SET_MESSAGE);
  });

  it("exits 1 when the default allowlist joins https and mailto into one literal", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace('"https", "mailto"', '"https,mailto"')
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(`${EXACT_SET_MESSAGE}, found ["https,mailto", "tel"]`);
  });

  it.each(["javascript", "data", "vbscript", "file"])(
    "exits 1 when the default allowlist admits the %s scheme",
    (scheme) => {
      write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace('"tel"', `"tel", "${scheme}"`));

      const result = run(root);

      expect(result).toMatchObject({ status: 1 });
      expect(result.stderr).toContain(EXACT_SET_MESSAGE);
      expect(result.stderr).toContain(`"${scheme}"`);
    }
  );

  it.each([
    ["a bare array", '["https", "mailto", "tel"]'],
    ["a bare array as const", '["https", "mailto", "tel"] as const'],
    ["a frozen array as const", 'Object.freeze(["https", "mailto", "tel"] as const)'],
    ["a reordered array", '["tel", "https", "mailto"]'],
  ])("exits 0 when the default allowlist is %s", (_, value) => {
    write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace(FROZEN_SCHEMES, value));

    expect(run(root)).toMatchObject({ status: 0 });
  });

  it("exits 0 when the default allowlist is the last property without a trailing comma", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      `export const defaultMarkdownPolicy = Object.freeze({
  allowImages: false,
  allowedSchemes: ${FROZEN_SCHEMES}
});
`
    );

    expect(run(root)).toMatchObject({ status: 0 });
  });

  it("exits 1 when the default allowlist is declared twice in the policy object", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace(
        FROZEN_SCHEMES,
        `DEFAULT_SCHEMES,\n  // allowedSchemes: ${FROZEN_SCHEMES}`
      )
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("allowedSchemes must be declared exactly once");
  });

  it.each([
    ["an identifier", "DEFAULT_SCHEMES"],
    ["a spread", "Object.freeze([...DEFAULT_SCHEMES])"],
    ["an array under another key", 'DEFAULT_SCHEMES,\n  extra: ["https"]'],
    ["an array with a call chained after it", 'Object.freeze(["https"]).concat(["javascript"])'],
  ])(
    "exits 1 when the default allowlist is %s instead of an inline array of quoted literals",
    (_, value) => {
      write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace(FROZEN_SCHEMES, value));

      const result = run(root);

      expect(result).toMatchObject({ status: 1 });
      expect(result.stderr).toContain(
        "allowedSchemes must be an inline array of quoted string literals"
      );
    }
  );

  it("exits 1 and reports the literals beside a spread in the default allowlist", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace('["https"', '[...DEFAULT_SCHEMES, "javascript", "https"')
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(
      "allowedSchemes must be an inline array of quoted string literals"
    );
    expect(result.stderr).toContain(
      `${EXACT_SET_MESSAGE}, found ["javascript", "https", "mailto", "tel"]`
    );
  });

  it("exits 1 when the default allowlist hides javascript behind a unicode escape", () => {
    const literal = String.raw`"java\u0073cript"`;

    write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace('"tel"', `"tel", ${literal}`));

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(
      `${EXACT_SET_MESSAGE}, found ["https", "mailto", "tel", ${literal}]`
    );
  });

  it("exits 0 when the default allowlist key is quoted", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace("allowedSchemes:", '"allowedSchemes":')
    );

    expect(run(root)).toMatchObject({ status: 0 });
  });

  it.each([
    ["a quoted key", `"allowedSchemes": ${FROZEN_SCHEMES.replace('"tel"', '"javascript"')}`],
    [
      "a quoted key after a prefixed key",
      `unallowedSchemes: ${FROZEN_SCHEMES},\n  "allowedSchemes": ["javascript"]`,
    ],
  ])("exits 1 when %s admits javascript", (_, property) => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace(`allowedSchemes: ${FROZEN_SCHEMES}`, property)
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(EXACT_SET_MESSAGE);
    expect(result.stderr).toContain('"javascript"');
  });

  it("exits 1 when only a prefixed key declares the default allowlist", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace("allowedSchemes:", "unallowedSchemes:")
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("allowedSchemes must be declared exactly once");
  });

  it("exits 2 when the tree has no urlPolicy.ts", () => {
    rmSync(join(root, "src/markdown/urlPolicy.ts"));

    const result = run(root);

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("urlPolicy.ts");
  });

  it("exits 1 when the default policy spreads another object after the allowlist", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace("allowImages: false,", "allowImages: false,\n  ...OVERRIDES,")
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(SPREAD_MESSAGE);
  });

  it("exits 1 when the default policy spreads another object before the allowlist", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace("allowedSchemes:", "...OVERRIDES,\n  allowedSchemes:")
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(SPREAD_MESSAGE);
  });

  it("exits 1 when a call with an empty object precedes the spread in the default policy", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace(
        'linkTarget: "_blank",\n  allowImages: false,',
        "allowImages: false,\n  linkTarget: resolveTarget({}),\n  ...OVERRIDES,"
      )
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain(SPREAD_MESSAGE);
  });

  it("exits 0 when a comment naming defaultMarkdownPolicy with an ellipsis precedes it", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      `// defaultMarkdownPolicy: https, mailto, tel and nothing else...\n${cleanPolicy}`
    );

    expect(run(root)).toMatchObject({ status: 0 });
  });

  it("exits 0 when the default policy literal is wrapped onto its own indented lines", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      `export const defaultMarkdownPolicy: Readonly<Required<MarkdownPolicyDefaults>> =
  Object.freeze({
    allowedSchemes: ${FROZEN_SCHEMES},
    allowRelativeUrls: false,
    linkTarget: "_blank",
    allowImages: false,
  });
`
    );

    expect(run(root)).toMatchObject({ status: 0 });
  });
});
