/**
 * IconButton is authored new (issue #43): the behaviour suite for the
 * icon-only primitive, pinning the required labels.accessibleName, the
 * square padding and the shared variant looks tabled in
 * specs/bowman-ui-styled-primitives/spec.md.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { IconButton, PlusIcon } from "../src/index.js";

const labels = { accessibleName: "Tilføj 4711" };
const buttonOf = (): HTMLButtonElement => screen.getByRole("button", { name: "Tilføj 4711" });

describe("IconButton", () => {
  describe("the element", () => {
    it('renders one <button type="button"> named "Tilføj 4711" through aria-label with empty text content', () => {
      const { container } = render(<IconButton icon={PlusIcon} labels={labels} />);

      expect(container.querySelectorAll("button")).toHaveLength(1);
      expect(buttonOf()).toHaveAttribute("type", "button");
      expect(buttonOf()).toHaveAttribute("aria-label", "Tilføj 4711");
      expect(buttonOf().textContent).toBe("");
    });

    it('type="submit" renders type="submit"', () => {
      render(<IconButton icon={PlusIcon} labels={labels} type="submit" />);

      expect(buttonOf()).toHaveAttribute("type", "submit");
    });

    it("the ref reaches the <button> element", () => {
      const ref = createRef<HTMLButtonElement>();

      render(<IconButton ref={ref} icon={PlusIcon} labels={labels} />);

      expect(ref.current).toBe(buttonOf());
    });

    it('the button contains only one aria-hidden <svg class="h-4 w-4"> at md', () => {
      const button = render(<IconButton icon={PlusIcon} labels={labels} />).getByRole("button");

      expect(button.childNodes).toHaveLength(1);
      expect(button.firstElementChild).toMatchObject({ tagName: "svg" });
      expect(button.firstElementChild).toHaveClass("h-4", "w-4");
      expect(button.firstElementChild).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("clicking", () => {
    it('clicking "Tilføj 4711" calls onClick once with the click event', () => {
      const onClick = vi.fn();

      render(<IconButton icon={PlusIcon} labels={labels} onClick={onClick} />);

      fireEvent.click(buttonOf());

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toMatchObject({ type: "click", target: buttonOf() });
      expect(onClick.mock.calls[0][0].nativeEvent).toBeInstanceOf(MouseEvent);
    });

    it("disabled renders the native attribute and the click never reaches onClick", () => {
      const onClick = vi.fn();

      render(<IconButton icon={PlusIcon} labels={labels} disabled onClick={onClick} />);

      expect(buttonOf()).toBeDisabled();

      fireEvent.click(buttonOf());

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("the variants", () => {
    it("with variant omitted the button is secondary: border border-slate-200 bg-white and no bg-blue-500", () => {
      render(<IconButton icon={PlusIcon} labels={labels} />);

      expect(buttonOf()).toHaveClass("border", "border-slate-200", "bg-white", "text-slate-700");
      expect(buttonOf()).not.toHaveClass("bg-blue-500");
    });

    it('variant="primary" carries bg-blue-500 text-white and no border-slate-200', () => {
      render(<IconButton icon={PlusIcon} labels={labels} variant="primary" />);

      expect(buttonOf()).toHaveClass("bg-blue-500", "text-white");
      expect(buttonOf()).not.toHaveClass("border-slate-200");
    });

    it('variant="ghost" carries text-slate-600 hover:bg-slate-50 and no border class at all', () => {
      render(<IconButton icon={PlusIcon} labels={labels} variant="ghost" />);

      expect(buttonOf()).toHaveClass("text-slate-600", "hover:bg-slate-50");
      expect(buttonOf()).not.toHaveClass("border");
      expect(buttonOf()).not.toHaveClass("border-slate-200");
      expect(buttonOf()).not.toHaveClass("bg-blue-500");
    });

    it("the focus ring and the disabled pair are present", () => {
      render(<IconButton icon={PlusIcon} labels={labels} />);

      expect(buttonOf()).toHaveClass(
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-blue-500",
        "ring-offset-2",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50"
      );
    });
  });

  describe("the sizes", () => {
    it("with size omitted the button carries the square md padding p-2 and no text scale", () => {
      render(<IconButton icon={PlusIcon} labels={labels} />);

      expect(buttonOf()).toHaveClass("p-2");
      expect(buttonOf()).not.toHaveClass("p-1.5");
      expect(buttonOf()).not.toHaveClass("px-4");
      expect(buttonOf()).not.toHaveClass("text-sm");
    });

    it('size="sm" carries p-1.5 and sizes the svg h-3.5 w-3.5', () => {
      render(<IconButton icon={PlusIcon} labels={labels} size="sm" />);

      expect(buttonOf()).toHaveClass("p-1.5");
      expect(buttonOf()).not.toHaveClass("p-2");
      expect(buttonOf().firstElementChild).toHaveClass("h-3.5", "w-3.5");
    });
  });
});
