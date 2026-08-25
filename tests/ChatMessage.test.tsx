/**
 * The 015 characterization suite for ChatMessage, ported against the
 * extracted component (issue 023). Labels are substituted for the source
 * app's hardcoded English, `message: Message` becomes `entry` typed by 017,
 * and the five documented adaptations plus three dropped judge/dev-info
 * tests are tabled in specs/bowman-ui-chat-message/spec.md.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ChatMessage } from "../src/index.js";
import type { AssistantChatEntry, UserChatEntry } from "../src/index.js";

const writeTextMock = vi.fn();

const makeEntry = (overrides?: Partial<AssistantChatEntry>): AssistantChatEntry => ({
  id: "entry-1",
  role: "assistant",
  content: "Booking 4711 er bekræftet",
  isStreaming: false,
  ...overrides,
});

const makeUserEntry = (overrides?: Partial<UserChatEntry>): UserChatEntry => ({
  id: "entry-1",
  role: "user",
  content: "Vis booking 4711",
  ...overrides,
});

describe("ChatMessage", () => {
  beforeEach(() => {
    writeTextMock.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });
    vi.spyOn(window, "getSelection").mockReturnValue({
      toString: () => "",
    } as unknown as Selection);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("aria-labels (resolved label defaults)", () => {
    it('a user entry renders its content, the userInitials, and an article labelled exactly "Your message"', () => {
      render(<ChatMessage entry={makeUserEntry()} userInitials="LM" />);

      const article = screen.getByRole("article");
      expect(article).toHaveAttribute("aria-label", "Your message");
      expect(screen.getByText("Vis booking 4711")).toBeInTheDocument();
      expect(screen.getByText("LM")).toBeInTheDocument();
    });

    it('an assistant entry\'s article aria-label is exactly "Assistant response" with no labels prop', () => {
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      expect(screen.getByRole("article")).toHaveAttribute("aria-label", "Assistant response");
    });

    it('button aria-labels are "Copy message", "Good response" and "Bad response" without shortcut parentheticals', () => {
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Good response" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bad response" })).toBeInTheDocument();
    });

    it('after clicking copy, the button aria-label is "Copied"', () => {
      vi.useFakeTimers();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      fireEvent.click(screen.getByRole("button", { name: "Copy message" }));

      expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    });
  });

  describe("markdown rendering", () => {
    it("**bekræftet** renders a <strong> element carrying the bowman-md-strong class", () => {
      render(
        <ChatMessage
          entry={makeEntry({ content: "Booking 4711 er **bekræftet**" })}
          userInitials="LM"
        />
      );

      const strong = screen.getByText("bekræftet");
      expect(strong.tagName).toBe("STRONG");
      expect(strong.classList.contains("bowman-md-strong")).toBe(true);
    });

    it("a GFM pipe table renders a <table> element carrying the bowman-md-table class", () => {
      const { container } = render(
        <ChatMessage
          entry={makeEntry({ content: "| Konto | Beløb |\n| --- | --- |\n| 4711 | 100 |" })}
          userInitials="LM"
        />
      );

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
      expect(table?.classList.contains("bowman-md-table")).toBe(true);
      expect(screen.getByText("Konto")).toBeInTheDocument();
    });

    it("raw HTML in content renders as escaped text, not as an element (C-18)", () => {
      const { container } = render(
        <ChatMessage
          entry={makeEntry({ content: 'Se <img src="x" onerror="alert(1)"> her' })}
          userInitials="LM"
        />
      );

      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(container.textContent).toContain('<img src="x" onerror="alert(1)">');
    });
  });

  describe("keyboard copy", () => {
    it('Cmd+C copies the entry content, shows "Copied!", and hides it 2000ms later', () => {
      vi.useFakeTimers();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      fireEvent.keyDown(screen.getByRole("article"), { key: "c", metaKey: true });

      expect(writeTextMock).toHaveBeenCalledWith("Booking 4711 er bekræftet");
      expect(screen.getByText("Copied!")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
    });

    it("Ctrl+C also copies the entry content", () => {
      vi.useFakeTimers();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      fireEvent.keyDown(screen.getByRole("article"), { key: "c", ctrlKey: true });

      expect(writeTextMock).toHaveBeenCalledWith("Booking 4711 er bekræftet");
    });

    it("a non-empty window.getSelection suppresses the Cmd+C copy", () => {
      vi.useFakeTimers();
      vi.spyOn(window, "getSelection").mockReturnValue({
        toString: () => "Booking 4711",
      } as unknown as Selection);
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      fireEvent.keyDown(screen.getByRole("article"), { key: "c", metaKey: true });

      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it("Cmd+C with navigator.clipboard undefined does not throw and still calls onCopy", () => {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
      const onCopy = vi.fn();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" onCopy={onCopy} />);

      expect(() => {
        fireEvent.keyDown(screen.getByRole("article"), { key: "c", metaKey: true });
      }).not.toThrow();
      expect(onCopy).toHaveBeenCalledWith("Booking 4711 er bekræftet", "entry-1");
    });
  });

  describe("inside a consumer form", () => {
    it("copy and both thumbs act without submitting the surrounding form", () => {
      const onSubmit = vi.fn((event: React.FormEvent) => {
        event.preventDefault();
      });
      const onCopy = vi.fn();
      const onFeedback = vi.fn();
      render(
        <form onSubmit={onSubmit}>
          <ChatMessage
            entry={makeEntry()}
            userInitials="LM"
            onCopy={onCopy}
            onFeedback={onFeedback}
          />
        </form>
      );

      fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
      fireEvent.click(screen.getByRole("button", { name: "Good response" }));
      fireEvent.click(screen.getByRole("button", { name: "Bad response" }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(onFeedback).toHaveBeenCalledTimes(2);
    });
  });

  describe("keyboard feedback", () => {
    it("ArrowUp with default props calls onFeedback zero times and does not preventDefault (adaptation b)", () => {
      const onFeedback = vi.fn();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" onFeedback={onFeedback} />);

      const notPrevented = fireEvent.keyDown(screen.getByRole("article"), { key: "ArrowUp" });

      expect(onFeedback).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it('with arrowKeyFeedback, ArrowUp calls onFeedback("entry-1", "up"), renders "Thanks!", and sets aria-pressed true on thumbs-up, false on thumbs-down (adaptation a)', () => {
      const onFeedback = vi.fn();
      render(
        <ChatMessage
          entry={makeEntry()}
          userInitials="LM"
          arrowKeyFeedback
          onFeedback={onFeedback}
        />
      );

      fireEvent.keyDown(screen.getByRole("article"), { key: "ArrowUp" });

      expect(onFeedback).toHaveBeenCalledWith("entry-1", "up");
      expect(screen.getByText("Thanks!")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Good response" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "Bad response" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it('with arrowKeyFeedback, ArrowDown calls onFeedback("entry-1", "down") and sets aria-pressed true on thumbs-down, false on thumbs-up (adaptation a)', () => {
      const onFeedback = vi.fn();
      render(
        <ChatMessage
          entry={makeEntry()}
          userInitials="LM"
          arrowKeyFeedback
          onFeedback={onFeedback}
        />
      );

      fireEvent.keyDown(screen.getByRole("article"), { key: "ArrowDown" });

      expect(onFeedback).toHaveBeenCalledWith("entry-1", "down");
      expect(screen.getByText("Thanks!")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bad response" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "Good response" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("with arrowKeyFeedback and showFeedback={false}, ArrowUp calls onFeedback zero times and neither thumb button is in the document (adaptation c)", () => {
      const onFeedback = vi.fn();
      render(
        <ChatMessage
          entry={makeEntry()}
          userInitials="LM"
          arrowKeyFeedback
          showFeedback={false}
          onFeedback={onFeedback}
        />
      );

      fireEvent.keyDown(screen.getByRole("article"), { key: "ArrowUp" });

      expect(onFeedback).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Good response" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Bad response" })).not.toBeInTheDocument();
    });

    it("no key handling fires for a user entry", () => {
      const onFeedback = vi.fn();
      render(
        <ChatMessage
          entry={makeUserEntry()}
          userInitials="LM"
          arrowKeyFeedback
          onFeedback={onFeedback}
        />
      );

      const article = screen.getByRole("article");
      fireEvent.keyDown(article, { key: "c", metaKey: true });
      fireEvent.keyDown(article, { key: "ArrowUp" });
      fireEvent.keyDown(article, { key: "ArrowDown" });

      expect(writeTextMock).not.toHaveBeenCalled();
      expect(onFeedback).not.toHaveBeenCalled();
    });

    it("no key handling fires while isStreaming is true, even with arrowKeyFeedback (adaptation e)", () => {
      const onFeedback = vi.fn();
      render(
        <ChatMessage
          entry={makeEntry({ isStreaming: true })}
          userInitials="LM"
          arrowKeyFeedback
          onFeedback={onFeedback}
        />
      );

      const article = screen.getByRole("article");
      fireEvent.keyDown(article, { key: "c", metaKey: true });
      fireEvent.keyDown(article, { key: "ArrowUp" });

      expect(writeTextMock).not.toHaveBeenCalled();
      expect(onFeedback).not.toHaveBeenCalled();
    });
  });

  describe("streaming", () => {
    it("while isStreaming is true, no copy or feedback button is in the document", () => {
      render(<ChatMessage entry={makeEntry({ isStreaming: true })} userInitials="LM" />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it('toolStatus "Henter booking" renders that text next to the animate-spin row', () => {
      render(
        <ChatMessage
          entry={makeEntry({ isStreaming: true, toolStatus: "Henter booking" })}
          userInitials="LM"
        />
      );

      const status = screen.getByText("Henter booking");
      expect(status.previousElementSibling?.classList.contains("animate-spin")).toBe(true);
    });

    it("streaming with empty content shows the inline thinking indicator; content removes it; emptying content again does not bring it back", () => {
      const { rerender } = render(
        <ChatMessage entry={makeEntry({ content: "", isStreaming: true })} userInitials="LM" />
      );
      expect(screen.getByText("Thinking")).toBeInTheDocument();

      rerender(
        <ChatMessage
          entry={makeEntry({ content: "Booking 4711", isStreaming: true })}
          userInitials="LM"
        />
      );
      expect(screen.queryByText("Thinking")).not.toBeInTheDocument();

      rerender(
        <ChatMessage entry={makeEntry({ content: "", isStreaming: true })} userInitials="LM" />
      );
      expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
    });

    it("rerendering the same instance with a different entry id, streaming and empty, shows the indicator again (adaptation d)", () => {
      const { rerender } = render(
        <ChatMessage
          entry={makeEntry({ id: "entry-1", content: "", isStreaming: true })}
          userInitials="LM"
        />
      );
      expect(screen.getByText("Thinking")).toBeInTheDocument();

      rerender(
        <ChatMessage
          entry={makeEntry({ id: "entry-1", content: "Booking 4711", isStreaming: true })}
          userInitials="LM"
        />
      );
      expect(screen.queryByText("Thinking")).not.toBeInTheDocument();

      rerender(
        <ChatMessage
          entry={makeEntry({ id: "entry-2", content: "", isStreaming: true })}
          userInitials="LM"
        />
      );
      expect(screen.getByText("Thinking")).toBeInTheDocument();
    });
  });

  describe("showFeedback", () => {
    it('clicking thumbs-up calls onFeedback("entry-1", "up") and clicking thumbs-down overrides it with "down"', () => {
      const onFeedback = vi.fn();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" onFeedback={onFeedback} />);

      fireEvent.click(screen.getByRole("button", { name: "Good response" }));
      expect(onFeedback).toHaveBeenCalledWith("entry-1", "up");
      expect(screen.getByRole("button", { name: "Good response" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      fireEvent.click(screen.getByRole("button", { name: "Bad response" }));
      expect(onFeedback).toHaveBeenCalledWith("entry-1", "down");
      expect(screen.getByRole("button", { name: "Bad response" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "Good response" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("showFeedback={false} removes both thumb buttons while leaving copy in place", () => {
      render(<ChatMessage entry={makeEntry()} userInitials="LM" showFeedback={false} />);

      expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Good response" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Bad response" })).not.toBeInTheDocument();
    });
  });

  describe("avatar slot", () => {
    const circleOf = (container: HTMLElement): Element => {
      const circle = container.querySelector("article > div > div");
      if (!circle) {
        throw new Error("avatar circle not found");
      }
      return circle;
    };

    it("assistantAvatar renders inside the circle", () => {
      const { container } = render(
        <ChatMessage
          entry={makeEntry()}
          userInitials="LM"
          assistantAvatar={<span data-testid="avatar-mark" />}
        />
      );

      expect(circleOf(container)).toContainElement(screen.getByTestId("avatar-mark"));
    });

    it("with no assistantAvatar the circle renders empty and no bundled mark appears", () => {
      const { container } = render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      const circle = circleOf(container);
      expect(circle).toBeEmptyDOMElement();
      expect(container.querySelector("svg:not(button svg)")).not.toBeInTheDocument();
    });

    it("while isStreaming the circle carries bowman-pulse-subtle; not streaming it does not", () => {
      const { container, rerender } = render(
        <ChatMessage entry={makeEntry({ isStreaming: true, content: "" })} userInitials="LM" />
      );
      expect(circleOf(container).classList.contains("bowman-pulse-subtle")).toBe(true);

      rerender(<ChatMessage entry={makeEntry()} userInitials="LM" />);
      expect(circleOf(container).classList.contains("bowman-pulse-subtle")).toBe(false);
    });
  });

  describe("footer slot", () => {
    const columnOf = (container: HTMLElement): Element => {
      const column = container.querySelector("article > div > div:nth-child(2)");
      if (!column) {
        throw new Error("message column not found");
      }
      return column;
    };

    it("footer renders as the last child of the message column, after the action row, when not streaming", () => {
      const { container } = render(
        <ChatMessage entry={makeEntry()} userInitials="LM" footer={<div data-testid="footer" />} />
      );

      const column = columnOf(container);
      expect(column.lastElementChild).toBe(screen.getByTestId("footer"));
      expect(column.children.length).toBe(3);
    });

    it("footer renders as the last child of the message column while streaming", () => {
      const { container } = render(
        <ChatMessage
          entry={makeEntry({ isStreaming: true })}
          userInitials="LM"
          footer={<div data-testid="footer" />}
        />
      );

      expect(columnOf(container).lastElementChild).toBe(screen.getByTestId("footer"));
    });

    it("with no footer, nothing renders after the action row", () => {
      const { container } = render(<ChatMessage entry={makeEntry()} userInitials="LM" />);

      const column = columnOf(container);
      expect(column.children.length).toBe(2);
      expect(column.lastElementChild?.querySelector("button")).toBeInTheDocument();
    });
  });

  describe("confirmation spans", () => {
    it("the copy and feedback confirmation spans carry the bowman-fade-in class", () => {
      vi.useFakeTimers();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" arrowKeyFeedback />);

      fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
      fireEvent.keyDown(screen.getByRole("article"), { key: "ArrowUp" });

      expect(screen.getByText("Copied!").classList.contains("bowman-fade-in")).toBe(true);
      expect(screen.getByText("Thanks!").classList.contains("bowman-fade-in")).toBe(true);
    });
  });

  describe("copy timer robustness (review fixes)", () => {
    it("a rapid second copy keeps the notice for a full 2000ms from the second press", () => {
      vi.useFakeTimers();
      render(<ChatMessage entry={makeEntry()} userInitials="LM" />);
      const article = screen.getByRole("article");

      fireEvent.keyDown(article, { key: "c", metaKey: true });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      fireEvent.keyDown(article, { key: "c", metaKey: true });
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(screen.getByText("Copied!")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it("a rejecting clipboard write is swallowed and onCopy still fires", async () => {
      const onCopy = vi.fn();
      writeTextMock.mockRejectedValueOnce(new Error("NotAllowedError"));
      render(<ChatMessage entry={makeEntry()} userInitials="LM" onCopy={onCopy} />);

      fireEvent.keyDown(screen.getByRole("article"), { key: "c", metaKey: true });
      await act(async () => {});

      expect(onCopy).toHaveBeenCalledTimes(1);
    });
  });

  describe("the extracted sources (grep acceptance criteria)", () => {
    const componentPaths = [
      "src/components/ChatMessage.tsx",
      "src/components/InlineThinkingIndicator.tsx",
    ];
    const sources = componentPaths.map((path) => ({
      path,
      content: readFileSync(resolve(process.cwd(), path), "utf8"),
    }));

    const walk = (dir: string): string[] => {
      const files: string[] = [];
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
          files.push(...walk(fullPath));
          continue;
        }
        files.push(fullPath);
      }
      return files;
    };

    it("ChatMessage.tsx carries no showDevInfo, conversationId, onRetryJudge or scores", () => {
      expect(sources[0].content).not.toMatch(/showDevInfo|conversationId|onRetryJudge|scores/);
    });

    it("neither file imports @clerk, swr, next-intl, next/, @discovery or @/ and every relative import ends in .js", () => {
      for (const { content } of sources) {
        expect(content).not.toMatch(/@clerk|swr|next-intl|next\/|@discovery|@\//);
        const relativeImports = [...content.matchAll(/from\s+"(\.[^"]+)"/g)].map(
          ([, spec]) => spec
        );
        expect(relativeImports.length).toBeGreaterThan(0);
        for (const spec of relativeImports) {
          expect(spec).toMatch(/\.js$/);
        }
      }
    });

    it("neither file mentions rehype and no rehypePlugins prop is passed", () => {
      for (const { content } of sources) {
        expect(content).not.toMatch(/rehype/i);
      }
    });

    it("GDPR: neither file calls console.*, localStorage, sessionStorage, fetch or sendBeacon", () => {
      for (const { content } of sources) {
        expect(content).not.toMatch(/console\.|localStorage|sessionStorage|fetch|sendBeacon/);
      }
    });

    it('no file under src/ contains "prose" or "translateX", and "Discovery" appears nowhere in src/ or dist/', () => {
      for (const file of walk(resolve(process.cwd(), "src"))) {
        const content = readFileSync(file, "utf8");
        expect(content).not.toMatch(/\bprose\b/);
        expect(content).not.toMatch(/translateX/);
        expect(content).not.toMatch(/Discovery/);
      }
      for (const file of walk(resolve(process.cwd(), "dist")).filter(
        (file) => file.endsWith(".js") || file.endsWith(".d.ts") || file.endsWith(".css")
      )) {
        expect(readFileSync(file, "utf8")).not.toMatch(/Discovery/);
      }
    });
  });
});
