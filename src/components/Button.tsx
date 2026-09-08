"use client";

import { forwardRef, type ComponentType, type MouseEvent, type ReactNode } from "react";
import {
  buttonBaseClassNames,
  buttonIconClassNames,
  buttonSizeClassNames,
  buttonVariantClassNames,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonStyles.js";

export type { ButtonVariant, ButtonSize } from "./buttonStyles.js";

export interface ButtonProps {
  variant: ButtonVariant;
  /** Default "md". */
  size?: ButtonSize;
  /** Leading icon, sized by the button; decorative beside the visible text. */
  icon?: ComponentType<{ className?: string }>;
  /** The visible text - consumer content, never a label. */
  children: ReactNode;
  /** Default "button", so a Button inside a form never submits it by accident. */
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size = "md", icon: Icon, children, type = "button", disabled, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${buttonBaseClassNames} ${buttonVariantClassNames[variant]} ${buttonSizeClassNames[size]}`}
    >
      {Icon && <Icon className={buttonIconClassNames[size]} />}
      {children}
    </button>
  );
});
