"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { getFocusableElements } from "../hooks/focusableSelector.js";
import { useFocusTrap } from "../hooks/useFocusTrap.js";
import { CloseIcon } from "../icons/index.js";
import { BORDER, SURFACE, TEXT_BODY, TEXT_STRONG } from "../theme/tokens.js";
import { FOCUS_VISIBLE_RING } from "../theme/focusRing.js";
import { IconButton } from "./IconButton.js";

export interface ModalPanelProps {
  open: boolean;
  /** Called on Escape. */
  onClose: () => void;
  role: "dialog" | "alertdialog";
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** When given, the close button renders, named by it, and calls onClose. */
  closeLabel?: string;
  /** The id of the element holding the panel's description. */
  describedBy?: string;
  /** When given, the body and footer render as one form whose submit calls it. */
  onSubmit?: () => void;
  busy?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  container?: Element | null;
}

const subscribeNothing = (): (() => void) => () => {};

const scrollTabStopAttributes = ["tabindex", "role", "aria-labelledby"];

// An overflowing body with nothing focusable in it becomes a named, focusable region (WCAG 2.1.1).
const needsScrollTabStop = (body: HTMLElement): boolean =>
  body.scrollHeight > body.clientHeight && getFocusableElements(body).length === 0;

const addScrollTabStop = (body: HTMLElement, titleId: string) => {
  body.setAttribute("tabindex", "0");
  body.setAttribute("role", "region");
  body.setAttribute("aria-labelledby", titleId);
};

// Focus leaves the body for the panel first, so the browser's fixup never drops it to <body>.
const removeScrollTabStop = (body: HTMLElement, panel: HTMLElement) => {
  if (document.activeElement === body) {
    panel.focus();
  }

  for (const attribute of scrollTabStopAttributes) {
    body.removeAttribute(attribute);
  }
};

const ringClassNames = `ring-offset-2 ${FOCUS_VISIBLE_RING}`;

// Busy focus moves only off a button it disabled, or off nothing, so a field that held focus keeps it.
const focusWasLostIn = (panel: HTMLElement): boolean => {
  const active = document.activeElement;

  return (
    active === null ||
    active === document.body ||
    (panel.contains(active) && active.matches(":disabled"))
  );
};

export function ModalPanel({
  open,
  onClose,
  role,
  title,
  children,
  footer,
  closeLabel,
  describedBy,
  onSubmit,
  busy = false,
  returnFocusRef,
  container,
}: ModalPanelProps) {
  const isClient = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
  const portalOpen = open && isClient;
  const panelRef = useFocusTrap<HTMLDivElement>(portalOpen, onClose, returnFocusRef);
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousBusy = useRef(false);
  const titleId = useId();

  useLayoutEffect(() => {
    if (!portalOpen) {
      return undefined;
    }
    const panel = panelRef.current as HTMLDivElement;
    const body = bodyRef.current as HTMLDivElement;

    const updateScrollTabStop = () =>
      needsScrollTabStop(body) ? addScrollTabStop(body, titleId) : removeScrollTabStop(body, panel);

    updateScrollTabStop();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver(updateScrollTabStop);

    observer.observe(body);
    observer.observe(contentRef.current as HTMLDivElement);

    return () => observer.disconnect();
  }, [panelRef, portalOpen, titleId]);

  useLayoutEffect(() => {
    const turnedBusy = busy && !previousBusy.current;

    previousBusy.current = busy;

    if (!portalOpen || !turnedBusy) {
      return;
    }
    const panel = panelRef.current as HTMLDivElement;

    if (focusWasLostIn(panel)) {
      panel.focus();
    }
  }, [busy, panelRef, portalOpen]);

  if (!portalOpen) {
    return null;
  }

  const content = (
    <>
      <div
        ref={bodyRef}
        className={`mt-3 min-h-0 flex-1 overflow-y-auto rounded-md p-1 ${ringClassNames}`}
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {footer && <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div>}
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={`relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-xl border p-5 ${BORDER} ${SURFACE} ${TEXT_BODY} ${ringClassNames}`}
      >
        <h2
          id={titleId}
          className={`text-base font-semibold ${TEXT_STRONG}${closeLabel ? " pr-10" : ""}`}
        >
          {title}
        </h2>
        {onSubmit ? (
          <form
            noValidate
            className="flex min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSubmit();
            }}
          >
            {content}
          </form>
        ) : (
          content
        )}
        {closeLabel && (
          <div className="absolute right-3 top-3">
            <IconButton
              icon={CloseIcon}
              variant="ghost"
              labels={{ accessibleName: closeLabel }}
              onClick={onClose}
            />
          </div>
        )}
      </div>
    </div>,
    container ?? document.body
  );
}
