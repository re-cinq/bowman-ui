// The pages of the six form, dialog and notice components (issue 415). The chat-demo's axe run
// scans only the [data-doc-variant] figures, so every state it covers is a figure of its own, the
// default one included. Each dialog state opens from its own trigger and is modal, so at most one
// dialog is open at a time.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  IconButton,
  KeyValueList,
  Notice,
  TextField,
  TrashIcon,
  defaultConfirmDialogLabels,
  defaultDialogLabels,
  defaultNoticeLabels,
} from "@re-cinq/bowman-ui";
import type { ConfirmDialogProps, KeyValuePair, TextFieldProps } from "@re-cinq/bowman-ui";
import { customTheme } from "../themes";
import type { ComponentDoc } from "./componentDocs";
import { CardExample } from "./examples/CardExample";
import cardSource from "./examples/CardExample.tsx?raw";
import { ConfirmDialogExample } from "./examples/ConfirmDialogExample";
import confirmDialogSource from "./examples/ConfirmDialogExample.tsx?raw";
import { DialogExample } from "./examples/DialogExample";
import dialogSource from "./examples/DialogExample.tsx?raw";
import { KeyValueListExample } from "./examples/KeyValueListExample";
import keyValueListSource from "./examples/KeyValueListExample.tsx?raw";
import { NoticeExample } from "./examples/NoticeExample";
import noticeSource from "./examples/NoticeExample.tsx?raw";
import { TextFieldExample } from "./examples/TextFieldExample";
import textFieldSource from "./examples/TextFieldExample.tsx?raw";
import {
  cardPropDocs,
  confirmDialogPropDocs,
  dialogPropDocs,
  keyValueListPropDocs,
  noticePropDocs,
  textFieldPropDocs,
} from "./propDocs";

/** How long the busy variants' invented action runs before it finishes. */
export const busyDurationMs = 5000;

const ignore = () => {};

const noteClassName = "text-sm text-slate-600 dark:text-slate-400";

const orderReference = "MB-4821-XQ";

function ControlledField({
  initialValue = "",
  ...props
}: Omit<TextFieldProps, "value" | "onChange"> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return <TextField {...props} value={value} onChange={setValue} />;
}

// A trigger, an optional line reporting what the dialog did, and the dialog it opens.
function Opener({
  trigger,
  note,
  disabled = false,
  render,
}: {
  trigger: string;
  note?: string;
  disabled?: boolean;
  render: (open: boolean, close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button variant="secondary" disabled={disabled} onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      {note !== undefined && <p className={noteClassName}>{note}</p>}
      {render(open, () => setOpen(false))}
    </div>
  );
}

// A page-local theme wrapper kept in state through a callback ref: a dialog portals into it only
// once it is set, so the wrapper's --bowman-* values reach the panel.
function ThemeWrapper({ children }: { children: (wrapper: HTMLDivElement | null) => ReactNode }) {
  const [wrapper, setWrapper] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setWrapper} data-theme-wrapper className={customTheme.className}>
      {children(wrapper)}
    </div>
  );
}

const termsClauses = Array.from(
  { length: 16 },
  (_, index) =>
    `Clause ${index + 1}. An invented returns term: a copy that arrives damaged is replaced or refunded, at the customer's choice, within thirty days of delivery, and the original packaging is not required for the return.`
);

function FooterSaveDialog() {
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");

  return (
    <Opener
      trigger="Edit the gift note"
      note={`Saved note: ${saved || "none"}`}
      render={(open, close) => (
        <Dialog
          open={open}
          onClose={close}
          labels={{ dialogTitle: "Gift note" }}
          footer={
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSaved(draft);
                  close();
                }}
              >
                Save the note
              </Button>
            </>
          }
        >
          <TextField
            value={draft}
            onChange={setDraft}
            labels={{ fieldLabel: "Note", fieldHint: "Printed on the packing slip." }}
          />
        </Dialog>
      )}
    />
  );
}

function FormInBodyDialog() {
  const [title, setTitle] = useState("Delivery change");
  const [renamed, setRenamed] = useState(title);

  return (
    <Opener
      trigger="Rename the conversation"
      note={`Title: ${renamed}`}
      render={(open, close) => (
        <Dialog open={open} onClose={close} labels={{ dialogTitle: "Rename the conversation" }}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setRenamed(title);
              close();
            }}
          >
            <TextField value={title} onChange={setTitle} labels={{ fieldLabel: "Title" }} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                Keep the title
              </Button>
              <Button variant="primary" type="submit">
                Rename
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    />
  );
}

