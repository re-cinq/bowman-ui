/**
 * Button is authored new (issue #43): the behaviour suite for the text
 * primitive, pinning the signatures and class names tabled in
 * specs/bowman-ui-styled-primitives/spec.md.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Button, PlusIcon } from "../src/index.js";

const buttonOf = (): HTMLButtonElement => screen.getByRole("button", { name: "Ny samtale" });

describe("Button", () => {
  describe("the element", () => {
    it('renders one <button type="button"> whose accessible name is the children "Ny samtale"', () => {
      const { container } = render(<Button variant="primary">Ny samtale</Button>);

      expect(container.querySelectorAll("button")).toHaveLength(1);
      expect(buttonOf()).toHaveAttribute("type", "button");
    });

    it('type="submit" renders type="submit"', () => {
      render(
        <Button variant="primary" type="submit">
          Ny samtale
        </Button>
      );

      expect(buttonOf()).toHaveAttribute("type", "submit");
    });

    it("the ref reaches the <button> element", () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <Button ref={ref} variant="primary">
          Ny samtale
        </Button>
      );

      expect(ref.current).toBe(buttonOf());
    });
  });

  describe("clicking", () => {
    it('clicking "Ny samtale" calls onClick once with the click event', () => {
      const onClick = vi.fn();

      render(
        <Button variant="primary" onClick={onClick}>
          Ny samtale
        </Button>
      );

      fireEvent.click(buttonOf());

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick.mock.calls[0][0]).toMatchObject({ type: "click", target: buttonOf() });
      expect(onClick.mock.calls[0][0].nativeEvent).toBeInstanceOf(MouseEvent);
    });

    it("disabled renders the native attribute and the click never reaches onClick", () => {
      const onClick = vi.fn();

      render(
        <Button variant="primary" disabled onClick={onClick}>
          Ny samtale
        </Button>
      );

      expect(buttonOf()).toBeDisabled();

      fireEvent.click(buttonOf());

      expect(onClick).not.toHaveBeenCalled();
    });

    it("with onClick omitted, clicking throws nothing", () => {
      render(<Button variant="primary">Ny samtale</Button>);

      expect(() => fireEvent.click(buttonOf())).not.toThrow();
    });
  });

  describe("the variants", () => {
    it('variant="primary" carries bg-blue-500 text-white and no border-slate-200', () => {
      render(<Button variant="primary">Ny samtale</Button>);

      expect(buttonOf()).toHaveClass("bg-blue-500", "text-white", "hover:bg-blue-600");
      expect(buttonOf()).not.toHaveClass("border-slate-200");
    });

    it('variant="secondary" carries border border-slate-200 bg-white text-slate-700 and no bg-blue-500', () => {
      render(<Button variant="secondary">Ny samtale</Button>);

      expect(buttonOf()).toHaveClass("border", "border-slate-200", "bg-white", "text-slate-700");
      expect(buttonOf()).not.toHaveClass("bg-blue-500");
    });

    it('variant="ghost" carries text-slate-600 hover:bg-slate-50 and neither border-slate-200 nor bg-blue-500', () => {
      render(<Button variant="ghost">Ny samtale</Button>);

      expect(buttonOf()).toHaveClass("text-slate-600", "hover:bg-slate-50", "hover:text-slate-900");
      expect(buttonOf()).not.toHaveClass("border-slate-200");
      expect(buttonOf()).not.toHaveClass("bg-blue-500");
    });

    it("every variant carries the focus ring and the disabled pair", () => {
      render(
        <>
          <Button variant="primary">Ny samtale</Button>
          <Button variant="secondary">Ny samtale</Button>
          <Button variant="ghost">Ny samtale</Button>
        </>
      );

      for (const button of screen.getAllByRole("button")) {
        expect(button).toHaveClass(
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500",
          "ring-offset-2",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50"
        );
      }
    });
  });

  describe("the sizes", () => {
    it("with size omitted the button carries the md padding px-4 py-2.5 text-sm", () => {
      render(<Button variant="primary">Ny samtale</Button>);

      expect(buttonOf()).toHaveClass("px-4", "py-2.5", "text-sm");
      expect(buttonOf()).not.toHaveClass("text-xs");
    });

    it('size="sm" carries px-3 py-1.5 text-xs and not text-sm', () => {
      render(
        <Button variant="primary" size="sm">
          Ny samtale
        </Button>
      );

      expect(buttonOf()).toHaveClass("px-3", "py-1.5", "text-xs");
      expect(buttonOf()).not.toHaveClass("text-sm");
    });
  });

  describe("the leading icon", () => {
    it('icon={PlusIcon} at md renders an aria-hidden <svg class="h-4 w-4"> before the text "Ny samtale"', () => {
      render(
        <Button variant="secondary" icon={PlusIcon}>
          Ny samtale
        </Button>
      );

      const button = buttonOf();
      const svg = button.firstElementChild;

      expect(svg).toMatchObject({ tagName: "svg" });
      expect(svg).toHaveClass("h-4", "w-4");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(button.childNodes[0]).toBe(svg);
      expect(button.childNodes[1]).toMatchObject({
        nodeType: Node.TEXT_NODE,
        textContent: "Ny samtale",
      });
    });

    it('icon={PlusIcon} at size="sm" sizes the svg h-3.5 w-3.5', () => {
      render(
        <Button variant="secondary" size="sm" icon={PlusIcon}>
          Ny samtale
        </Button>
      );

      expect(buttonOf().firstElementChild).toHaveClass("h-3.5", "w-3.5");
    });

    it("with icon omitted no svg renders and the button holds only the text", () => {
      render(<Button variant="secondary">Ny samtale</Button>);

      expect(buttonOf().querySelector("svg")).toBeNull();
      expect(buttonOf().childNodes).toHaveLength(1);
    });
  });
});
