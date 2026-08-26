import { render } from "@testing-library/react";
import { spawnSync } from "node:child_process";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { createMarkdownComponents, createUrlTransform } from "../src/index.js";

const fixtureMarkdown = `
# Heading one

## Heading two

### Heading three

A paragraph with **bold**, *italic*, \`inline code\` and a [link](https://example.com).

- unordered item

1. ordered item

> a quote

\`\`\`js
const block = true;
\`\`\`

| Column |
| ------ |
| cell   |

---
`;

const coveredTags = [
  "p",
  "a",
  "ul",
  "ol",
  "li",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "table",
  "thead",
  "th",
  "td",
  "hr",
  "strong",
  "em",
] as const;

it("covers exactly the eighteen tags 019 named plus 076's img gate", () => {
  expect(Object.keys(createMarkdownComponents()).sort()).toEqual([...coveredTags, "img"].sort());
});

describe("rendering the fixture through react-markdown with remark-gfm", () => {
  let container: HTMLElement;

  beforeEach(() => {
    ({ container } = render(
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={createMarkdownComponents()}
        urlTransform={createUrlTransform()}
      >
        {fixtureMarkdown}
      </ReactMarkdown>
    ));
  });

  it.each([...coveredTags])("renders <%s> carrying the class bowman-md-%s", (tag) => {
    const element = container.querySelector(tag);
    expect(element?.classList.contains(`bowman-md-${tag}`)).toBe(true);
  });

  it("merges react-markdown's own className into the fenced code block", () => {
    expect(container.querySelector("pre > code")?.className).toBe("bowman-md-code language-js");
  });

  it("keeps the inline code class bare", () => {
    expect(container.querySelector("p > code")?.className).toBe("bowman-md-code");
  });

  it("leaks no node prop onto the DOM", () => {
    expect(container.querySelector("[node]")).toBeNull();
  });
});

it("tsc accepts markdown-type-assertions.ts, proving the map is assignable to react-markdown's Components", () => {
  const result = spawnSync(
    "node",
    [
      "node_modules/typescript7/bin/tsc",
      "--ignoreConfig",
      "--noEmit",
      "--strict",
      "--target",
      "es2022",
      "--module",
      "nodenext",
      "--moduleResolution",
      "nodenext",
      "--jsx",
      "react-jsx",
      "--skipLibCheck",
      "tests/types/markdown-type-assertions.ts",
    ],
    { cwd: process.cwd(), encoding: "utf8" }
  );
  expect(result).toMatchObject({ status: 0, stderr: "" });
});
