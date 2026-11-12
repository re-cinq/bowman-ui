/**
 * Dialog (specs/bowman-ui-form-dialog-notice/spec.md § Dialog): a portalled
 * role="dialog" panel on useFocusTrap with a close button last in DOM order.
 * The contract it shares with ConfirmDialog lives in
 * tests/helpers/modal-panel-contract.tsx.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { Button, Dialog, defaultDialogLabels } from "../src/index.js";
import { stubFocusEnvironment } from "./helpers/focus-environment.js";
import { describeModalPanelContract } from "./helpers/modal-panel-contract.js";

const title = "Indstillinger 4711";

describe("Dialog", () => {
  stubFocusEnvironment();

  describeModalPanelContract({
    role: "dialog",
    title,
    renderModal: ({ open, onEscape, children, returnFocusRef, container }) => (
      <Dialog
        open={open}
        onClose={onEscape}
        labels={{ dialogTitle: title }}
        returnFocusRef={returnFocusRef}
        container={container}
      >
        {children}
      </Dialog>
    ),
  });

  it('defaultDialogLabels is frozen and equals { closeDialog: "Close" }', () => {
    expect(Object.isFrozen(defaultDialogLabels)).toBe(true);
    expect(defaultDialogLabels).toEqual({ closeDialog: "Close" });
  });

  it('renders role="dialog" with no aria-describedby, and the <h2> holds labels.dialogTitle', () => {
    render(
      <Dialog open onClose={vi.fn()} labels={{ dialogTitle: title }}>
        4711
      </Dialog>
    );

    expect(screen.getByRole("dialog", { name: title })).not.toHaveAttribute("aria-describedby");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(title);
  });

  it('the close button is a ghost IconButton named "Close", last in DOM order, and calls onClose', () => {
    const onClose = vi.fn();

    render(
      <Dialog open onClose={onClose} labels={{ dialogTitle: title }} footer={<span>4712</span>}>
        4711
      </Dialog>
    );
    const panel = screen.getByRole("dialog");
    const close = screen.getByRole("button", { name: "Close" });

    expect(panel.querySelectorAll("button")[0]).toBe(close);
    expect(panel.lastElementChild).toContainElement(close);
    expect(close.parentElement).toHaveClass("absolute");
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("pr-10");

    fireEvent.click(close);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('labels={{ closeDialog: "Luk" }} names the close button', () => {
    render(
      <Dialog open onClose={vi.fn()} labels={{ dialogTitle: title, closeDialog: "Luk" }}>
        4711
      </Dialog>
    );

    expect(screen.getByRole("button", { name: "Luk" })).toBeInTheDocument();
  });

  it("with nothing focusable in children or footer, opening focuses the close button", () => {
    render(
      <Dialog open onClose={vi.fn()} labels={{ dialogTitle: title }}>
        4711
      </Dialog>
    );

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("with no control in children, opening focuses the first control in footer, not the close button", () => {
    render(
      <Dialog
        open
        onClose={vi.fn()}
        labels={{ dialogTitle: title }}
        footer={<Button variant="primary">Gem 4711</Button>}
      >
        4711
      </Dialog>
    );

    expect(screen.getByRole("button", { name: "Gem 4711" })).toHaveFocus();
  });

  it("footer renders after children in a right-aligned row", () => {
    render(
      <Dialog
        open
        onClose={vi.fn()}
        labels={{ dialogTitle: title }}
        footer={<span data-testid="footer">4712</span>}
      >
        <span data-testid="body">4711</span>
      </Dialog>
    );
    const footerRow = screen.getByTestId("footer").parentElement;

    expect(footerRow).toHaveClass("flex", "justify-end");
    expect(
      screen.getByTestId("body").compareDocumentPosition(screen.getByTestId("footer")) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("without footer, no footer row renders and no form wraps the body", () => {
    render(
      <Dialog open onClose={vi.fn()} labels={{ dialogTitle: title }}>
        4711
      </Dialog>
    );
    const panel = screen.getByRole("dialog");

    expect(panel.querySelector(".justify-end")).toBeNull();
    expect(panel.querySelector("form")).toBeNull();
  });
});
