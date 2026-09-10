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

const expectPair = (element: Element | null, light: string, dark: string, retired: string[]) => {
  expect(element).toHaveClass(light, dark);
  expect(element).not.toHaveClass(...retired);
};

export const expectSurface = (element: Element | null) =>
  expectPair(
    element,
    "bg-(--bowman-surface,var(--color-white))",
    "dark:bg-(--bowman-surface-dark,var(--color-slate-900))",
    ["bg-white", "dark:bg-slate-900"]
  );

export const expectSurfaceHover = (element: Element | null) =>
  expectPair(
    element,
    "hover:bg-(--bowman-surface-hover,var(--color-slate-50))",
    "dark:hover:bg-(--bowman-surface-hover-dark,var(--color-slate-800))",
    ["hover:bg-slate-50", "dark:hover:bg-slate-800"]
  );

export const expectBorder = (element: Element | null) =>
  expectPair(
    element,
    "border-(--bowman-border,var(--color-slate-200))",
    "dark:border-(--bowman-border-dark,var(--color-slate-800))",
    ["border-slate-200", "dark:border-slate-800"]
  );

export const expectRingOffset = (element: Element | null) =>
  expectPair(
    element,
    "focus:ring-offset-(--bowman-ring-offset,var(--color-white))",
    "dark:ring-offset-(--bowman-ring-offset-dark,var(--color-slate-900))",
    ["focus:ring-offset-white", "dark:ring-offset-slate-900"]
  );

export const expectTextBody = (element: Element | null) =>
  expectPair(
    element,
    "text-(--bowman-text-body,var(--color-slate-700))",
    "dark:text-(--bowman-text-body-dark,var(--color-slate-200))",
    ["text-slate-700", "dark:text-slate-200"]
  );

export const expectTextSecondary = (element: Element | null) =>
  expectPair(
    element,
    "text-(--bowman-text-secondary,var(--color-slate-600))",
    "dark:text-(--bowman-text-secondary-dark,var(--color-slate-400))",
    ["text-slate-600", "dark:text-slate-400"]
  );
