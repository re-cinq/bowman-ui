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
export const SURFACE =
  "bg-(--bowman-surface,var(--color-white)) dark:bg-(--bowman-surface-dark,var(--color-slate-900))";
export const SURFACE_HOVER =
  "hover:bg-(--bowman-surface-hover,var(--color-slate-50)) dark:hover:bg-(--bowman-surface-hover-dark,var(--color-slate-800))";
export const CONTROL_HOVER =
  "hover:bg-(--bowman-control-hover,var(--color-slate-100)) dark:hover:bg-(--bowman-control-hover-dark,var(--color-slate-800))";
export const BORDER =
  "border-(--bowman-border,var(--color-slate-200)) dark:border-(--bowman-border-dark,var(--color-slate-800))";
export const RING_OFFSET =
  "focus:ring-offset-(--bowman-ring-offset,var(--color-white)) dark:ring-offset-(--bowman-ring-offset-dark,var(--color-slate-900))";
export const TEXT_BODY =
  "text-(--bowman-text-body,var(--color-slate-700)) dark:text-(--bowman-text-body-dark,var(--color-slate-200))";
export const TEXT_SECONDARY =
  "text-(--bowman-text-secondary,var(--color-slate-600)) dark:text-(--bowman-text-secondary-dark,var(--color-slate-400))";
export const TEXT_MUTED =
  "text-(--bowman-text-muted,var(--color-slate-500)) dark:text-(--bowman-text-muted-dark,var(--color-slate-400))";
export const TEXT_SUBTLE =
  "text-(--bowman-text-subtle,var(--color-slate-400)) dark:text-(--bowman-text-subtle-dark,var(--color-slate-500))";
export const PLACEHOLDER_SUBTLE =
  "placeholder-(--bowman-text-subtle,var(--color-slate-400)) dark:placeholder-(--bowman-text-subtle-dark,var(--color-slate-500))";
export const BORDER_MD = BORDER.split(" ")
  .map((className) => `md:${className}`)
  .join(" ");
