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

export const expectTextOnAccent = (element: Element | null) => {
  expect(element).toHaveClass("text-(--bowman-text-on-accent,var(--color-white))");
  expect(element).not.toHaveClass("text-white");
};

export const expectPrimaryAccentFill = (element: Element | null) => {
  expect(element).toHaveClass(
    "bg-(--bowman-accent,var(--color-blue-500))",
    "dark:bg-(--bowman-accent-dark,var(--color-blue-600))",
    "hover:bg-(--bowman-accent-hover,var(--color-blue-600))",
    "dark:hover:bg-(--bowman-accent-hover-dark,var(--color-blue-500))"
  );
  expectTextOnAccent(element);
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
    "dark:focus:ring-offset-(--bowman-ring-offset-dark,var(--color-slate-900))",
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

export const expectTextSecondaryHover = (element: Element | null) =>
  expectPair(
    element,
    "hover:text-(--bowman-text-secondary,var(--color-slate-600))",
    "dark:hover:text-(--bowman-text-secondary-dark,var(--color-slate-400))",
    ["hover:text-slate-600", "dark:hover:text-slate-300"]
  );

export const expectTextSubtle = (element: Element | null) =>
  expectPair(
    element,
    "text-(--bowman-text-subtle,var(--color-slate-400))",
    "dark:text-(--bowman-text-subtle-dark,var(--color-slate-500))",
    ["text-slate-400"]
  );

export const expectTextSubtleDisabled = (element: Element | null) =>
  expectPair(
    element,
    "disabled:text-(--bowman-text-subtle,var(--color-slate-400))",
    "dark:disabled:text-(--bowman-text-subtle-dark,var(--color-slate-500))",
    ["disabled:text-slate-400", "dark:disabled:text-slate-500"]
  );

export const expectActiveBackgroundDisabled = (element: Element | null) =>
  expectPair(
    element,
    "disabled:bg-(--bowman-active,var(--color-slate-100))",
    "dark:disabled:bg-(--bowman-active-dark,var(--color-slate-800))",
    ["disabled:bg-slate-100", "dark:disabled:bg-slate-800"]
  );

// The strong sites shipped a slate-900 light side but split dark (white / slate-100 / slate-200);
// the role unifies the dark side to slate-100, so every retired literal is checked gone.
const RETIRED_STRONG = [
  "text-slate-800",
  "text-slate-900",
  "dark:text-white",
  "dark:text-slate-100",
];

export const expectTextStrong = (element: Element | null) =>
  expectPair(
    element,
    "text-(--bowman-text-strong,var(--color-slate-900))",
    "dark:text-(--bowman-text-strong-dark,var(--color-slate-100))",
    [...RETIRED_STRONG, "dark:text-slate-200"]
  );

export const expectTextStrongHover = (element: Element | null) =>
  expectPair(
    element,
    "hover:text-(--bowman-text-strong,var(--color-slate-900))",
    "dark:hover:text-(--bowman-text-strong-dark,var(--color-slate-100))",
    ["hover:text-slate-900", "dark:hover:text-white"]
  );

export const expectTextStrongFocus = (element: Element | null) =>
  expectPair(
    element,
    "focus:text-(--bowman-text-strong,var(--color-slate-900))",
    "dark:focus:text-(--bowman-text-strong-dark,var(--color-slate-100))",
    ["focus:text-slate-900", "dark:focus:text-white"]
  );

// The delete hover shipped a lone red-500 with no dark side; the danger role unifies it to
// red-600 / red-400, and the two soft dark fills (red-900/30 and /20) collapse to one rgba.
export const expectDanger = (element: Element | null) =>
  expectPair(
    element,
    "text-(--bowman-danger,var(--color-red-600))",
    "dark:text-(--bowman-danger-dark,var(--color-red-400))",
    ["text-red-600", "dark:text-red-400"]
  );

export const expectDangerHover = (element: Element | null) =>
  expectPair(
    element,
    "hover:text-(--bowman-danger,var(--color-red-600))",
    "dark:hover:text-(--bowman-danger-dark,var(--color-red-400))",
    ["hover:text-red-500"]
  );

export const expectDangerSoft = (element: Element | null) =>
  expectPair(
    element,
    "bg-(--bowman-danger-soft,var(--color-red-100))",
    "dark:bg-[var(--bowman-danger-soft-dark,rgba(127,29,29,0.3))]",
    ["bg-red-100", "dark:bg-red-900/30", "dark:bg-red-900/20"]
  );

// The success role unifies the copied check (a lone green-500) with the selected thumbs-up
// text (green-600 / green-400): both retired literals are checked gone at either site.
export const expectSuccess = (element: Element | null) =>
  expectPair(
    element,
    "text-(--bowman-success,var(--color-green-600))",
    "dark:text-(--bowman-success-dark,var(--color-green-400))",
    ["text-green-500", "text-green-600", "dark:text-green-400"]
  );

export const expectSuccessSoft = (element: Element | null) =>
  expectPair(
    element,
    "bg-(--bowman-success-soft,var(--color-green-100))",
    "dark:bg-(--bowman-success-soft-dark,rgba(20,83,45,0.3))",
    ["bg-green-100", "dark:bg-green-900/30"]
  );
