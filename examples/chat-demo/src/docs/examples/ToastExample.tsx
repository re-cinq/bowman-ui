import { useState } from "react";
import { Toast } from "@re-cinq/bowman-ui";

export function ToastExample() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        onClick={() => setMessage("The reply was copied to the clipboard.")}
      >
        Show a notification
      </button>
      {message !== null && (
        <Toast
          message={message}
          duration={4000}
          onClose={() => setMessage(null)}
        />
      )}
    </>
  );
}
