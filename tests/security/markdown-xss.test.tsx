/**
 * Issue 213: the adversarial XSS corpus. Every row runs a known bypass class
 * through the rendered markdown pipeline - either the real ChatMessage
 * component or the exact ReactMarkdown + createMarkdownComponents +
 * createUrlTransform triple ChatMessage wires up - and asserts no live node is
 * created and the payload survives as literal text. The corpus fixes the
 * guarantees 026/076 hardened as standing regressions; scripts/
 * check-markdown-safety.mjs guards the one refactor (rehype-raw, a flipped
 * allowImages, an admitted javascript:/data: scheme) that would void them all.
 */
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChatMessage, createMarkdownComponents, createUrlTransform } from "../../src/index.js";
import type { AssistantChatEntry, ChatMessageLabels, MarkdownPolicy } from "../../src/index.js";

const renderThroughComponents = (content: string, policy?: MarkdownPolicy) =>
  render(
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={createMarkdownComponents({ policy })}
      urlTransform={createUrlTransform(policy)}
    >
      {content}
    </ReactMarkdown>
  );

const renderThroughChatMessage = (
  content: string,
  options: {
    markdown?: MarkdownPolicy;
    labels?: Partial<ChatMessageLabels>;
    isStreaming?: boolean;
  } = {}
) => {
  const entry: AssistantChatEntry = {
    id: "corpus",
    role: "assistant",
    content,
    isStreaming: options.isStreaming ?? false,
  };
  return render(
    <ChatMessage
      entry={entry}
      userInitials="LM"
      markdown={options.markdown}
      labels={options.labels}
    />
  );
};

describe("raw HTML passthrough (no rehype-raw: model-authored HTML is inert text)", () => {
  const rawHtmlRows = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    '<a href="javascript:alert(1)">x</a>',
    "<svg onload=alert(1)>",
  ] as const;

  it.each(rawHtmlRows)(
    "renders %s as text with no script, svg, img or event handler",
    (payload) => {
      const { container } = renderThroughComponents(payload);

      expect(container.querySelector("script,svg,img,[onerror],[onload],[onclick]")).toBeNull();
      expect(container.textContent).toContain(payload);
    }
  );

  it("through the real ChatMessage component the same four payloads create no img or event handler and survive as text", () => {
    for (const payload of rawHtmlRows) {
      const { container } = renderThroughChatMessage(payload);

      expect(container.querySelector("img,[onerror],[onload],[onclick]")).toBeNull();
      expect(container.textContent).toContain(payload);
    }
  });
});

describe("dangerous schemes on a markdown link render a hrefless span", () => {
  const dangerousSchemeRows = [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "java%09script:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,alert(1)",
    "file:///etc/passwd",
  ] as const;

  it.each(dangerousSchemeRows)(
    "[x](%s) renders no anchor and shows the link text",
    (destination) => {
      const { container } = renderThroughComponents(`[x](${destination})`);

      expect(container.querySelector("a")).toBeNull();
      expect(document.querySelectorAll('a[href=""]')).toHaveLength(0);
      expect(screen.getByText("x").tagName).toBe("SPAN");
    }
  );

  it.each(["<\tjavascript:alert(1)>", "<java\nscript:alert(1)>"])(
    "whitespace-obfuscated %s never forms a live link",
    (destination) => {
      const { container } = renderThroughComponents(`[x](${destination})`);

      expect(container.querySelector('a[href*="javascript" i]')).toBeNull();
    }
  );

  it("src/markdown/urlPolicy.ts never percent-decodes before comparing the scheme", () => {
    const source = readFileSync(resolve(process.cwd(), "src/markdown/urlPolicy.ts"), "utf8");

    expect(source).not.toMatch(/decodeURI|decodeURIComponent/);
  });
});

describe("protocol-relative and mixed-slash destinations drop the href", () => {
  it("[x](//evil.com) renders no anchor even with allowRelativeUrls true (protocol-relative)", () => {
    const { container } = renderThroughComponents("[x](//evil.com)", { allowRelativeUrls: true });

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("x").tagName).toBe("SPAN");
  });

  it.each(["//evil.com", "\\\\evil.com", "/\\evil.com", "\\/evil.com"])(
    "[x](%s) renders no anchor under the default policy",
    (destination) => {
      const { container } = renderThroughComponents(`[x](${destination})`);

      expect(container.querySelector("a")).toBeNull();
      expect(screen.getByText("x").tagName).toBe("SPAN");
    }
  );

  it("createUrlTransform drops every protocol-relative slash form even with allowRelativeUrls true", () => {
    const transform = createUrlTransform({ allowRelativeUrls: true });

    expect(["//evil.com", "\\\\evil.com", "/\\evil.com", "\\/evil.com"].map(transform)).toEqual([
      "",
      "",
      "",
      "",
    ]);
  });
});

describe("gfm autolink literals: only mailto survives the default allowlist", () => {
  it("a bare www autolink is http and renders as text", () => {
    const { container } = renderThroughComponents("Visit www.evil.com now");

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("www.evil.com").tagName).toBe("SPAN");
  });

  it("a bare http autolink renders as text", () => {
    const { container } = renderThroughComponents("Visit http://evil.com now");

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("http://evil.com");
  });

  it("a bare email autolinks to a mailto anchor - the only surviving scheme", () => {
    const { container } = renderThroughComponents("Mail attacker@evil.com now");

    expect(container.querySelector("a")).toHaveAttribute("href", "mailto:attacker@evil.com");
  });
});

describe("image vectors: opt-in never bypasses the scheme allowlist", () => {
  it("the default policy renders alt text and no img for an https image", () => {
    const { container } = renderThroughComponents("![payload](https://host/p.png)");

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("payload");
  });

  it("the default policy renders alt text and no img for a data: svg image", () => {
    const { container } = renderThroughComponents(
      "![payload](data:image/svg+xml,%3Csvg%20onload=alert(1)%3E)"
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[onload]")).toBeNull();
    expect(container.textContent).toContain("payload");
  });

  it("allowImages true still drops a data: svg src and renders no img", () => {
    const { container } = renderThroughComponents(
      "![payload](data:image/svg+xml,%3Csvg%20onload=alert(1)%3E)",
      { allowImages: true }
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("payload");
  });

  it("allowImages true renders an img only for the https src", () => {
    const { container } = renderThroughComponents("![payload](https://example.com/a.png)", {
      allowImages: true,
    });

    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/a.png");
  });
});

describe("label injection (022): a labels field set to HTML renders as text", () => {
  const injection = "<img src=x onerror=alert(1)>";

  it("linkOpensInNewTab set to an HTML string renders in the sr-only span as literal text", () => {
    const { container } = renderThroughChatMessage("[x](https://example.com/a)", {
      labels: { linkOpensInNewTab: injection },
    });

    expect(container.querySelector("img,[onerror]")).toBeNull();
    expect(container.querySelector(".bowman-sr-only")?.textContent).toBe(injection);
  });

  it("the thinking label set to an HTML string renders as literal text with no element", () => {
    const { container } = renderThroughChatMessage("", {
      labels: { thinking: injection },
      isStreaming: true,
    });

    expect(container.querySelector("img,[onerror]")).toBeNull();
    expect(container.textContent).toContain(injection);
  });
});
