/**
 * SearchField is authored new (issue #43, styled primitives). These tests
 * pin the contract in specs/bowman-ui-styled-primitives/spec.md § SearchField:
 * a controlled <input type="search"> named by a real label, reporting every
 * change verbatim, with a decorative SearchIcon and the ref on the input.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { SearchField, defaultSearchFieldLabels } from "../src/index.js";

const searchboxOf = (): HTMLInputElement => screen.getByRole("searchbox");

describe("SearchField", () => {
  describe("the input", () => {
    it('renders one <input type="search"> named "Search" with placeholder "Search..." by default', () => {
      render(<SearchField value="" onChange={vi.fn()} />);

      expect(screen.getByRole("searchbox", { name: "Search" })).toMatchObject({
        type: "search",
        placeholder: "Search...",
      });
    });

    it('value="4711" renders as the input\'s value', () => {
      render(<SearchField value="4711" onChange={vi.fn()} />);

      expect(searchboxOf()).toHaveValue("4711");
    });

    it('a change to "  Hvor " calls onChange once with "  Hvor " untrimmed', () => {
      const onChange = vi.fn();

      render(<SearchField value="" onChange={onChange} />);

      fireEvent.change(searchboxOf(), { target: { value: "  Hvor " } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("  Hvor ");
    });

    it("disabled renders the native disabled attribute", () => {
      render(<SearchField value="" onChange={vi.fn()} disabled />);

      expect(searchboxOf()).toBeDisabled();
    });

    it("the input is enabled when disabled is omitted", () => {
      render(<SearchField value="" onChange={vi.fn()} />);

      expect(searchboxOf()).toBeEnabled();
    });

    it("the forwarded ref reaches the <input>", () => {
      const ref = createRef<HTMLInputElement>();

      render(<SearchField ref={ref} value="" onChange={vi.fn()} />);

      expect(ref.current).toBe(searchboxOf());
    });
  });

  describe("the decorative icon", () => {
    it("the SearchIcon is an aria-hidden, pointer-events-none absolute <svg> inside a relative wrapper", () => {
      const { container } = render(<SearchField value="" onChange={vi.fn()} />);

      const icon = container.querySelector("svg");

      expect(container.firstElementChild).toHaveClass("relative");
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass("pointer-events-none", "absolute");
    });

    it("renders no button - no clear control and no submit", () => {
      const { container } = render(<SearchField value="" onChange={vi.fn()} />);

      expect(container.querySelectorAll("button")).toHaveLength(0);
    });
  });

  describe("labels", () => {
    it('labels={{ searchInput: "Søg i samtaler", searchPlaceholder: "Søg..." }} renders both overrides with no "Search" left in the DOM', () => {
      const { container } = render(
        <SearchField
          value=""
          onChange={vi.fn()}
          labels={{ searchInput: "Søg i samtaler", searchPlaceholder: "Søg..." }}
        />
      );

      expect(screen.getByRole("searchbox", { name: "Søg i samtaler" })).toHaveAttribute(
        "placeholder",
        "Søg..."
      );
      expect(container.innerHTML).not.toContain("Search");
    });

    it('labels={{ searchInput: undefined }} falls back to the "Search" default', () => {
      render(<SearchField value="" onChange={vi.fn()} labels={{ searchInput: undefined }} />);

      expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
    });

    it('defaultSearchFieldLabels is frozen and equals { searchInput: "Search", searchPlaceholder: "Search..." }', () => {
      expect(Object.isFrozen(defaultSearchFieldLabels)).toBe(true);
      expect(defaultSearchFieldLabels).toEqual({
        searchInput: "Search",
        searchPlaceholder: "Search...",
      });
    });
  });
});
