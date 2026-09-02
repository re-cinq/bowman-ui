"use client";

export interface ThinkingDotsProps {
  /** Drops the animation class and the stagger; the three dots stay in place. */
  reducedMotion?: boolean;
}

const DELAYS = ["0s", "0.2s", "0.4s"];

const FADING_DOT = "bowman-fade-dot h-1 w-1 rounded-full bg-blue-500";
const STILL_DOT = "h-1 w-1 rounded-full bg-blue-500";

// The three fading dots shared by ThinkingIndicator, InlineThinkingIndicator
// and ThinkingTrace, factored out so the animation timing cannot drift
// between them (024). Deliberately not exported from the barrel: the dots are an
// internal detail of the indicators, not public API.
export function ThinkingDots({ reducedMotion = false }: ThinkingDotsProps) {
  return (
    <span className="flex gap-0.5">
      {DELAYS.map((delay) => (
        <span
          key={delay}
          className={reducedMotion ? STILL_DOT : FADING_DOT}
          style={reducedMotion ? undefined : { animationDelay: delay }}
        />
      ))}
    </span>
  );
}
