"use client";

import {
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { LoadingIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import { Button } from "./Button.js";
import { buttonIconClassNames } from "./buttonStyles.js";
import { ModalPanel } from "./ModalPanel.js";

export interface ConfirmDialogLabels {
  dialogTitle: string;
  /** The confirm button's text - the action, never "OK". */
  confirmAction: string;
  cancelAction: string;
  /** Announced politely while busy; the action is in progress and the dialog waits for it. */
  confirmBusy: string;
}

export const defaultConfirmDialogLabels: Readonly<
  Required<Pick<ConfirmDialogLabels, "cancelAction" | "confirmBusy">>
> = Object.freeze({
  cancelAction: "Cancel",
  confirmBusy: "Working, please wait",
});

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  labels: Partial<ConfirmDialogLabels> &
    Required<Pick<ConfirmDialogLabels, "dialogTitle" | "confirmAction">>;
  /** What confirming does - consumer content, read as the dialog's description. */
  description: ReactNode;
  /** Any fields the confirmation needs, after the description. */
  children?: ReactNode;
  confirmDisabled?: boolean;
  busy?: boolean;
  /** As on `Dialog`. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** As on `Dialog`. */
  container?: Element | null;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  labels,
  description,
  children,
  confirmDisabled = false,
  busy = false,
  returnFocusRef,
  container,
}: ConfirmDialogProps): ReactElement | null {
  const resolved = resolveLabels(defaultConfirmDialogLabels, labels);
  const descriptionId = useId();
  const [statusNode, setStatusNode] = useState<HTMLSpanElement | null>(null);

  // The live region mounts empty and receives its text after the commit, so a screen reader hears it.
  useEffect(() => {
    if (statusNode) {
      statusNode.textContent = busy ? resolved.confirmBusy : "";
    }
  }, [busy, resolved.confirmBusy, statusNode]);

  const cancelUnlessBusy = () => {
    if (!busy) {
      onCancel();
    }
  };

  const confirmUnlessHeld = () => {
    if (!confirmDisabled && !busy) {
      onConfirm();
    }
  };

  return (
    <ModalPanel
      open={open}
      onClose={cancelUnlessBusy}
      role="alertdialog"
      title={labels.dialogTitle}
      describedBy={descriptionId}
      onSubmit={confirmUnlessHeld}
      busy={busy}
      returnFocusRef={returnFocusRef}
      container={container}
      footer={
        <>
          <span ref={setStatusNode} role="status" className="bowman-sr-only" />
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            {resolved.cancelAction}
          </Button>
          <Button variant="danger" type="submit" disabled={confirmDisabled || busy}>
            {labels.confirmAction}
            {busy && (
              <LoadingIcon
                ariaLabel=""
                className={`${buttonIconClassNames.md} motion-reduce:animate-none`}
              />
            )}
          </Button>
        </>
      }
    >
      <div id={descriptionId}>{description}</div>
      {children}
    </ModalPanel>
  );
}
