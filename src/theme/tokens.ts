// Every class string names one --bowman-* token with its fallback (docs/design-notes.md § Theming); internal, not exported from the barrel.
export const ACCENT_BG =
  "bg-(--bowman-accent,var(--color-blue-500)) dark:bg-(--bowman-accent-dark,var(--color-blue-600))";
export const ACCENT_BG_HOVER =
  "hover:bg-(--bowman-accent-hover,var(--color-blue-600)) dark:hover:bg-(--bowman-accent-hover-dark,var(--color-blue-500))";
export const ACCENT_DOT = "bg-(--bowman-accent,var(--color-blue-500))";
export const ACCENT_SOFT_SURFACE =
  "border-(--bowman-accent-border,var(--color-blue-200)) bg-(--bowman-accent-soft,var(--color-blue-50)) dark:border-(--bowman-accent-border-dark,var(--color-blue-800)) dark:bg-(--bowman-accent-soft-dark,var(--color-blue-950))";
export const FOCUS_RING_COLOR =
  "focus:ring-(--bowman-focus-ring,var(--color-blue-500)) dark:focus:ring-(--bowman-focus-ring-dark,var(--color-blue-400))";
export const FOCUS_VISIBLE_RING_COLOR =
  "focus-visible:ring-(--bowman-focus-ring,var(--color-blue-500))";
export const FOCUS_WITHIN_RING_COLOR =
  "focus-within:ring-(--bowman-focus-ring,var(--color-blue-500))/50 focus-within:shadow-[0_0_0_4px_var(--bowman-accent-glow,rgba(59,130,246,0.1))] dark:focus-within:ring-(--bowman-focus-ring-dark,var(--color-blue-400))/50 dark:focus-within:shadow-[0_0_0_4px_var(--bowman-accent-glow-dark,rgba(96,165,250,0.1))]";
export const ACTIVE_ROW_BG =
  "bg-(--bowman-active,var(--color-slate-100)) dark:bg-(--bowman-active-dark,var(--color-slate-800))";
