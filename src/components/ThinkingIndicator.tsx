"use client";

import type { ReactNode } from "react";
import { resolveLabels } from "../labels.js";
import { ThinkingDots } from "./ThinkingDots.js";

export interface ThinkingIndicatorLabels {
  thinking: string;
  thinkingRegion: string;
}

export const defaultThinkingIndicatorLabels: Readonly<Required<ThinkingIndicatorLabels>> =
  Object.freeze({
    thinking: "Thinking",
    thinkingRegion: "Loading response",
  });

export interface ThinkingIndicatorProps {
  /** Fills the avatar circle; without it the circle stays empty (018 decision 3). */
  assistantAvatar?: ReactNode;
  /** Overrides the indicator's strings; English defaults apply per key. */
  labels?: Partial<ThinkingIndicatorLabels>;
}

// The block loading indicator shown while waiting for a response, lifted from
// the source app's ThinkingIndicator.tsx:13-38. The circle is always
// aria-hidden - an announced avatar inside a role="status" region would just
// be noise - and always pulses, since this component is itself the loading
// state.
export function ThinkingIndicator({ assistantAvatar, labels }: ThinkingIndicatorProps) {
  const resolved = resolveLabels(defaultThinkingIndicatorLabels, labels);

  return (
    <div
      className="flex w-full items-start gap-4"
      role="status"
      aria-live="polite"
      aria-label={resolved.thinkingRegion}
    >
      <div
        aria-hidden="true"
        className="bowman-pulse-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
      >
        {assistantAvatar}
      </div>
      <div className="flex items-center gap-2 py-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">{resolved.thinking}</span>
        <ThinkingDots />
      </div>
    </div>
  );
}