function ThemedDialog() {
  return (
    <ThemeWrapper>
      {(wrapper) => (
        <Opener
          trigger="Open the themed dialog"
          disabled={wrapper === null}
          render={(open, close) => (
            <Dialog
              open={open}
              onClose={close}
              container={wrapper}
              labels={{ dialogTitle: "Copperline Bicycles" }}
            >
              <p>This panel portals into the themed wrapper, so it takes the wrapper's colours.</p>
            </Dialog>
          )}
        />
      )}
    </ThemeWrapper>
  );
}

type PendingAction = "confirm" | "earlier" | null;

interface ConfirmDemoProps {
  trigger: string;
  labels: ConfirmDialogProps["labels"];
  description: ReactNode;
  children?: ReactNode;
  confirmDisabled?: boolean;
  /** Confirming starts a slow invented action: busy until it finishes, then the dialog closes. */
  slow?: boolean;
  /** Opens while an earlier action still runs: busy until it finishes, then the buttons enable. */
  opensBusy?: boolean;
  container?: Element | null;
  triggerDisabled?: boolean;
}

function ConfirmDemo({
  trigger,
  labels,
  description,
  children,
  confirmDisabled,
  slow = false,
  opensBusy = false,
  container,
  triggerDisabled = false,
}: ConfirmDemoProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    if (pending === null) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setPending(null);

      if (pending === "confirm") {
        setOpen(false);
        setConfirmations((count) => count + 1);
      }
    }, busyDurationMs);

    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        disabled={triggerDisabled}
        onClick={() => {
          setOpen(true);
          setPending(opensBusy ? "earlier" : null);
        }}
      >
        {trigger}
      </Button>
      <p className={noteClassName} data-confirmations={confirmations}>
        Confirmations: {confirmations}
      </p>
      <ConfirmDialog
        open={open}
        busy={pending !== null}
        confirmDisabled={confirmDisabled}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          if (slow) {
            setPending("confirm");

            return;
          }
          setOpen(false);
          setConfirmations((count) => count + 1);
        }}
        labels={labels}
        description={description}
        container={container}
      >
        {children && <div className="mt-3">{children}</div>}
      </ConfirmDialog>
    </div>
  );
}

const deleteDraftLabels = { dialogTitle: "Delete the draft?", confirmAction: "Delete the draft" };

const deleteDraftDescription = (
  <p>The draft reply to {orderReference} is removed and cannot be restored.</p>
);

const cancelOrderLabels = {
  dialogTitle: `Cancel order ${orderReference}?`,
  confirmAction: "Cancel the order",
  cancelAction: "Keep the order",
};

const cancelOrderDescription = (
  <p>The order is cancelled and the payment refunded within five working days.</p>
);

function ReasonConfirm() {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDemo
      trigger="Cancel an order, with a reason"
      labels={cancelOrderLabels}
      description={cancelOrderDescription}
    >
      <TextField value={reason} onChange={setReason} labels={{ fieldLabel: "Reason (optional)" }} />
    </ConfirmDemo>
  );
}

function TypedConfirm() {
  const [typed, setTyped] = useState("");

  return (
    <ConfirmDemo
      trigger="Cancel an order, typing its reference"
      labels={cancelOrderLabels}
      description={cancelOrderDescription}
      confirmDisabled={typed !== orderReference}
    >
      <TextField
        value={typed}
        onChange={setTyped}
        autoComplete="off"
        spellCheck={false}
        labels={{ fieldLabel: "Order reference", fieldHint: `Type ${orderReference} to confirm.` }}
      />
    </ConfirmDemo>
  );
}

function ThemedConfirm() {
  return (
    <ThemeWrapper>
      {(wrapper) => (
        <ConfirmDemo
          trigger="Open the themed confirmation"
          triggerDisabled={wrapper === null}
          container={wrapper}
          labels={deleteDraftLabels}
          description={deleteDraftDescription}
        />
      )}
    </ThemeWrapper>
  );
}

function DismissibleNotice() {
  const [shown, setShown] = useState(true);
  const restoreRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col gap-3">
      {shown && (
        <Notice
          tone="success"
          heading="Draft saved"
          onDismiss={() => {
            // The dismiss button leaves with the notice, so focus moves first to a control that stays.
            restoreRef.current?.focus();
            setShown(false);
          }}
        >
          The reply to {orderReference} is saved as a draft.
        </Notice>
      )}
      <div>
        <Button ref={restoreRef} variant="secondary" onClick={() => setShown(true)}>
          Show the notice again
        </Button>
      </div>
    </div>
  );
}

