"use client";

import { useEffect, useRef, useState } from "react";

export interface ToastProps {
  message: string;
  onClose: () => void;
  /** Milliseconds until auto-dismiss. `null` disables auto-dismiss entirely. */
  duration?: number | null;
}

// The transient notification surface extracted for E4's escalation and
// failover paths. The source component keyed its timeout effect on
// [onClose, duration], so any parent re-render with a fresh onClose identity
// restarted the countdown; here the latest onClose lives in a ref and the
// timeout is keyed on [message, duration] - a new message restarts the
// countdown, a new callback identity does not.

// Hides the status region with inline styles so the package needs no
// stylesheet or Tailwind config from the consumer.
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  const onCloseRef = useRef(onClose);
  // A live region inserted into the DOM already holding its text is
  // unreliably announced. The visible pill shows the message immediately;
  // the separate hidden status region renders empty on the first commit and
  // receives the message in the mount effect, once the region exists.
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    setAnnounced(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (duration === null) {
      return;
    }
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  return (
    <>
      <div
        aria-hidden="true"
        className="bowman-toast-fade-in fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
      >
        {message}
      </div>
      <div role="status" aria-live="polite" style={visuallyHidden}>
        {announced ? message : null}
      </div>
    </>
  );
}
