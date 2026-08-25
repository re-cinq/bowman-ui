"use client";

import { resolveLabels } from "../labels.js";

export interface InlineThinkingIndicatorLabels {
  thinking: string;
}

export const defaultInlineThinkingIndicatorLabels: Readonly<
  Required<InlineThinkingIndicatorLabels>
> = Object.freeze({
  thinking: "Thinking",
});

export interface InlineThinkingIndicatorProps {
  /** Overrides the indicator's strings; English defaults apply per key. */
  labels?: Partial<InlineThinkingIndicatorLabels>;
}

// The streaming placeholder shown inside a message before any content has
// arrived, lifted from the source app's ThinkingIndicator.tsx:44-64. The
// block form (ThinkingIndicator itself) stays behind for its own extraction
// issue; this one moves here because its only call site is ChatMessage.
export function InlineThinkingIndicator({ labels }: InlineThinkingIndicatorProps) {
  const resolved = resolveLabels(defaultInlineThinkingIndicatorLabels, labels);

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">{resolved.thinking}</span>
      <span className="flex gap-0.5">
        <span
          className="bowman-fade-dot h-1 w-1 rounded-full bg-blue-500"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="bowman-fade-dot h-1 w-1 rounded-full bg-blue-500"
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className="bowman-fade-dot h-1 w-1 rounded-full bg-blue-500"
          style={{ animationDelay: "0.4s" }}
        />
      </span>
    </div>
  );
}
