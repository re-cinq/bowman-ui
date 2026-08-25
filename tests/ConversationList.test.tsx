/**
 * Ported from 015's ChatHistory characterization suite where the extracted
 * surface has a counterpart, with the flips the extraction makes on purpose
 * (aria-current instead of the bg-class-only active row, isPlaceholderTitle
 * instead of the three-literal sniffing) - the table in
 * specs/bowman-ui-conversation-list/spec.md records every flip and every
 * 015 assertion dropped to the consumer.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConversationList } from "../src/index.js";
import type { ConversationListItem } from "../src/index.js";

const makeItem = (overrides?: Partial<ConversationListItem>): ConversationListItem => ({
  id: "conv-1",
  title: "Booking 4711",
  ...overrides,
});

/** TypewriterTitle splits titles into per-character spans, so plain getByText fails. */
const titleContainer = () => document.querySelector("span.whitespace-nowrap") as HTMLElement;

const charOpacities = () =>
  Array.from(titleContainer().children).map((c) => (c as HTMLElement).style.opacity);

afterEach(() => {
  vi.useRealTimers();
});

describe("ConversationList", () => {
  describe("the list", () => {
    it('two items render two <li>s inside one <ul> named "Conversations" by default, in items order', () => {
      render(
        <ConversationList items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]} />
      );

      const list = screen.getByRole("list", { name: "Conversations" });
      const rows = screen.getAllByRole("listitem");
      expect(rows).toHaveLength(2);
      expect(list).toContainElement(rows[0]);
      expect(list).toContainElement(rows[1]);
      expect(rows[0].textContent).toContain("Booking 4711");
      expect(rows[1].textContent).toContain("Faktura 9");
    });

    it('labels={{conversations: "Samtaler"}} names the <ul> "Samtaler"', () => {
      render(<ConversationList items={[makeItem()]} labels={{ conversations: "Samtaler" }} />);

      expect(screen.getByRole("list", { name: "Samtaler" })).toBeInTheDocument();
    });

    it('timestamp "I går" and badge "Havkat Rejser A/S" render verbatim in the row', () => {
      render(
        <ConversationList items={[makeItem({ timestamp: "I går", badge: "Havkat Rejser A/S" })]} />
      );

      expect(screen.getByText("I går")).toBeInTheDocument();
      expect(screen.getByText("Havkat Rejser A/S")).toBeInTheDocument();
    });

    it("an item without badge renders no badge element, and one without timestamp renders no meta row", () => {
      const { container } = render(<ConversationList items={[makeItem({ timestamp: "I går" })]} />);
      expect(container.querySelectorAll("span.truncate")).toHaveLength(0);

      const bare = render(<ConversationList items={[makeItem({ id: "conv-2" })]} />);
      expect(bare.container.querySelectorAll("span.gap-2")).toHaveLength(0);
    });
  });

  describe("the active row", () => {
    it('only the row whose id equals activeId carries aria-current="page" on its interactive element', () => {
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]}
          activeId="conv-1"
        />
      );

      const [first, second] = screen.getAllByRole("button");
      expect(first).toHaveAttribute("aria-current", "page");
      expect(second).not.toHaveAttribute("aria-current");
    });

    it("with activeId undefined no row carries aria-current", () => {
      render(
        <ConversationList items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]} />
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
          items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]}
          onSelect={onSelect}
        />
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
          items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]}
          activeId="conv-2"
          onSelect={onSelect}
          renderLink={(item, props) => <a href={"/chat/" + item.id} {...props} />}
        />
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
        />
      );

      fireEvent.click(screen.getByRole("link"));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("CONTRACT.md's renderLink section requires the consumer to spread every prop", () => {
      const contract = readFileSync(resolve(process.cwd(), "CONTRACT.md"), "utf8");

      expect(contract).toMatch(/## renderLink/);
      expect(contract).toMatch(/spread \*\*every\*\* prop/);
    });
  });

  describe("delete", () => {
    it('onDelete renders one button per row named "Delete conversation: Booking 4711"; clicking it calls onDelete with the id and onSelect zero times', () => {
      const onDelete = vi.fn();
      const onSelect = vi.fn();
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      );

      const button = screen.getByRole("button", { name: "Delete conversation: Booking 4711" });
      expect(
        screen.getByRole("button", { name: "Delete conversation: Faktura 9" })
      ).toBeInTheDocument();

      fireEvent.click(button);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith("conv-1");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("onDelete omitted renders no TrashIcon and no delete button", () => {
      const { container } = render(<ConversationList items={[makeItem()]} />);

      expect(container.querySelector("svg")).toBeNull();
      expect(screen.queryByRole("button", { name: /Delete conversation/ })).toBeNull();
    });
  });

  describe("loading and empty", () => {
    it('isLoading renders a role="status" element named "Loading conversations" and zero rows, even with two items', () => {
      render(
        <ConversationList
          items={[makeItem(), makeItem({ id: "conv-2", title: "Faktura 9" })]}
          isLoading
        />
      );

      expect(screen.getByRole("status", { name: "Loading conversations" })).toBeInTheDocument();
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
    it('a rerender from a placeholder "Ny samtale" to "Booking 4711" steps character by character at 25ms intervals', () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList items={[makeItem({ title: "Ny samtale", isPlaceholderTitle: true })]} />
      );
      expect(titleContainer().textContent).toBe("Ny samtale");

      rerender(
        <ConversationList
          items={[makeItem({ title: "Booking 4711", isPlaceholderTitle: false })]}
        />
      );

      expect(titleContainer().textContent).toBe("Ny samtale");
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
          items={[makeItem({ title: "Booking 4711", isPlaceholderTitle: false })]}
        />
      );

      rerender(
        <ConversationList
          items={[makeItem({ title: "Booking 4712", isPlaceholderTitle: false })]}
        />
      );

      expect(titleContainer().textContent).toBe("Booking 4712");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('a rerender from "Untitled" to "Booking 4711" with isPlaceholderTitle absent on both animates zero times - the case the source\'s literal sniffing animates', () => {
      vi.useFakeTimers();
      const { rerender } = render(<ConversationList items={[makeItem({ title: "Untitled" })]} />);

      rerender(<ConversationList items={[makeItem({ title: "Booking 4711" })]} />);

      expect(titleContainer().textContent).toBe("Booking 4711");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("reducedMotion={true} makes the placeholder-to-real transition a one-pass replacement with zero timer ticks", () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <ConversationList
          items={[makeItem({ title: "Ny samtale", isPlaceholderTitle: true })]}
          reducedMotion
        />
      );

      rerender(
        <ConversationList
          items={[makeItem({ title: "Booking 4711", isPlaceholderTitle: false })]}
          reducedMotion
        />
      );

      expect(titleContainer().textContent).toBe("Booking 4711");
      expect(charOpacities().every((o) => o === "1")).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("unmounting mid-animation clears the interval - advancing past the full run afterwards produces no state update and no act warning", () => {
      vi.useFakeTimers();
      const { rerender, unmount } = render(
        <ConversationList items={[makeItem({ title: "Ny samtale", isPlaceholderTitle: true })]} />
      );
      rerender(
        <ConversationList
          items={[makeItem({ title: "Booking 4711", isPlaceholderTitle: false })]}
        />
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

    it("a second list does not animate from the first list's titles - the previous-title record is component-scoped, not module-scoped", () => {
      vi.useFakeTimers();
      render(
        <ConversationList items={[makeItem({ title: "Ny samtale", isPlaceholderTitle: true })]} />
      );

      const second = render(
        <ConversationList
          items={[makeItem({ title: "Booking 4711", isPlaceholderTitle: false })]}
        />
      );

      const secondTitle = second.container.querySelector("span.whitespace-nowrap") as HTMLElement;
      expect(secondTitle.textContent).toBe("Booking 4711");
      expect(
        Array.from(secondTitle.children).every((c) => (c as HTMLElement).style.opacity === "1")
      ).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

describe("the extracted source (grep acceptance criteria)", () => {
  const componentPath = "src/components/ConversationList.tsx";
  const content = readFileSync(resolve(process.cwd(), componentPath), "utf8");

  it("reads no clock and no locale: no Date constructor, no toLocaleDateString, no Intl", () => {
    expect(content).not.toMatch(/\bDate\b|toLocaleDateString|\bIntl\b/);
  });

  it("GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics", () => {
    expect(content).not.toMatch(
      /console\.|localStorage|sessionStorage|fetch|sendBeacon|analytics|indexedDB/i
    );
  });

  it("no @clerk, swr, next-intl, next/, @discovery, @/ or lucide-react import, and every relative import ends in .js", () => {
    expect(content).not.toMatch(/@clerk|swr|next-intl|next\/|@discovery|@\/|lucide-react/);
    const relativeImports = [...content.matchAll(/from\s+"(\.[^"]+)"/g)].map(([, spec]) => spec);
    expect(relativeImports.length).toBeGreaterThan(0);
    for (const spec of relativeImports) {
      expect(spec).toMatch(/\.js$/);
    }
  });
});
