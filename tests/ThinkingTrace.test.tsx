import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ThinkingTrace, defaultThinkingTraceLabels } from "../src/index.js";
import type { ThinkingChatEntry } from "../src/index.js";
import { expectThinkingDots } from "./helpers/expect-thinking-dots.js";

// 017's fixture entry (tests/fixtures/hal-session-entries.json § thinking).
const reasoningEntry: ThinkingChatEntry = {
  id: "th1",
  role: "thinking",
  content: "I should look up the weather for Berlin using the get_weather tool.",
  isStreaming: false,
};

const streamingEntry: ThinkingChatEntry = { ...reasoningEntry, isStreaming: true };

const expand = (container: HTMLElement): HTMLDetailsElement => {
  const details = container.querySelector("details");
  if (!details) {
    throw new Error("ThinkingTrace rendered no details element");
  }
  details.open = true;
  return details;
};

describe("ThinkingTrace", () => {
  describe("the collapsed default", () => {
    it("renders a closed details whose summary is exactly the Reasoning label", () => {
      const { container } = render(<ThinkingTrace entry={reasoningEntry} />);

      const details = container.querySelector("details");
      expect(details?.open).toBe(false);
      expect(details?.querySelector("summary")?.textContent).toBe("Reasoning");
    });

    it("keeps every word of the content out of the summary", () => {
      const { container } = render(<ThinkingTrace entry={reasoningEntry} />);

      const summaryText = container.querySelector("summary")?.textContent ?? "";
      for (const word of reasoningEntry.content.split(" ")) {
        expect(summaryText).not.toContain(word);
      }
    });
  });

  describe("the expanded content", () => {
    it("reveals the full content string as whitespace-pre-wrap text", () => {
      const { container } = render(<ThinkingTrace entry={reasoningEntry} />);
      const details = expand(container);

      expect(details.textContent).toContain(reasoningEntry.content);
      expect(container.querySelector(".whitespace-pre-wrap")?.textContent).toBe(
        reasoningEntry.content
      );
    });

    it("renders markdown and HTML payloads as inert literal text", () => {
      const entry: ThinkingChatEntry = {
        id: "th2",
        role: "thinking",
        content: "see [here](javascript:alert(1)) <img src=x onerror=alert(1)>",
        isStreaming: false,
      };
      const { container } = render(<ThinkingTrace entry={entry} />);
      expand(container);

      expect(container.querySelector("a")).toBeNull();
      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toContain("[here](javascript:alert(1))");
      expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
    });
  });

  describe("isStreaming", () => {
    it("true puts the three fading dots inside the summary without opening the section", () => {
      const { container } = render(<ThinkingTrace entry={streamingEntry} />);

      const summary = container.querySelector("summary");
      expect(summary).not.toBeNull();
      expectThinkingDots(summary as HTMLElement);
      expect(container.querySelector("details")?.open).toBe(false);
    });

    it("false renders no dots and leaves the section closed", () => {
      const { container } = render(<ThinkingTrace entry={reasoningEntry} />);

      expect(container.querySelectorAll(".bowman-fade-dot")).toHaveLength(0);
      expect(container.querySelector("details")?.open).toBe(false);
    });
  });

  describe("reducedMotion", () => {
    it("true keeps the three dots but strips the bowman-fade-dot animation class", () => {
      const { container } = render(<ThinkingTrace entry={streamingEntry} reducedMotion />);

      expect(container.querySelectorAll(".bowman-fade-dot")).toHaveLength(0);
      expect(container.querySelectorAll("summary .bg-blue-500")).toHaveLength(3);
    });

    it("false keeps the animation class and the staggered delays", () => {
      const { container } = render(<ThinkingTrace entry={streamingEntry} reducedMotion={false} />);

      expectThinkingDots(container);
    });
  });

  describe("labels and defaults", () => {
    it("resolves an override over the English default", () => {
      render(<ThinkingTrace entry={reasoningEntry} labels={{ thinkingTrace: "Razonamiento" }} />);

      expect(screen.getByText("Razonamiento")).toBeInTheDocument();
      expect(screen.queryByText("Reasoning")).not.toBeInTheDocument();
    });

    it('defaultThinkingTraceLabels is frozen and holds exactly thinkingTrace: "Reasoning"', () => {
      expect(Object.isFrozen(defaultThinkingTraceLabels)).toBe(true);
      expect(defaultThinkingTraceLabels).toEqual({ thinkingTrace: "Reasoning" });
    });
  });

  describe("the data-boundary source (grep acceptance criteria)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ThinkingTrace.tsx"), "utf8");

    it("references no dangerouslySetInnerHTML, react-markdown or remark-", () => {
      expect(source).not.toMatch(/dangerouslySetInnerHTML|react-markdown|remark-/);
    });

    it("imports useReducedMotion instead of reading matchMedia itself", () => {
      expect(source).toMatch(/from "\.\.\/hooks\/useReducedMotion\.js"/);
      expect(source).not.toMatch(/matchMedia/);
    });

    it("declares none of onCopy, onFeedback, showFeedback or assistantAvatar", () => {
      expect(source).not.toMatch(/onCopy|onFeedback|showFeedback|assistantAvatar/);
    });

    it("makes no console call and touches no client storage", () => {
      expect(source).not.toMatch(/console\.|localStorage|sessionStorage|IndexedDB|indexedDB/);
    });

    it("never sets the details element's open attribute", () => {
      expect(source).not.toMatch(/\bopen=|\bopen>/);
    });
  });

  describe("GDPR zero retention", () => {
    it("writes nothing to localStorage when the fixture entry is rendered expanded", () => {
      localStorage.clear();
      const { container } = render(<ThinkingTrace entry={reasoningEntry} />);
      expand(container);

      expect(localStorage.length).toBe(0);
    });
  });

  describe("the published surface", () => {
    it("the barrel exports ThinkingTrace and its labels but never ThinkingDots", () => {
      const barrel = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");

      expect(barrel).toContain("ThinkingTrace");
      expect(barrel).toContain("defaultThinkingTraceLabels");
      expect(barrel).not.toContain("ThinkingDots");
    });
  });
});
