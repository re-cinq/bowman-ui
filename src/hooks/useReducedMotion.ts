"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const canMatchMedia = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function";

const subscribe = (onChange: () => void): (() => void) => {
  if (!canMatchMedia()) {
    return () => {};
  }
  const mediaQuery = window.matchMedia(QUERY);

  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
};

// Read live (no first-frame flash); the window guard stays - "use client" files still server-render once.
const getSnapshot = (): boolean => (canMatchMedia() ? window.matchMedia(QUERY).matches : false);

const getServerSnapshot = (): boolean => false;

const noopSubscribe = (): (() => void) => () => {};

/** Tracks prefers-reduced-motion via matchMedia for JS-driven animation; a boolean override is returned as-is. */
export function useReducedMotion(override?: boolean): boolean {
  const hasOverride = override !== undefined;
  const prefersReducedMotion = useSyncExternalStore(
    hasOverride ? noopSubscribe : subscribe,
    hasOverride ? getServerSnapshot : getSnapshot,
    getServerSnapshot
  );

  if (hasOverride) {
    return override;
  }

  return prefersReducedMotion;
}
