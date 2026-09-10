import { ACCENT_BG, ACCENT_BG_HOVER, FOCUS_RING_COLOR } from "../theme/tokens.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

const focusRingClassNames = `ring-offset-2 focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} focus:ring-offset-white dark:ring-offset-slate-900`;
const disabledClassNames = "disabled:cursor-not-allowed disabled:opacity-50";

export const buttonBaseClassNames = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer ${focusRingClassNames} ${disabledClassNames}`;

export const buttonVariantClassNames: Readonly<Record<ButtonVariant, string>> = Object.freeze({
  primary: `${ACCENT_BG} text-white ${ACCENT_BG_HOVER}`,
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  ghost:
    "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
});

export const buttonSizeClassNames: Readonly<Record<ButtonSize, string>> = Object.freeze({
  md: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
});

export const iconButtonSizeClassNames: Readonly<Record<ButtonSize, string>> = Object.freeze({
  md: "p-2",
  sm: "p-1.5",
});

export const buttonIconClassNames: Readonly<Record<ButtonSize, string>> = Object.freeze({
  md: "h-4 w-4",
  sm: "h-3.5 w-3.5",
});
