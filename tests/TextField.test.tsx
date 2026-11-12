/**
 * TextField (specs/bowman-ui-form-dialog-notice/spec.md § TextField): a
 * controlled input named by a visible label, with an optional hint and an
 * error whose presence is the invalid state, rendered into a live region.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { TextField } from "../src/index.js";
import {
  expectBorder,
  expectControlBorder,
  expectDanger,
  expectDangerBorder,
  expectFocusRing,
  expectSurface,
  expectTextMuted,
  expectTextStrong,
} from "./helpers/expect-theme-tokens.js";

const fieldLabel = "Navn 4711";
const inputOf = () => screen.getByRole("textbox", { name: fieldLabel });

describe("TextField", () => {
  it("a visible <label> holding fieldLabel names the input, and the ref reaches the input", () => {
    const ref = createRef<HTMLInputElement>();

    render(<TextField ref={ref} value="" onChange={vi.fn()} labels={{ fieldLabel }} />);
    const label = screen.getByText(fieldLabel);

    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", inputOf().id);
    expect(label).toHaveClass("text-sm", "font-medium");
    expectTextStrong(label);
    expect(ref.current).toBe(inputOf());
  });

  it("the input at rest takes rounded-lg border px-3 py-2 text-sm on SURFACE in TEXT_STRONG, the focus ring, the disabled pair and CONTROL_BORDER", () => {
    render(<TextField value="" onChange={vi.fn()} labels={{ fieldLabel }} />);

    expect(inputOf()).toHaveClass(
      "rounded-lg",
      "border",
      "px-3",
      "py-2",
      "text-sm",
      "focus:outline-none",
      "disabled:cursor-not-allowed",
      "disabled:opacity-50"
    );
    expectSurface(inputOf());
    expectTextStrong(inputOf());
    expectFocusRing(inputOf());
    expectControlBorder(inputOf());
    expect(() => expectBorder(inputOf())).toThrow();
    expect(inputOf()).not.toHaveAttribute("aria-invalid");
  });

  it('renders value="4711" and reports a change to "  4712 " verbatim, once', () => {
    const onChange = vi.fn();

    render(<TextField value="4711" onChange={onChange} labels={{ fieldLabel }} />);

    expect(inputOf()).toHaveValue("4711");
    fireEvent.change(inputOf(), { target: { value: "  4712 " } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("  4712 ");
  });

  it('type defaults to "text", and type, required, disabled, autoComplete, spellCheck and name render natively', () => {
    const { rerender } = render(<TextField value="" onChange={vi.fn()} labels={{ fieldLabel }} />);

    expect(inputOf()).toHaveAttribute("type", "text");
    expect(inputOf()).not.toBeRequired();
    expect(inputOf()).toBeEnabled();

    rerender(
      <TextField
        value=""
        onChange={vi.fn()}
        labels={{ fieldLabel }}
        type="email"
        required
        disabled
        autoComplete="email"
        spellCheck={false}
        name="kontakt"
      />
    );

    expect(inputOf()).toMatchObject({ type: "email", name: "kontakt", autocomplete: "email" });
    expect(inputOf()).toBeRequired();
    expect(inputOf()).toBeDisabled();
    expect(inputOf()).toHaveAttribute("spellcheck", "false");
  });

  it("required adds no visible marker", () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} labels={{ fieldLabel }} required />
    );

    expect(container.textContent).toBe(fieldLabel);
  });

  it("a hint renders under the input in TEXT_MUTED and aria-describedby names it", () => {
    render(
      <TextField value="" onChange={vi.fn()} labels={{ fieldLabel, fieldHint: "Hint 4712" }} />
    );
    const hint = screen.getByText("Hint 4712");

    expect(inputOf()).toHaveAttribute("aria-describedby", hint.id);
    expect(inputOf().compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expectTextMuted(hint);
  });

  it("an error sets aria-invalid, swaps CONTROL_BORDER for DANGER_BORDER, renders in DANGER after the hint, and aria-describedby names the hint then the error", () => {
    render(
      <TextField
        value=""
        onChange={vi.fn()}
        labels={{ fieldLabel, fieldHint: "Hint 4712", fieldError: "Fejl 4713" }}
      />
    );
    const hint = screen.getByText("Hint 4712");
    const error = screen.getByText("Fejl 4713");

    expect(inputOf()).toHaveAttribute("aria-invalid", "true");
    expect(inputOf()).toHaveAttribute("aria-describedby", `${hint.id} ${error.id}`);
    expect(hint.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expectDangerBorder(inputOf());
    expect(inputOf()).not.toHaveClass(
      "border-(--bowman-text-muted,var(--color-slate-500))",
      "dark:border-(--bowman-text-muted-dark,var(--color-slate-400))"
    );
    expectDanger(error);
  });

  it("an error without a hint is the only id aria-describedby names", () => {
    render(
      <TextField value="" onChange={vi.fn()} labels={{ fieldLabel, fieldError: "Fejl 4713" }} />
    );

    expect(inputOf()).toHaveAttribute("aria-describedby", screen.getByText("Fejl 4713").id);
  });

  it("an empty fieldHint and an empty fieldError count as absent", () => {
    const { container } = render(
      <TextField
        value=""
        onChange={vi.fn()}
        labels={{ fieldLabel, fieldHint: "", fieldError: "" }}
      />
    );

    expect(inputOf()).not.toHaveAttribute("aria-describedby");
    expect(inputOf()).not.toHaveAttribute("aria-invalid");
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expectControlBorder(inputOf());
  });

  it("the error's polite live region exists from the first render, so an error added later is announced", () => {
    const { container, rerender } = render(
      <TextField value="" onChange={vi.fn()} labels={{ fieldLabel }} />
    );
    const region = container.querySelector('[aria-live="polite"]');

    expect(region).toBeEmptyDOMElement();

    rerender(
      <TextField value="" onChange={vi.fn()} labels={{ fieldLabel, fieldError: "Fejl 4713" }} />
    );

    expect(container.querySelector('[aria-live="polite"]')).toBe(region);
    expect(region).toHaveTextContent("Fejl 4713");
  });
});
