import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createMarkdownComponents,
  createUrlTransform,
  defaultMarkdownPolicy,
  type MarkdownPolicy,
} from "../../src/index.js";
import {
  defaultMarkdownComponentsLabels,
  type MarkdownComponentsLabels,
} from "../../src/markdown/components.js";

const renderMarkdown = (
  content: string,
  policy?: MarkdownPolicy,
  labels?: Partial<MarkdownComponentsLabels>
) =>
  render(
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={createMarkdownComponents({ policy, labels })}
      urlTransform={createUrlTransform(policy)}
    >
      {content}
    </ReactMarkdown>
  );

it("defaultMarkdownPolicy is the https/mailto/tel, no-relative, new-tab, no-image policy", () => {
  expect(defaultMarkdownPolicy).toEqual({
    allowedSchemes: ["https", "mailto", "tel"],
    allowRelativeUrls: false,
    linkTarget: "_blank",
    allowImages: false,
  });
});

describe("the scheme allowlist", () => {
  it.each([
    "https://tms.example/booking/42",
    "mailto:support@marginalia-books.invalid",
    "tel:+4570123456",
  ])("renders an anchor with the exact href %s", (destination) => {
    const { container } = renderMarkdown(`[4711](${destination})`);

    expect(container.querySelector("a")).toHaveAttribute("href", destination);
  });

  it.each([
    "http://tms.example/x",
    "irc://x/y",
    "xmpp:a@b",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox",
    "/api/logout",
    "../admin",
    "#anchor",
  ])("renders no anchor for %s and shows the link text in a <span>", (destination) => {
    const { container } = renderMarkdown(`[4711](${destination})`);

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("4711").tagName).toBe("SPAN");
    expect(document.querySelectorAll('a[href=""]')).toHaveLength(0);
  });

  it.each(["JAVASCRIPT:alert(1)", "JaVaScRiPt:alert(1)", "java&#x09;script:alert(1)"])(
    "case and entity encoding do not get %s past the allowlist",
    (destination) => {
      const { container } = renderMarkdown(`[4711](${destination})`);

      expect(container.querySelector("a")).toBeNull();
      expect(screen.getByText("4711").tagName).toBe("SPAN");
      expect(document.querySelectorAll('a[href=""]')).toHaveLength(0);
    }
  );

  it('allowedSchemes ["https", "http"] renders an anchor for http://tms.example/x', () => {
    const { container } = renderMarkdown("[4711](http://tms.example/x)", {
      allowedSchemes: ["https", "http"],
    });

    expect(container.querySelector("a")).toHaveAttribute("href", "http://tms.example/x");
  });

  it("allowedSchemes [] renders even an https destination as text", () => {
    const { container } = renderMarkdown("[4711](https://tms.example/x)", { allowedSchemes: [] });

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("4711").tagName).toBe("SPAN");
  });
});

describe("relative URLs", () => {
  it('allowRelativeUrls: true renders <a href="/booking/42">', () => {
    const { container } = renderMarkdown("[4711](/booking/42)", { allowRelativeUrls: true });

    expect(container.querySelector("a")).toHaveAttribute("href", "/booking/42");
  });

  it("the default policy renders /booking/42 as text", () => {
    const { container } = renderMarkdown("[4711](/booking/42)");

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("4711").tagName).toBe("SPAN");
  });

  it.each(["//evil.example/x", "\\\\evil.example\\x", "/\\evil.example"])(
    "createUrlTransform rejects the protocol-relative %s even with allowRelativeUrls: true",
    (value) => {
      expect(createUrlTransform({ allowRelativeUrls: true })(value)).toBe("");
    }
  );
});

