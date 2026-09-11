// The chat fixture's themes, keyed by the "theme" query value. The default is
// the Marginalia Books screen every existing test drives: no wrapper class, no
// avatar. "copperline" is the invented second company that proves the theming
// tokens: its wrapper class carries the thirty-three --bowman-* overrides in
// custom-theme.css, and its chainring mark fills the assistant avatar circle.

import type { ReactNode } from "react";

export interface DemoTheme {
  name: string;
  className?: string;
  assistantAvatar?: ReactNode;
}

// A chainring: a ring, a hub, and a dashed outer circle for the teeth.
export function ChainringMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="h-4 w-4"
      data-theme-mark="copperline"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="9.5" strokeDasharray="1.5 3.48" />
    </svg>
  );
}

export const defaultTheme: DemoTheme = { name: "Marginalia Books" };

export const customTheme: DemoTheme = {
  name: "Copperline Bicycles",
  className: "custom-theme",
  assistantAvatar: <ChainringMark />,
};

// A Map, not a record: a record lookup reads the prototype chain, so
// "?theme=constructor" would resolve to a function instead of the default.
const themesByQueryValue: ReadonlyMap<string, DemoTheme> = new Map([["copperline", customTheme]]);

export const resolveTheme = (queryValue: string | null): DemoTheme =>
  themesByQueryValue.get(queryValue ?? "") ?? defaultTheme;
