"use client";

import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { resolveLabels } from "../labels.js";
import type { ThinkingChatEntry } from "../types/chat.js";
import { ThinkingDots } from "./ThinkingDots.js";

export interface ThinkingTraceLabels {
  thinkingTrace: string;
}

export const defaultThinkingTraceLabels: Readonly<Required<ThinkingTraceLabels>> = Object.freeze({
  thinkingTrace: "Reasoning",
});

export interface ThinkingTraceProps {
  entry: ThinkingChatEntry;
  /** Forces the streaming dots still; undefined tracks the OS preference. */
  reducedMotion?: boolean;
  /** Overrides the component's strings; English defaults apply per key. */
  labels?: Partial<ThinkingTraceLabels>;
}

// Label-only <details>, collapsed; plain text, never markdown or HTML; not a message (design-notes § Thinking trace).
export function ThinkingTrace({ entry, reducedMotion, labels }: ThinkingTraceProps) {
  const resolved = resolveLabels(defaultThinkingTraceLabels, labels);
  const prefersReducedMotion = useReducedMotion(reducedMotion);

  return (
    <details className="w-full text-sm text-slate-500 dark:text-slate-400">
      <summary className="flex cursor-pointer items-center gap-2">
        <span>{resolved.thinkingTrace}</span>
        {entry.isStreaming && <ThinkingDots reducedMotion={prefersReducedMotion} />}
      </summary>
      <div className="mt-2 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
        {entry.content}
      </div>
    </details>
  );
}
