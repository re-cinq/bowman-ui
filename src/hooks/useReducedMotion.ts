"use client";

import { useState, useEffect } from "react";

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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (override !== undefined) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [override]);

  if (override !== undefined) {
    return override;
  }
  return prefersReducedMotion;
}
