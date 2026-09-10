"use client";

import type { ReactNode } from "react";
import { resolveLabels } from "../labels.js";
import { ACCENT_SOFT_SURFACE, TEXT_MUTED } from "../theme/tokens.js";
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

// The circle stays aria-hidden (noise inside role="status") and always pulses - this component is the loading state.
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
        className={`bowman-pulse-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${ACCENT_SOFT_SURFACE}`}
      >
        {assistantAvatar}
      </div>
      <div className="flex items-center gap-2 py-2">
        <span className={`text-sm ${TEXT_MUTED}`}>{resolved.thinking}</span>
        <ThinkingDots />
      </div>
    </div>
  );
}