describe("anchor attributes", () => {
  it('every rendered anchor carries rel="noopener noreferrer" and target="_blank"', () => {
    const { container } = renderMarkdown(
      "[a](https://tms.example/x) [b](mailto:support@marginalia-books.invalid) [c](tel:+4570123456)"
    );

    const anchors = container.querySelectorAll("a");

    expect(anchors).toHaveLength(3);

    for (const anchor of anchors) {
      expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
      expect(anchor).toHaveAttribute("target", "_blank");
    }
  });

  it('linkTarget: "_self" drops the target attribute and still carries rel="noopener noreferrer"', () => {
    const { container } = renderMarkdown("[4711](https://tms.example/x)", {
      linkTarget: "_self",
    });

    const anchor = container.querySelector("a");

    expect(anchor).not.toHaveAttribute("target");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
  });

  it('the anchor contains a visually-hidden "(opens in a new tab)" notice', () => {
    const { container } = renderMarkdown("[4711](https://tms.example/x)");

    const notice = container.querySelector("a .bowman-sr-only");

    expect(notice?.textContent).toBe("(opens in a new tab)");
    expect(defaultMarkdownComponentsLabels).toEqual({
      linkOpensInNewTab: "(opens in a new tab)",
    });
  });

  it("a labels override replaces the notice text", () => {
    const { container } = renderMarkdown("[4711](https://tms.example/x)", undefined, {
      linkOpensInNewTab: "⟦notice⟧",
    });

    expect(container.querySelector("a .bowman-sr-only")?.textContent).toBe("⟦notice⟧");
  });

  it('linkTarget: "_self" renders no notice element', () => {
    const { container } = renderMarkdown("[4711](https://tms.example/x)", {
      linkTarget: "_self",
    });

    expect(container.querySelector(".bowman-sr-only")).toBeNull();
  });

  it("merges an incoming className on the anchor and the image", () => {
    const components = createMarkdownComponents({ policy: { allowImages: true } });
    const Anchor = components.a;
    const Image = components.img;
    const { container } = render(
      <>
        <Anchor href="https://tms.example/x" className="extra-a">
          4711
        </Anchor>
        <Image src="https://tms.example/p.png" alt="4711" className="extra-img" />
      </>
    );

    expect(container.querySelector("a")?.className).toBe("bowman-md-a extra-a");
    expect(container.querySelector("img")?.className).toBe("bowman-md-img extra-img");
  });
});

describe("remark-gfm autolink literals", () => {
  it("a bare https URL autolinks with the rel pair and the notice", () => {
    const { container } = renderMarkdown("Mira https://tms.example/x hoy");

    const anchor = container.querySelector("a");

    expect(anchor).toHaveAttribute("href", "https://tms.example/x");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    expect(anchor?.querySelector(".bowman-sr-only")?.textContent).toBe("(opens in a new tab)");
  });

  it("a bare email autolinks to a mailto anchor", () => {
    const { container } = renderMarkdown("Write to support@marginalia-books.invalid");

    expect(container.querySelector("a")).toHaveAttribute(
      "href",
      "mailto:support@marginalia-books.invalid"
    );
  });

  it("a bare www autolink is an http URL, so the default policy renders it as text", () => {
    const { container } = renderMarkdown("See www.marginalia-books.invalid");

    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("www.marginalia-books.invalid").tagName).toBe("SPAN");
  });

  it('a bare www autolink renders an anchor with the rel pair and the notice under allowedSchemes ["https", "http"]', () => {
    const { container } = renderMarkdown("See www.marginalia-books.invalid", {
      allowedSchemes: ["https", "http"],
    });

    const anchor = container.querySelector("a");

    expect(anchor).toHaveAttribute("href", "http://www.marginalia-books.invalid");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    expect(anchor?.querySelector(".bowman-sr-only")?.textContent).toBe("(opens in a new tab)");
  });
});

describe("the image gate", () => {
  it("an https image renders no img element and renders the alt text", () => {
    const { container } = renderMarkdown("![alt text](https://host/p.png)");

    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.textContent).toContain("alt text");
  });

  it("allowImages: true renders one img with that src", () => {
    const { container } = renderMarkdown("![alt text](https://host/p.png)", {
      allowImages: true,
    });

    const images = container.querySelectorAll("img");

    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("src", "https://host/p.png");
    expect(images[0]).toHaveAttribute("alt", "alt text");
  });

  it("allowImages: true still renders no img for a javascript: src", () => {
    const { container } = renderMarkdown("![alt text](javascript:alert(1))", {
      allowImages: true,
    });

    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.textContent).toContain("alt text");
  });
});

