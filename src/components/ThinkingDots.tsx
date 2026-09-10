"use client";
import { ACCENT_DOT } from "../theme/tokens.js";

export interface ThinkingDotsProps {
  /** Drops the animation class and the stagger; the three dots stay in place. */
  reducedMotion?: boolean;
}

const DELAYS = ["0s", "0.2s", "0.4s"];

const FADING_DOT = `bowman-fade-dot h-1 w-1 rounded-full ${ACCENT_DOT}`;
const STILL_DOT = `h-1 w-1 rounded-full ${ACCENT_DOT}`;

// The dots shared by the three indicators so their timing cannot drift (024); internal, not exported from the barrel.
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