const orderPairs: readonly KeyValuePair[] = [
  { key: "order", label: "Order", value: orderReference },
  { key: "title", label: "Title", value: "The Cartographer's Atlas" },
  { key: "status", label: "Status", value: "Shipped" },
  { key: "arrives", label: "Arrives", value: "Friday by 12:00" },
];

export const formDialogNoticeDocs: ReadonlyArray<ComponentDoc> = [
  {
    id: "text-field",
    name: "TextField",
    purpose:
      "A labelled single-line text input: a visible label that is also the input's accessible name, an optional hint under it and an optional error under that, both tied to the input through aria-describedby. A non-empty fieldError is the invalid state - there is no separate invalid prop - and its text sits in a polite live region that exists from the first render, so an error added later is announced. Validation stays yours: the field shows the error it is handed. required sets the native attribute and adds no visible marker, because a hard-coded asterisk would be an English string outside the labels; put the marker in fieldLabel, as the required state below does. The input is controlled and reports the raw value, and its border reads the muted text role so the control's edge clears the 3:1 non-text contrast minimum.",
    importLine: 'import { TextField } from "@re-cinq/bowman-ui";',
    Example: TextFieldExample,
    exampleSource: textFieldSource,
    props: textFieldPropDocs,
    labels: { defaults: {}, missing: ["fieldLabel"] },
    variants: [
      {
        id: "default",
        caption: "Default: a label and an empty input",
        node: <ControlledField labels={{ fieldLabel: "Full name" }} autoComplete="name" />,
      },
      {
        id: "required",
        caption: "required: the marker lives in fieldLabel, the attribute on the input",
        node: (
          <ControlledField
            type="email"
            required
            autoComplete="email"
            labels={{ fieldLabel: "Email address (required)" }}
          />
        ),
      },
      {
        id: "hint",
        caption: "fieldHint: help text, named by aria-describedby",
        node: (
          <ControlledField
            type="tel"
            autoComplete="tel"
            labels={{
              fieldLabel: "Phone number",
              fieldHint: "The courier calls this number on the day.",
            }}
          />
        ),
      },
      {
        id: "error",
        caption: "fieldError: aria-invalid, the danger border and the announced message",
        node: (
          <ControlledField
            type="email"
            initialValue="mara.example.invalid"
            labels={{
              fieldLabel: "Email address",
              fieldHint: "We send the delivery updates here.",
              fieldError: "Enter an address like name@example.com.",
            }}
          />
        ),
      },
      {
        id: "disabled",
        caption: "disabled: dimmed and inert",
        node: (
          <ControlledField
            disabled
            initialValue={orderReference}
            labels={{ fieldLabel: "Order reference" }}
          />
        ),
      },
    ],
  },
  {
    id: "dialog",
    name: "Dialog",
    purpose:
      "A modal dialog: a panel portalled over a dim overlay, named by its heading, with a close button, Escape to close, Tab trapped inside and focus returned on close to the element that opened it, or to returnFocusRef. Opening focuses the first control in the body, else the body itself when it overflows with nothing focusable in it, else the first control in the footer, else the close button; a click on the overlay does nothing. Open one modal at a time: AppShell's mobile drawer is itself a modal, so close the drawer before opening a dialog from it. A footer button cannot submit a form in the body, so a form dialog either saves from the footer button's own onClick, keeping the footer in view, or puts the form and its buttons in the body, so Enter submits but the buttons scroll with it; both are shown below. A theme set on a wrapper reaches the panel only when the dialog portals into it: keep the wrapper in state through a callback ref, pass it as container, and open the dialog once it is set.",
    importLine: 'import { Dialog } from "@re-cinq/bowman-ui";',
    Example: DialogExample,
    exampleSource: dialogSource,
    props: dialogPropDocs,
    labels: { defaults: defaultDialogLabels, missing: ["dialogTitle"] },
    variants: [
      {
        id: "default",
        caption: "Default: a short prose body, which takes no tab stop",
        node: (
          <Opener
            trigger="Open the delivery note"
            render={(open, close) => (
              <Dialog open={open} onClose={close} labels={{ dialogTitle: "About delivery" }}>
                <p>Orders placed before 14:00 leave the warehouse the same working day.</p>
              </Dialog>
            )}
          />
        ),
      },
      {
        id: "overflowing",
        caption: "A body that overflows: it scrolls, and with nothing focusable in it, takes focus",
        node: (
          <Opener
            trigger="Open the returns terms"
            render={(open, close) => (
              <Dialog open={open} onClose={close} labels={{ dialogTitle: "Returns terms" }}>
                <div className="flex flex-col gap-3">
                  {termsClauses.map((clause) => (
                    <p key={clause}>{clause}</p>
                  ))}
                </div>
              </Dialog>
            )}
          />
        ),
      },
      {
        id: "footer-save",
        caption: "A form saved from the footer: the save button's onClick, the footer in view",
        node: <FooterSaveDialog />,
      },
      {
        id: "form-in-body",
        caption: "The form and its buttons in the body: Enter in the field submits",
        node: <FormInBodyDialog />,
      },
      {
        id: "container",
        caption: "container: portalled into a themed wrapper held through a callback ref",
        node: <ThemedDialog />,
      },
    ],
  },
  {
    id: "confirm-dialog",
    name: "ConfirmDialog",
    purpose:
      "A confirmation before an action that destroys something: an alert dialog whose description says what confirming does, a cancel button and a danger confirm button, and no close button. Its body and footer are one form, so Enter in a field among its children confirms, never while confirmDisabled or busy holds. Opening focuses the first field, else the cancel button, never the confirm button; Escape and the cancel button call onCancel. While busy, both buttons are disabled, Escape does nothing, a spinner sits beside the action and a status message announces the wait, and focus that sat on a button busy disabled moves to the panel. The danger variant of Button and IconButton is shown here too, on its own: the one solid red action on a screen.",
    importLine: 'import { ConfirmDialog } from "@re-cinq/bowman-ui";',
    Example: ConfirmDialogExample,
    exampleSource: confirmDialogSource,
    props: confirmDialogPropDocs,
    labels: {
      defaults: defaultConfirmDialogLabels,
      missing: ["dialogTitle", "confirmAction"],
    },
    variants: [
      {
        id: "default",
        caption: "Default: a bare confirmation, which opens on the cancel button",
        node: (
          <ConfirmDemo
            trigger="Delete the draft"
            labels={deleteDraftLabels}
            description={deleteDraftDescription}
          />
        ),
      },
      {
        id: "busy",
        caption: `busy: confirming runs a slow invented action for ${busyDurationMs / 1000} seconds`,
        node: (
          <ConfirmDemo
            trigger="Delete the draft, slowly"
            slow
            labels={deleteDraftLabels}
            description={deleteDraftDescription}
          />
        ),
      },
      {
        id: "opened-busy",
        caption: "Opened already busy: an earlier action is still running, then the buttons enable",
        node: (
          <ConfirmDemo
            trigger="Delete the draft while a save runs"
            opensBusy
            labels={deleteDraftLabels}
            description={deleteDraftDescription}
          />
        ),
      },
      {
        id: "with-field",
        caption: "A TextField among the children: it takes initial focus, and Enter confirms",
        node: <ReasonConfirm />,
      },
      {
        id: "confirm-disabled",
        caption: "confirmDisabled until the typed reference matches: Enter does not confirm",
        node: <TypedConfirm />,
      },
      {
        id: "danger-button",
        caption: "The danger Button on its own, at rest; hovered, it darkens",
        node: (
          <Button variant="danger" onClick={ignore}>
            Delete the conversation
          </Button>
        ),
      },
      {
        id: "danger-button-disabled",
        caption: "The danger Button, disabled",
        node: (
          <Button variant="danger" disabled>
            Delete the conversation
          </Button>
        ),
      },
      {
        id: "danger-icon-button",
        caption: "The danger IconButton, at rest; hovered, it darkens",
        node: (
          <IconButton
            variant="danger"
            icon={TrashIcon}
            onClick={ignore}
            labels={{ accessibleName: "Delete the conversation" }}
          />
        ),
      },
      {
        id: "danger-icon-button-disabled",
        caption: "The danger IconButton, disabled",
        node: (
          <IconButton
            variant="danger"
            icon={TrashIcon}
            disabled
            labels={{ accessibleName: "Delete the conversation" }}
          />
        ),
      },
      {
        id: "themed",
        caption: "Inside a themed wrapper, portalled into it through container",
        node: <ThemedConfirm />,
      },
    ],
  },
  {
    id: "notice",
    name: "Notice",
    purpose:
      'An inline notice that states a condition for as long as you render it: a tone icon and a 4px left border in the tone\'s colour, an optional bold heading and the text, on the ordinary surface. info and success render with role="status"; warning and error with role="alert", which some screen readers announce on every load, so a condition the page shows from its first render and that asks nothing of the user is an info notice, not a warning. With onDismiss a dismiss button renders; the notice keeps no open state, so you stop rendering it, and since its button leaves with it, move focus to a control that stays before you do, as the dismissible state below does. It has no timer: an outcome that must be announced and then go belongs in a Toast.',
    importLine: 'import { Notice } from "@re-cinq/bowman-ui";',
    Example: NoticeExample,
    exampleSource: noticeSource,
    props: noticePropDocs,
    labels: { defaults: defaultNoticeLabels, missing: [] },
    variants: [
      {
        id: "default",
        caption: 'Default: an info notice, role="status", with no heading',
        node: <Notice tone="info">Gift wrapping is free on every first edition this month.</Notice>,
      },
      {
        id: "success",
        caption: 'success: role="status"',
        node: (
          <Notice tone="success" heading="Refund sent">
            The refund for {orderReference} reaches the card within five working days.
          </Notice>
        ),
      },
      {
        id: "warning",
        caption: 'warning: role="alert", for a condition that asks the reader to act',
        node: (
          <Notice tone="warning" heading="Address incomplete">
            Add a house number before the courier collects the parcel on Thursday.
          </Notice>
        ),
      },
      {
        id: "error",
        caption: 'error: role="alert"',
        node: (
          <Notice tone="error" heading="Payment declined">
            The card was declined. Choose another payment method to keep the order.
          </Notice>
        ),
      },
      {
        id: "dismissible",
        caption: "onDismiss: focus moves to a control that stays before the notice goes",
        node: <DismissibleNotice />,
      },
      {
        id: "themed",
        caption: "Inside a themed wrapper",
        node: (
          <div className={`${customTheme.className} flex flex-col gap-3`}>
            <Notice tone="info" heading="Workshop hours">
              The Copperline workshop opens at 08:00 on weekdays.
            </Notice>
            <Notice tone="warning" heading="Recall">
              Bring the rear brake in for a free inspection before riding again.
            </Notice>
          </div>
        ),
      },
    ],
  },
  {
    id: "key-value-list",
    name: "KeyValueList",
    purpose:
      "A description list of labelled values, such as an order's details or an account's settings: one dl with a dt and a dd per pair, in order, keyed by each pair's key. layout changes only the classes, never the structure - inline puts the label at a third of the width beside its value, stacked puts the value under the label. It paints no background and sits on the surface of whatever holds it, such as a static Card or a Dialog panel. It takes no handler and calls no hook, so it renders in a server component.",
    importLine: 'import { KeyValueList } from "@re-cinq/bowman-ui";',
    Example: KeyValueListExample,
    exampleSource: keyValueListSource,
    props: keyValueListPropDocs,
    variants: [
      {
        id: "default",
        caption: "Default: inline, label and value side by side",
        node: <KeyValueList pairs={orderPairs} />,
      },
      {
        id: "stacked",
        caption: 'layout="stacked": the value under its label',
        node: <KeyValueList pairs={orderPairs} layout="stacked" />,
      },
      {
        id: "in-card",
        caption: "Inside a static Card, which supplies the surface",
        node: (
          <Card heading={`Order ${orderReference}`}>
            <KeyValueList pairs={orderPairs} />
          </Card>
        ),
      },
    ],
  },
  {
    id: "card",
    name: "Card",
    purpose:
      "A bordered surface for one piece of content, static or selectable. Without onSelect it is a plain div with its heading as an h3, so a page of cards adds no landmarks and keeps its outline. With onSelect the whole card is one button with the shared focus ring and a hover surface, named by its heading and described by its body, so a screen reader hears a short name and then the rest; its content must then be phrasing content only, with no paragraph, no list and nothing interactive. disabled applies only to a selectable card.",
    importLine: 'import { Card } from "@re-cinq/bowman-ui";',
    Example: CardExample,
    exampleSource: cardSource,
    props: cardPropDocs,
    variants: [
      {
        id: "default",
        caption: "Default: static, its heading an h3",
        node: <Card heading="Standard delivery">Three to five working days, free.</Card>,
      },
      {
        id: "no-heading",
        caption: "Static, with no heading",
        node: <Card>Every order ships in recycled packaging.</Card>,
      },
      {
        id: "selectable",
        caption: "onSelect: one button, named by its heading and described by its body",
        node: (
          <Card heading="Express delivery" onSelect={ignore}>
            Next working day, 6.50.
          </Card>
        ),
      },
      {
        id: "selectable-disabled",
        caption: "Selectable and disabled",
        node: (
          <Card heading="Same-day courier" onSelect={ignore} disabled>
            Not available for this address.
          </Card>
        ),
      },
    ],
  },
];
