/**
 * ConfirmDialog (specs/bowman-ui-form-dialog-notice/spec.md § ConfirmDialog): a
 * portalled role="alertdialog" form with a secondary cancel and a danger
 * confirm, a guarded submit, and a busy state that disables both buttons,
 * announces confirmBusy and moves lost focus to the panel. The contract it
 * shares with Dialog lives in tests/helpers/modal-panel-contract.tsx.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ConfirmDialog, defaultConfirmDialogLabels } from "../src/index.js";
import { expectDangerFill } from "./helpers/expect-theme-tokens.js";
import { stubFocusEnvironment } from "./helpers/focus-environment.js";
import { describeModalPanelContract } from "./helpers/modal-panel-contract.js";

const title = "Slet samtale 4711";
const labels = { dialogTitle: title, confirmAction: "Slet 4711" };

interface Overrides {
  open?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

const Harness = ({
  open = true,
  onConfirm = () => {},
  onCancel = () => {},
  ...rest
}: Overrides) => (
  <>
    <button>opener</button>
    <ConfirmDialog
      open={open}
      onConfirm={onConfirm}
      onCancel={onCancel}
      labels={labels}
      description="4711 – 4712"
      {...rest}
    />
  </>
);

const panelOf = () => screen.getByRole("alertdialog", { name: title });
const cancelOf = () => screen.getByRole("button", { name: "Cancel" });
const confirmOf = () => screen.getByRole("button", { name: "Slet 4711" });
const statusOf = () => panelOf().querySelector('[role="status"]');
const field = <input aria-label="Navn 4711" />;

describe("ConfirmDialog", () => {
  stubFocusEnvironment();

  describeModalPanelContract({
    role: "alertdialog",
    title,
    renderModal: ({ open, onEscape, children, returnFocusRef, container }) => (
      <ConfirmDialog
        open={open}
        onConfirm={() => {}}
        onCancel={onEscape}
        labels={labels}
        description="4711"
        returnFocusRef={returnFocusRef}
        container={container}
      >
        {children}
      </ConfirmDialog>
    ),
  });

  describe("structure", () => {
    it('defaultConfirmDialogLabels is frozen and equals { cancelAction: "Cancel", confirmBusy: "Working, please wait" }', () => {
      expect(Object.isFrozen(defaultConfirmDialogLabels)).toBe(true);
      expect(defaultConfirmDialogLabels).toEqual({
        cancelAction: "Cancel",
        confirmBusy: "Working, please wait",
      });
    });

    it('renders role="alertdialog" described by the <div> holding description, with no close button', () => {
      render(<Harness />);
      const description = document.getElementById(
        panelOf().getAttribute("aria-describedby") as string
      );

      expect(description?.tagName).toBe("DIV");
      expect(description).toHaveTextContent("4711 – 4712");
      expect(panelOf().querySelectorAll("button")).toHaveLength(2);
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    });

    it("one <form noValidate> holds description, children, then a secondary cancel and a danger submit confirm", () => {
      render(<Harness>{field}</Harness>);
      const form = panelOf().querySelector("form") as HTMLFormElement;
      const [description] = form.querySelectorAll("div[id]");
      const order = [description, screen.getByRole("textbox"), cancelOf(), confirmOf()];

      expect(form).toHaveAttribute("novalidate");
      expect(form).toHaveClass("flex", "flex-col", "min-h-0");

      for (const [index, element] of order.slice(1).entries()) {
        expect(
          order[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
      }
      expect(form).toContainElement(confirmOf());
      expect(cancelOf()).toHaveAttribute("type", "button");
      expect(cancelOf()).toHaveClass("border");
      expect(confirmOf()).toHaveAttribute("type", "submit");
      expectDangerFill(confirmOf());
    });

    it('labels={{ cancelAction: "Fortryd" }} names the cancel button', () => {
      render(
        <ConfirmDialog
          open
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          labels={{ ...labels, cancelAction: "Fortryd" }}
          description="4711"
        />
      );

      expect(screen.getByRole("button", { name: "Fortryd" })).toBeInTheDocument();
    });
  });

  describe("confirming and cancelling", () => {
    it("clicking confirm calls onConfirm once, and the submit never reaches a consumer's own form", () => {
      const onConfirm = vi.fn();
      const outerSubmit = vi.fn();

      render(
        <form onSubmit={outerSubmit}>
          <Harness onConfirm={onConfirm} />
        </form>
      );
      fireEvent.click(confirmOf());

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(outerSubmit).not.toHaveBeenCalled();
    });

    it("submitting the form directly calls onConfirm once and prevents the default", () => {
      const onConfirm = vi.fn();

      render(<Harness onConfirm={onConfirm}>{field}</Harness>);

      expect(fireEvent.submit(panelOf().querySelector("form") as HTMLFormElement)).toBe(false);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("while confirmDisabled holds, confirm carries the native attribute and a submit never calls onConfirm", () => {
      const onConfirm = vi.fn();

      render(<Harness onConfirm={onConfirm} confirmDisabled />);
      fireEvent.submit(panelOf().querySelector("form") as HTMLFormElement);

      expect(confirmOf()).toBeDisabled();
      expect(cancelOf()).toBeEnabled();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("the cancel button and Escape each call onCancel", () => {
      const onCancel = vi.fn();

      render(<Harness onCancel={onCancel} />);
      fireEvent.click(cancelOf());
      fireEvent.keyDown(document, { key: "Escape" });

      expect(onCancel).toHaveBeenCalledTimes(2);
    });

    it("opening with no control in children focuses the cancel button, never confirm", () => {
      render(<Harness />);

      expect(cancelOf()).toHaveFocus();
    });
  });

  describe("busy", () => {
    it("disables both buttons, ignores Escape and submit, and spins an aria-hidden LoadingIcon after the confirm text", () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(<Harness busy onConfirm={onConfirm} onCancel={onCancel} />);
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.submit(panelOf().querySelector("form") as HTMLFormElement);
      const spinner = confirmOf().querySelector("svg");

      expect(cancelOf()).toBeDisabled();
      expect(confirmOf()).toBeDisabled();
      expect(onCancel).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(confirmOf().lastElementChild).toBe(spinner);
      expect(spinner).toHaveAttribute("aria-hidden", "true");
      expect(spinner).toHaveClass("animate-spin", "h-4", "w-4", "motion-reduce:animate-none");
      expect(panelOf()).not.toHaveAttribute("aria-busy");
    });

    it("without busy, the confirm button holds no spinner", () => {
      render(<Harness />);

      expect(confirmOf().querySelector("svg")).toBeNull();
    });

    it("a polite bowman-sr-only status region sits in the panel empty, fills with confirmBusy while busy and empties when busy clears", () => {
      const { rerender } = render(<Harness />);

      expect(statusOf()).toHaveClass("bowman-sr-only");
      expect(statusOf()).toBeEmptyDOMElement();

      rerender(<Harness busy />);

      expect(statusOf()).toHaveTextContent("Working, please wait");

      rerender(<Harness />);

      expect(statusOf()).toBeEmptyDOMElement();
    });

    it("rendered open and busy, the status region holds the label", () => {
      render(<Harness busy />);

      expect(statusOf()).toHaveTextContent("Working, please wait");
    });

    it("mounted closed and busy then opened, the status region holds the label", () => {
      const { rerender } = render(<Harness open={false} busy />);

      rerender(<Harness busy />);

      expect(statusOf()).toHaveTextContent("Working, please wait");
    });

    it("opened already busy and then closed, focus returns to the opener", () => {
      const { rerender } = render(<Harness open={false} busy />);
      const opener = screen.getByRole("button", { name: "opener" });

      opener.focus();
      rerender(<Harness busy />);

      expect(panelOf()).toHaveFocus();

      rerender(<Harness open={false} busy />);

      expect(opener).toHaveFocus();
    });

    it("setting busy with focus in a field among children leaves focus in the field", () => {
      const { rerender } = render(<Harness>{field}</Harness>);

      expect(screen.getByRole("textbox")).toHaveFocus();
      rerender(<Harness busy>{field}</Harness>);

      expect(screen.getByRole("textbox")).toHaveFocus();
    });

    it("setting busy with focus on the confirm button moves focus to the panel", () => {
      const { rerender } = render(<Harness />);

      confirmOf().focus();
      rerender(<Harness busy />);

      expect(panelOf()).toHaveFocus();
    });

    it("setting busy while document.activeElement is <body> moves focus to the panel", () => {
      const { rerender } = render(<Harness />);

      cancelOf().blur();

      expect(document.body).toHaveFocus();
      rerender(<Harness busy />);

      expect(panelOf()).toHaveFocus();
    });

    it("setting busy while document.activeElement is null moves focus to the panel", () => {
      const { rerender } = render(<Harness />);
      const panelFocus = vi.spyOn(panelOf(), "focus");
      const activeElement = vi.spyOn(document, "activeElement", "get").mockReturnValue(null);

      rerender(<Harness busy />);
      activeElement.mockRestore();

      expect(panelFocus).toHaveBeenCalledTimes(1);
    });

    it("setting busy with focus on a disabled element outside the panel leaves it there", () => {
      const { rerender } = render(<Harness />);
      const opener = screen.getByRole("button", { name: "opener" });

      opener.focus();
      opener.setAttribute("disabled", "");
      rerender(<Harness busy />);

      expect(opener).toHaveFocus();
    });

    it("setting busy while the dialog is closed moves nothing", () => {
      const { rerender } = render(<Harness open={false} />);
      const opener = screen.getByRole("button", { name: "opener" });

      opener.focus();
      rerender(<Harness open={false} busy />);

      expect(opener).toHaveFocus();
    });

    it("clearing busy moves nothing, leaving focus on the panel", () => {
      const { rerender } = render(<Harness />);

      confirmOf().focus();
      rerender(<Harness busy />);
      rerender(<Harness />);

      expect(panelOf()).toHaveFocus();
    });
  });
});
