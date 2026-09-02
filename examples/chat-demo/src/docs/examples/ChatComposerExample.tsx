import { useRef, useState } from "react";
import { ChatComposer } from "@re-cinq/bowman-ui";
import type { ChatComposerHandle } from "@re-cinq/bowman-ui";

export function ChatComposerExample() {
  const composerRef = useRef<ChatComposerHandle>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <ChatComposer
        ref={composerRef}
        onSubmit={(text) => setLastSent(text)}
        labels={{ composerPlaceholder: "Ask about an order..." }}
      />
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Last sent: {lastSent ?? "nothing"}
      </p>
      <button
        type="button"
        className="self-start rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
        onClick={() => composerRef.current?.setValue("Move my delivery to Friday")}
      >
        Fill the draft from outside
      </button>
    </div>
  );
}
