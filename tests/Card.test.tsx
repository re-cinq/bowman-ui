/**
 * Card (specs/bowman-ui-form-dialog-notice/spec.md § Card): a static <div>
 * surface with an <h3> heading, or, with onSelect, one <button> named by its
 * heading and described by its body.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Card } from "../src/index.js";
import {
  expectBorder,
  expectFocusRing,
  expectRingOffset,
  expectSurface,
  expectSurfaceHover,
  expectTextBody,
  expectTextStrong,
} from "./helpers/expect-theme-tokens.js";

describe("Card", () => {
  describe("static", () => {
    it("renders a <div> on SURFACE and BORDER with no role and no name, its heading an <h3>", () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <Card ref={ref} heading="4711">
          <span data-testid="body">4712</span>
        </Card>
      );
      const card = container.firstElementChild;
      const heading = screen.getByRole("heading", { level: 3, name: "4711" });

      expect(card?.tagName).toBe("DIV");
      expect(ref.current).toBe(card);
      expect(card).not.toHaveAttribute("role");
      expect(card).not.toHaveAttribute("aria-labelledby");
      expectSurface(card);
      expectBorder(card);
      expect(heading).toHaveClass("font-semibold");
      expectTextStrong(heading);
      expectTextBody(screen.getByTestId("body").parentElement);
    });

    it("disabled renders nothing on a static card, and without heading no <h3> renders", () => {
      const { container } = render(<Card disabled>4712</Card>);

      expect(container.firstElementChild).not.toHaveAttribute("disabled");
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("selectable", () => {
    it("with onSelect and a heading, one left-aligned <button type=button> is named by the heading and described by the body", () => {
      const ref = createRef<HTMLElement>();

      render(
        <Card ref={ref} heading="4711" onSelect={vi.fn()}>
          4712
        </Card>
      );
      const button = screen.getByRole("button", { name: "4711" });

      expect(ref.current).toBe(button);
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAccessibleDescription("4712");
      expect(button).toHaveClass("text-left");
      expect(screen.getByText("4711").tagName).toBe("SPAN");
      expectTextStrong(screen.getByText("4711"));
      expectTextBody(screen.getByText("4712"));
    });

    it("without a heading, the button's name is its content and it carries no aria-labelledby", () => {
      render(<Card onSelect={vi.fn()}>4712</Card>);
      const button = screen.getByRole("button", { name: "4712" });

      expect(button).not.toHaveAttribute("aria-labelledby");
      expect(button).not.toHaveAttribute("aria-describedby");
    });

    it("carries the shared offset ring beside ring-offset-2, a SURFACE_HOVER hover and no shadow", () => {
      render(<Card onSelect={vi.fn()}>4712</Card>);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("ring-offset-2", "focus:outline-none");
      expectFocusRing(button);
      expectRingOffset(button);
      expectSurfaceHover(button);
      expect(button.className).not.toMatch(/(^|\s)shadow-/);
    });

    it("a click calls onSelect once", () => {
      const onSelect = vi.fn();

      render(<Card onSelect={onSelect}>4712</Card>);
      fireEvent.click(screen.getByRole("button"));

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("disabled renders the native attribute and the disabled pair with no hover surface, and a click never calls onSelect", () => {
      const onSelect = vi.fn();

      render(
        <Card onSelect={onSelect} disabled>
          4712
        </Card>
      );
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
      expect(button).not.toHaveClass("hover:bg-(--bowman-surface-hover,var(--color-slate-50))");
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
