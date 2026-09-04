import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const script = join(process.cwd(), "scripts", "check-markdown-safety.mjs");

type RunResult = { status: number | null; stdout: string; stderr: string };

const run = (root: string): RunResult => {
  const result = spawnSync(process.execPath, [script, root], {
    encoding: "utf8",
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

const write = (root: string, path: string, content: string) => {
  mkdirSync(join(root, dirname(path)), { recursive: true });
  writeFileSync(join(root, path), content);
};

const cleanPolicy = `export const defaultMarkdownPolicy = Object.freeze({
  allowedSchemes: Object.freeze(["https", "mailto", "tel"]),
  allowRelativeUrls: false,
  linkTarget: "_blank",
  allowImages: false,
});
`;

const makeTree = (): string => {
  const root = mkdtempSync(join(tmpdir(), "check-markdown-safety-"));

  write(
    root,
    "package.json",
    JSON.stringify({ name: "fixture", dependencies: {} }),
  );
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
      JSON.stringify({ name: "fixture", dependencies: { "rehype-raw": "^7" } }),
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("rehype-raw");
  });

  it("exits 1 when a src file imports rehype-raw", () => {
    write(
      root,
      "src/markdown/components.tsx",
      'import rehypeRaw from "rehype-raw";\n',
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("rehype");
  });

  it("exits 1 when a src file uses dangerouslySetInnerHTML", () => {
    write(
      root,
      "src/render.tsx",
      "export const x = { dangerouslySetInnerHTML: { __html: y } };\n",
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("dangerouslySetInnerHTML");
  });

  it("exits 1 when a src file re-enables raw HTML with skipHtml={false}", () => {
    write(
      root,
      "src/render.tsx",
      "const node = <ReactMarkdown skipHtml={false}>{x}</ReactMarkdown>;\n",
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("skipHtml");
  });

  it("exits 1 when the default policy flips allowImages to true", () => {
    write(
      root,
      "src/markdown/urlPolicy.ts",
      cleanPolicy.replace("allowImages: false", "allowImages: true"),
    );

    const result = run(root);

    expect(result).toMatchObject({ status: 1 });
    expect(result.stderr).toContain("allowImages");
  });

  it.each(["javascript", "data", "vbscript", "file"])(
    "exits 1 when the default allowlist admits the %s scheme",
    (scheme) => {
      write(
        root,
        "src/markdown/urlPolicy.ts",
        cleanPolicy.replace('"tel"', `"tel", "${scheme}"`),
      );

      const result = run(root);

      expect(result).toMatchObject({ status: 1 });
      expect(result.stderr).toContain(scheme);
    },
  );

  it("exits 2 when the tree has no urlPolicy.ts", () => {
    rmSync(join(root, "src/markdown/urlPolicy.ts"));

    const result = run(root);

    expect(result).toMatchObject({ status: 2 });
    expect(result.stderr).toContain("urlPolicy.ts");
  });
});
