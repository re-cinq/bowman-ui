import { expect } from "vitest";

// docs/design-notes.md § Theming: the colour token rides beside the untouched width
// class at every focus-ring site, so one helper pins both across the components.
export const expectFocusRing = (element: Element | null) => {
  expect(element).toHaveClass(
    "focus:ring-2",
    "focus:ring-(--bowman-focus-ring,var(--color-blue-500))",
    "dark:focus:ring-(--bowman-focus-ring-dark,var(--color-blue-400))"
  );
  expect(element).not.toHaveClass("focus:ring-blue-500", "dark:focus:ring-blue-400");
};

export const expectAccentSoftSurface = (element: Element | null) => {
  expect(element).toHaveClass(
    "bowman-pulse-subtle",
    "border",
    "border-(--bowman-accent-border,var(--color-blue-200))",
    "bg-(--bowman-accent-soft,var(--color-blue-50))",
    "dark:border-(--bowman-accent-border-dark,var(--color-blue-800))",
    "dark:bg-(--bowman-accent-soft-dark,var(--color-blue-950))"
  );
};

export const expectPrimaryAccentFill = (element: Element | null) => {
  expect(element).toHaveClass(
    "bg-(--bowman-accent,var(--color-blue-500))",
    "dark:bg-(--bowman-accent-dark,var(--color-blue-600))",
    "hover:bg-(--bowman-accent-hover,var(--color-blue-600))",
    "dark:hover:bg-(--bowman-accent-hover-dark,var(--color-blue-500))",
    "text-white"
  );
  expect(element).not.toHaveClass("bg-blue-500", "hover:bg-blue-600");
  expect(element).not.toHaveClass("border-slate-200");
};

export const expectActiveRowBackground = (element: Element | null) => {
  expect(element).toHaveClass(
    "bg-(--bowman-active,var(--color-slate-100))",
    "dark:bg-(--bowman-active-dark,var(--color-slate-800))"
  );
};

export const ACCENT_DOT_SELECTOR = '[class~="bg-(--bowman-accent,var(--color-blue-500))"]';
