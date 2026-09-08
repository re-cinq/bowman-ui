"use client";

import { forwardRef, type ComponentType, type MouseEvent } from "react";
import {
  buttonBaseClassNames,
  buttonIconClassNames,
  buttonVariantClassNames,
  iconButtonSizeClassNames,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonStyles.js";

export interface IconButtonLabels {
  /** The button's accessible name. Required: no plausible English default exists. */
  accessibleName: string;
}

export interface IconButtonProps {
  icon: ComponentType<{ className?: string }>;
  /** Required, no defaults object: an icon-only button without a name is the defect. */
  labels: IconButtonLabels;
  /** Default "secondary". */
  variant?: ButtonVariant;
  /** Default "md". */
  size?: ButtonSize;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, labels, variant = "secondary", size = "md", type = "button", disabled, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={labels.accessibleName}
      className={`${buttonBaseClassNames} ${buttonVariantClassNames[variant]} ${iconButtonSizeClassNames[size]}`}
    >
      <Icon className={buttonIconClassNames[size]} />
    </button>
  );
});
