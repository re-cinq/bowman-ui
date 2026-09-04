/**
 * The ConversationList characterization suite. Its deliberate design
 * choices (aria-current instead of a bg-class-only active row,
 * isPlaceholderTitle instead of title-literal sniffing) are tabled in
 * specs/bowman-ui-conversation-list/spec.md along with every behaviour
 * delegated to the consumer.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConversationList } from "../src/index.js";
import type { ConversationListItem } from "../src/index.js";

const makeItem = (
  overrides?: Partial<ConversationListItem>,
): ConversationListItem => ({
  id: "conv-1",
  title: "Booking 4711",
  ...overrides,
});

/** TypewriterTitle splits titles into per-character spans, so plain getByText fails. */
const titleContainer = () =>
  document.querySelector("span.whitespace-nowrap") as HTMLElement;

const charOpacities = () =>
  Array.from(titleContainer().children).map(
    (c) => (c as HTMLElement).style.opacity,
  );

afterEach(() => {
  vi.useRealTimers();
});

describe("ConversationList", () => {
  describe("the list", () => {
    it('two items render two <li>s inside one <ul> named "Conversations" by default, in items order', () => {
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
        />,
      );

      const list = screen.getByRole("list", { name: "Conversations" });
      const rows = screen.getAllByRole("listitem");

      expect(rows).toHaveLength(2);
      expect(list).toContainElement(rows[0]);
      expect(list).toContainElement(rows[1]);
      expect(rows[0].textContent).toContain("Booking 4711");
      expect(rows[1].textContent).toContain("Factura 9");
    });

    it('the <ul> carries an explicit role="list", which list-style: none cannot strip', () => {
      const { container } = render(<ConversationList items={[makeItem()]} />);

      expect(container.querySelector("ul")).toHaveAttribute("role", "list");
    });

    it('labels={{conversations: "Conversaciones"}} names the <ul> "Conversaciones"', () => {
      render(
        <ConversationList
          items={[makeItem()]}
          labels={{ conversations: "Conversaciones" }}
        />,
      );

      expect(
        screen.getByRole("list", { name: "Conversaciones" }),
      ).toBeInTheDocument();
    });

    it('timestamp "Ayer" and badge "Marginalia Books Ltd" render verbatim in the row', () => {
      render(
        <ConversationList
          items={[
            makeItem({ timestamp: "Ayer", badge: "Marginalia Books Ltd" }),
          ]}
        />,
      );

      expect(screen.getByText("Ayer")).toBeInTheDocument();
      expect(screen.getByText("Marginalia Books Ltd")).toBeInTheDocument();
    });

    it("an item without badge renders no badge element, and one without timestamp renders no meta row", () => {
      const { container } = render(
        <ConversationList items={[makeItem({ timestamp: "Ayer" })]} />,
      );

      expect(container.querySelectorAll("span.truncate")).toHaveLength(0);

      const bare = render(
        <ConversationList items={[makeItem({ id: "conv-2" })]} />,
      );

      expect(bare.container.querySelectorAll("span.gap-2")).toHaveLength(0);
    });
  });

  describe("the active row", () => {
    it('only the row whose id equals activeId carries aria-current="page" on its interactive element', () => {
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
          activeId="conv-1"
        />,
      );

      const [first, second] = screen.getAllByRole("button");

      expect(first).toHaveAttribute("aria-current", "page");
      expect(second).not.toHaveAttribute("aria-current");
    });

    it("with activeId undefined no row carries aria-current", () => {
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
        />,
      );

      for (const row of screen.getAllByRole("button")) {
        expect(row).not.toHaveAttribute("aria-current");
      }
    });
  });

  describe("selection", () => {
    it('clicking a row calls onSelect once with "conv-2"', () => {
      const onSelect = vi.fn();

      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
          onSelect={onSelect}
        />,
      );

      fireEvent.click(screen.getAllByRole("button")[1]);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("conv-2");
    });

    it("with onSelect omitted, clicking a row throws nothing", () => {
      render(<ConversationList items={[makeItem()]} />);

      expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
    });
  });

  describe("renderLink", () => {
    it("anchors carry the component's className and aria-current, and clicking one calls onSelect with that id", () => {
      const onSelect = vi.fn();

      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
          activeId="conv-2"
          onSelect={onSelect}
          renderLink={(item, props) => (
            <a href={"/chat/" + item.id} {...props} />
          )}
        />,
      );

      const [first, second] = screen.getAllByRole("link");

      expect(first).toHaveAttribute("href", "/chat/conv-1");
      expect(first.className).toContain("min-w-0");
      expect(first).not.toHaveAttribute("aria-current");
      expect(second).toHaveAttribute("aria-current", "page");

      fireEvent.click(first);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("conv-1");
    });

    it("a renderLink that spreads everything except onClick calls onSelect zero times", () => {
      const onSelect = vi.fn();

      render(
        <ConversationList
          items={[makeItem()]}
          onSelect={onSelect}
          renderLink={(item, { onClick: _onClick, ...rest }) => (
            <a href={"/chat/" + item.id} {...rest} />
          )}
        />,
      );

      fireEvent.click(screen.getByRole("link"));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("the design notes' renderLink section requires the consumer to spread every prop", () => {
      const designNotes = readFileSync(
        resolve(process.cwd(), "docs/design-notes.md"),
        "utf8",
      );

      expect(designNotes).toMatch(/## renderLink/);
      expect(designNotes).toMatch(/spread \*\*every\*\* prop/);
    });
  });

  describe("delete", () => {
    it('onDelete renders one button per row named "Delete conversation: Booking 4711"; clicking it calls onDelete with the id and onSelect zero times', () => {
      const onDelete = vi.fn();
      const onSelect = vi.fn();

      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
          onSelect={onSelect}
          onDelete={onDelete}
        />,
      );

      const button = screen.getByRole("button", {
        name: "Delete conversation: Booking 4711",
      });

      expect(
        screen.getByRole("button", { name: "Delete conversation: Factura 9" }),
      ).toBeInTheDocument();

      fireEvent.click(button);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("conv-1");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("onDelete omitted renders no TrashIcon and no delete button", () => {
      const { container } = render(<ConversationList items={[makeItem()]} />);

      expect(container.querySelector("svg")).toBeNull();
      expect(
        screen.queryByRole("button", { name: /Delete conversation/ }),
      ).toBeNull();
    });
  });

  describe("loading and empty", () => {
    it('isLoading renders a role="status" element named "Loading conversations" and zero rows, even with two items', () => {
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Factura 9" })]}
          isLoading
        />,
      );

      expect(
        screen.getByRole("status", { name: "Loading conversations" }),
      ).toBeInTheDocument();
      expect(screen.queryAllByRole("listitem")).toHaveLength(0);
      expect(screen.queryByRole("list")).toBeNull();
    });

    it('isLoading false with items: [] renders "No conversations yet" and no <ul>', () => {
      render(<ConversationList items={[]} />);

      expect(screen.getByText("No conversations yet")).toBeInTheDocument();
      expect(screen.queryByRole("list")).toBeNull();
    });
  });

  describe("the typewriter", () => {
    it('a rerender from a placeholder "New thread" to "Booking 4711" steps character by character at 25ms intervals', () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList
          items={[makeItem({ title: "New thread", isPlaceholderTitle: true })]}
        />,
      );

      expect(titleContainer().textContent).toBe("New thread");

      rerender(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4711", isPlaceholderTitle: false }),
          ]}
        />,
      );

      expect(titleContainer().textContent).toBe("New thread");
      expect(charOpacities().every((o) => o === "1")).toBe(true);

      act(() => {
        vi.advanceTimersByTime(25);
      });
      expect(charOpacities()[0]).toBe("0");
      expect(charOpacities()[1]).toBe("1");

      act(() => {
        vi.advanceTimersByTime(9 * 25);
      });
      expect(titleContainer().textContent).toBe("Booking 4711");
      expect(charOpacities().every((o) => o === "0")).toBe(true);

      act(() => {
        vi.advanceTimersByTime(25);
      });
      expect(charOpacities()[0]).toBe("1");
      expect(charOpacities()[11]).toBe("0");

      act(() => {
        vi.advanceTimersByTime(11 * 25);
      });
      expect(titleContainer().textContent).toBe("Booking 4711");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('a rerender from "Booking 4711" to "Booking 4712", neither a placeholder, replaces the text in one pass with zero timer ticks', () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4711", isPlaceholderTitle: false }),
          ]}
        />,
      );

      rerender(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4712", isPlaceholderTitle: false }),
          ]}
        />,
      );

      expect(titleContainer().textContent).toBe("Booking 4712");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('a rerender from "Untitled" to "Booking 4711" with isPlaceholderTitle absent on both animates zero times - the case literal-title sniffing would animate', () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList items={[makeItem({ title: "Untitled" })]} />,
      );

      rerender(
        <ConversationList items={[makeItem({ title: "Booking 4711" })]} />,
      );

      expect(titleContainer().textContent).toBe("Booking 4711");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("reducedMotion={true} makes the placeholder-to-real transition a one-pass replacement with zero timer ticks", () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList
          items={[makeItem({ title: "New thread", isPlaceholderTitle: true })]}
          reducedMotion
        />,
      );

      rerender(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4711", isPlaceholderTitle: false }),
          ]}
          reducedMotion
        />,
      );

      expect(titleContainer().textContent).toBe("Booking 4711");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("unmounting mid-animation clears the interval - advancing past the full run afterwards produces no state update and no act warning", () => {
      vi.useFakeTimers();
      const { rerender, unmount } = render(
        <ConversationList
          items={[makeItem({ title: "New thread", isPlaceholderTitle: true })]}
        />,
      );

      rerender(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4711", isPlaceholderTitle: false }),
          ]}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(50);
      });

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    });

    it('the full title "Booking 4711" is plain text for assistive tech, hidden with inline styles so no consumer stylesheet is required, and the per-character spans are aria-hidden', () => {
      render(<ConversationList items={[makeItem()]} />);

      const plainTitle = screen.getByText("Booking 4711");

      expect(plainTitle.style).toMatchObject({
        position: "absolute",
        width: "1px",
      });
      expect(plainTitle.hasAttribute("class")).toBe(false);
      expect(titleContainer()).toHaveAttribute("aria-hidden", "true");
    });

    it("mid-animation, assistive tech already reads the new title while the characters still show the old one", () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList
          items={[makeItem({ title: "New thread", isPlaceholderTitle: true })]}
        />,
      );

      rerender(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4711", isPlaceholderTitle: false }),
          ]}
        />,
      );

      expect(screen.getByText("Booking 4711")).toBeInTheDocument();
      expect(titleContainer().textContent).toBe("New thread");

      act(() => {
        vi.advanceTimersByTime(25 * 25);
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it("a second list does not animate from the first list's titles - the previous-title record is component-scoped, not module-scoped", () => {
      vi.useFakeTimers();
      render(
        <ConversationList
          items={[makeItem({ title: "New thread", isPlaceholderTitle: true })]}
        />,
      );

      const second = render(
        <ConversationList
          items={[
            makeItem({ title: "Booking 4711", isPlaceholderTitle: false }),
          ]}
        />,
      );

      const secondTitle = second.container.querySelector(
        "span.whitespace-nowrap",
      ) as HTMLElement;

      expect(secondTitle.textContent).toBe("Booking 4711");
      expect(
        Array.from(secondTitle.children).every(
          (c) => (c as HTMLElement).style.opacity === "1",
        ),
      ).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

describe("the source files (grep acceptance criteria)", () => {
  const componentPath = "src/components/ConversationList.tsx";
  const content = readFileSync(resolve(process.cwd(), componentPath), "utf8");

  it("reads no clock and no locale: no Date constructor, no toLocaleDateString, no Intl", () => {
    expect(content).not.toMatch(/\bDate\b|toLocaleDateString|\bIntl\b/);
  });

  it("GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics", () => {
    expect(content).not.toMatch(
      /console\.|localStorage|sessionStorage|fetch|sendBeacon|analytics|indexedDB/i,
    );
  });

  it("no @clerk, swr, next-intl, next/, @/ or lucide-react import, and every relative import ends in .js", () => {
    expect(content).not.toMatch(/@clerk|swr|next-intl|next\/|@\/|lucide-react/);
    const relativeImports = [...content.matchAll(/from\s+"(\.[^"]+)"/g)].map(
      ([, spec]) => spec,
    );

    expect(relativeImports.length).toBeGreaterThan(0);

    for (const spec of relativeImports) {
      expect(spec).toMatch(/\.js$/);
    }
  });
});
