"use client";

import type { ReactElement, ReactNode, RefObject } from "react";
import { resolveLabels } from "../labels.js";
import { ModalPanel } from "./ModalPanel.js";

export interface DialogLabels {
  /** The dialog's heading and its accessible name. */
  dialogTitle: string;
  /** The close button's accessible name. */
  closeDialog: string;
}

export const defaultDialogLabels: Readonly<Required<Pick<DialogLabels, "closeDialog">>> =
  Object.freeze({
    closeDialog: "Close",
  });

export interface DialogProps {
  open: boolean;
  /** Called on Escape and on the close button. */
  onClose: () => void;
  labels: Partial<DialogLabels> & Required<Pick<DialogLabels, "dialogTitle">>;
  children: ReactNode;
  /** Actions, rendered after the body. */
  footer?: ReactNode;
  /** Where focus returns on close; default the element that held focus before opening. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** The portal's target, such as a themed wrapper; default `document.body`. */
  container?: Element | null;
}

export function Dialog({
  open,
  onClose,
  labels,
  children,
  footer,
  returnFocusRef,
  container,
}: DialogProps): ReactElement | null {
  const resolved = resolveLabels(defaultDialogLabels, labels);

  return (
    <ModalPanel
      open={open}
      onClose={onClose}
      role="dialog"
      title={labels.dialogTitle}
      footer={footer}
      closeLabel={resolved.closeDialog}
      returnFocusRef={returnFocusRef}
      container={container}
    >
      {children}
    </ModalPanel>
  );
}
