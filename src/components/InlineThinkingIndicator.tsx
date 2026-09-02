"use client";

import { resolveLabels } from "../labels.js";
import { ThinkingDots } from "./ThinkingDots.js";

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
// arrived. The block form (ThinkingIndicator) is its own public component;
// this inline form stays private because its only call site is ChatMessage.
export function InlineThinkingIndicator({ labels }: InlineThinkingIndicatorProps) {
  const resolved = resolveLabels(defaultInlineThinkingIndicatorLabels, labels);

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">{resolved.thinking}</span>
      <ThinkingDots />
    </div>
  );
}
