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

  it.each(["javascript", "data", "vbscript", "file"])(
    "exits 1 when the default allowlist admits the %s scheme",
    (scheme) => {
      write(root, "src/markdown/urlPolicy.ts", cleanPolicy.replace('"tel"', `"tel", "${scheme}"`));

      const result = run(root);

      expect(result).toMatchObject({ status: 1 });
      expect(result.stderr).toContain(scheme);
    }
  );

  it.each([
    ["a bare array", '["https", "mailto", "tel"]'],
    ["a bare array as const", '["https", "mailto", "tel"] as const'],
    ["a frozen array as const", 'Object.freeze(["https", "mailto", "tel"] as const)'],
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

  it("exits 1 and reports a banned literal beside a spread in the default allowlist", () => {
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
    expect(result.stderr).toContain('admits the dangerous scheme "javascript"');
  });

  it("exits 2 when the tree has no urlPolicy.ts", () => {
    rmSync(join(root, "src/markdown/urlPolicy.ts"));

    const result = run(root);

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("urlPolicy.ts");
  });
});