describe("GDPR: no network request from model-authored content", () => {
  it("the default policy renders zero img, zero preload links and zero src attributes for a fixture with an image, an autolink and a markdown link", () => {
    const fixture =
      "![alt](https://host/p.png)\n\nMira https://tms.example/x y [4711](https://tms.example/y)";
    const { container } = renderMarkdown(fixture);

    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("[src]")).toHaveLength(0);
    expect(document.querySelectorAll('link[rel="preload"]')).toHaveLength(0);
  });
});

describe("the markdown sources (grep acceptance criteria)", () => {
  const sources = ["src/markdown/urlPolicy.ts", "src/markdown/components.tsx"].map((path) => ({
    path,
    content: readFileSync(resolve(process.cwd(), path), "utf8"),
  }));

  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const fullPath = join(dir, entry);

      return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
    });

  it("no file under src/ mentions rehype or defaultUrlTransform", () => {
    for (const file of walk(resolve(process.cwd(), "src"))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/rehype|defaultUrlTransform/i);
    }
  });

  it("GDPR: neither markdown file calls console.*, localStorage, sessionStorage, fetch or sendBeacon", () => {
    for (const { content } of sources) {
      expect(content).not.toMatch(/console\.|localStorage|sessionStorage|fetch|sendBeacon/);
    }
  });
});

describe("review hardening (076 diff review)", () => {
  it("a gfm footnote reference keeps its id and aria attributes on the policy's span", () => {
    const { container } = renderMarkdown("Mira la nota[^1]\n\n[^1]: una nota");

    expect(container.querySelector("a")).toBeNull();
    const reference = container.querySelector("sup > span");

    expect(reference).toHaveAttribute("id", "user-content-fnref-1");
    expect(reference).toHaveAttribute("aria-describedby", "footnote-label");
    const backref = container.querySelector('span[aria-label="Back to reference 1"]');

    expect(backref?.textContent).toBe("↩");
  });

  it("defaultMarkdownPolicy, its allowedSchemes array and defaultMarkdownComponentsLabels are frozen", () => {
    expect(Object.isFrozen(defaultMarkdownPolicy)).toBe(true);
    expect(Object.isFrozen(defaultMarkdownPolicy.allowedSchemes)).toBe(true);
    expect(Object.isFrozen(defaultMarkdownComponentsLabels)).toBe(true);
  });

  it("styles.css ships the bowman-sr-only and bowman-md-img rules", () => {
    const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

    expect(styles).toMatch(/\.bowman-sr-only \{/);
    expect(styles).toMatch(/\.bowman-md-img \{/);
  });
});

describe("an authority-less special scheme is not a way around allowRelativeUrls", () => {
  it.each([
    "https:/api/logout",
    "https:api/logout",
    "https:/../admin",
    "https:#anchor",
    "https:?x=1",
    "HTTPS:/api/logout",
  ])(
    "renders no anchor for %s, which a browser resolves against the reader's own origin",
    (destination) => {
      const { container } = renderMarkdown(`[4711](<${destination}>)`);

      expect(container.querySelector("a")).toBeNull();
      expect(screen.getByText("4711").tagName).toBe("SPAN");
    }
  );

  it("the rejection survives allowRelativeUrls: true and an http opt-in", () => {
    const transform = createUrlTransform({
      allowedSchemes: ["https", "http"],
      allowRelativeUrls: true,
    });

    expect([transform("https:/api/logout"), transform("http:api/x")]).toEqual(["", ""]);
  });

  it("mailto and tel keep their authority-less form", () => {
    const transform = createUrlTransform();

    expect([
      transform("mailto:support@marginalia-books.invalid"),
      transform("tel:+4570123456"),
    ]).toEqual(["mailto:support@marginalia-books.invalid", "tel:+4570123456"]);
  });
});
