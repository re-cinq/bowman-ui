import { expect } from "vitest";

// 024's shared-helper criterion: the dots' count, order, delays and class are
// asserted by exactly one implementation, run against both indicators, so the
// animation timing cannot drift between them.
export const expectThinkingDots = (container: HTMLElement) => {
  const dots = [...container.querySelectorAll(".bowman-fade-dot")];
  expect(dots.map((dot) => (dot as HTMLElement).style.animationDelay)).toEqual([
    "0s",
    "0.2s",
    "0.4s",
  ]);
};
