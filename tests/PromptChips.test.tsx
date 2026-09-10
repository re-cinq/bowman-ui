/**
 * The PromptChips characterization suite. The signatures, the index-qualified
 * keys and the empty-array-renders-nothing rule are tabled in
 * specs/bowman-ui-styled-primitives/spec.md § PromptChips.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { PromptChips, defaultPromptChipsLabels } from "../src/index.js";
import {
  expectBorder,
  expectFocusRing,
  expectRingOffset,
  expectSurface,
  expectSurfaceHover,
  expectTextBody,
} from "./helpers/expect-theme-tokens.js";

const threePrompts = ["Hvor er min booking?", "Send faktura 4711", "Skift afrejsedato"] as const;

describe("PromptChips", () => {
  describe("the list", () => {
    it('renders a <ul> with role="list" named "Suggested prompts" by default', () => {
      const { container } = render(<PromptChips prompts={[...threePrompts]} onPick={vi.fn()} />);

      const list = screen.getByRole("list", { name: "Suggested prompts" });

      expect(list.tagName).toBe("UL");
      expect(container.querySelector("ul")).toHaveAttribute("role", "list");
      expect(list).toHaveClass("flex", "flex-wrap", "justify-center", "gap-2");
    });

    it('labels={{ suggestedPrompts: "Forslag" }} names the list "Forslag" and "Suggested prompts" appears nowhere', () => {
      const { container } = render(
        <PromptChips
          prompts={[...threePrompts]}
          onPick={vi.fn()}
          labels={{ suggestedPrompts: "Forslag" }}
        />
      );

      expect(screen.getByRole("list", { name: "Forslag" })).toBeInTheDocument();
      expect(container.innerHTML).not.toContain("Suggested prompts");
    });

    it('labels={{ suggestedPrompts: undefined }} falls back to "Suggested prompts"', () => {
      render(
        <PromptChips
          prompts={[...threePrompts]}
          onPick={vi.fn()}
          labels={{ suggestedPrompts: undefined }}
        />
      );

      expect(screen.getByRole("list", { name: "Suggested prompts" })).toBeInTheDocument();
    });

    it("prompts={[]} renders nothing: an empty container and no list", () => {
      const { container } = render(<PromptChips prompts={[]} onPick={vi.fn()} />);

      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByRole("list")).toBeNull();
    });
  });

  describe("the chips", () => {
    it('three prompts render three type="button" chips named by the prompt texts, in order, one per <li>', () => {
      render(<PromptChips prompts={[...threePrompts]} onPick={vi.fn()} />);

      const chips = screen.getAllByRole("button");

      expect(chips.map((chip) => chip.textContent)).toEqual([...threePrompts]);
      expect(chips.map((chip) => chip.getAttribute("type"))).toEqual([
        "button",
        "button",
        "button",
      ]);
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
      expect(screen.getByRole("button", { name: "Send faktura 4711" }).parentElement?.tagName).toBe(
        "LI"
      );
    });

    it('clicking "Hvor er min booking?" calls onPick once with exactly that string', () => {
      const onPick = vi.fn();

      render(<PromptChips prompts={[...threePrompts]} onPick={onPick} />);

      fireEvent.click(screen.getByRole("button", { name: "Hvor er min booking?" }));

      expect(onPick).toHaveBeenCalledTimes(1);
      expect(onPick).toHaveBeenCalledWith("Hvor er min booking?");
    });

    it('clicking "Skift afrejsedato" leaves the other two prompts uncalled', () => {
      const onPick = vi.fn();

      render(<PromptChips prompts={[...threePrompts]} onPick={onPick} />);

      fireEvent.click(screen.getByRole("button", { name: "Skift afrejsedato" }));

      expect(onPick.mock.calls).toEqual([["Skift afrejsedato"]]);
    });

    it('two identical prompts "Send faktura 4711" render two chips', () => {
      render(<PromptChips prompts={["Send faktura 4711", "Send faktura 4711"]} onPick={vi.fn()} />);

      expect(screen.getAllByRole("button", { name: "Send faktura 4711" })).toHaveLength(2);
    });

    it("a chip carries the rounded-full pill classes beside the --bowman-border, --bowman-surface, --bowman-surface-hover and --bowman-text-body tokens", () => {
      render(<PromptChips prompts={["Hvor er min booking?"]} onPick={vi.fn()} />);

      expect(screen.getByRole("button")).toHaveClass(
        "rounded-full",
        "border",
        "px-4",
        "py-2",
        "text-sm"
      );
      expectBorder(screen.getByRole("button"));
      expectSurface(screen.getByRole("button"));
      expectSurfaceHover(screen.getByRole("button"));
      expectTextBody(screen.getByRole("button"));
    });
  });

  describe("defaultPromptChipsLabels", () => {
    it('is frozen and equals { suggestedPrompts: "Suggested prompts" }', () => {
      expect(Object.isFrozen(defaultPromptChipsLabels)).toBe(true);
      expect(defaultPromptChipsLabels).toEqual({ suggestedPrompts: "Suggested prompts" });
    });
  });

  describe("theming tokens", () => {
    it("a chip keeps focus:ring-2 ring-offset-2 focus:outline-none beside the --bowman-focus-ring and --bowman-ring-offset colours", () => {
      render(<PromptChips prompts={["Hvor er min booking?"]} onPick={vi.fn()} />);

      expectFocusRing(screen.getByRole("button"));
      expectRingOffset(screen.getByRole("button"));
      expect(screen.getByRole("button")).toHaveClass("ring-offset-2", "focus:outline-none");
    });
  });
});
