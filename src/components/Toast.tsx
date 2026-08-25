"use client";

import { useEffect, useRef } from "react";

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
export function Toast({ message, onClose, duration = 2000 }: ToastProps) {
  const onCloseRef = useRef(onClose);

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
    <div
      role="status"
      aria-live="polite"
      className="bowman-toast-fade-in fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
    >
      {message}
    </div>
  );
}
