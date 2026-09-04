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

// Client snapshot reads the live preference on every render, so a reduced-motion
// user never sees a first-frame flash of animation and later change events are
// reflected by re-reading `matches`. The guard is not dead code: "use client"
// components still server-render once, and the render phase has no window there.
const getSnapshot = (): boolean =>
  canMatchMedia() ? window.matchMedia(QUERY).matches : false;

const getServerSnapshot = (): boolean => false;

const noopSubscribe = (): (() => void) => () => {};

/**
 * Hook to detect user's reduced motion preference
 *
 * A boolean `override` is returned as-is without consulting the OS preference,
 * so a consumer's own flag plumbing (feature flags, settings) stays at the
 * call site. With `override` undefined, the hook tracks
 * `prefers-reduced-motion: reduce` via `matchMedia`.
 *
 * Use this hook for JS-controlled animations that can't be handled by CSS alone.
 *
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 */
export function useReducedMotion(override?: boolean): boolean {
  const hasOverride = override !== undefined;
  const prefersReducedMotion = useSyncExternalStore(
    hasOverride ? noopSubscribe : subscribe,
    hasOverride ? getServerSnapshot : getSnapshot,
    getServerSnapshot,
  );

  if (hasOverride) {
    return override;
  }

  return prefersReducedMotion;
}
