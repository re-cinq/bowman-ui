import {
  ACCENT_BG,
  ACCENT_BG_HOVER,
  BORDER,
  SURFACE,
  SURFACE_HOVER,
  TEXT_BODY,
  TEXT_ON_ACCENT,
  TEXT_SECONDARY,
  TEXT_STRONG_HOVER,
} from "../theme/tokens.js";
import { FOCUS_RING } from "../theme/focusRing.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

const focusRingClassNames = `ring-offset-2 ${FOCUS_RING}`;
const disabledClassNames = "disabled:cursor-not-allowed disabled:opacity-50";

export const buttonBaseClassNames = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer ${focusRingClassNames} ${disabledClassNames}`;

export const buttonVariantClassNames: Readonly<Record<ButtonVariant, string>> = Object.freeze({
  primary: `${ACCENT_BG} ${TEXT_ON_ACCENT} ${ACCENT_BG_HOVER}`,
  secondary: `border ${BORDER} ${SURFACE} ${TEXT_BODY} ${SURFACE_HOVER}`,
  ghost: `${TEXT_SECONDARY} ${SURFACE_HOVER} ${TEXT_STRONG_HOVER}`,
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
