/** Base icon plumbing: aria-hidden by default, role="img" plus aria-label when a label is given (WCAG 2.1 AA). */

import { type ReactNode, type Ref } from "react";

export interface IconSvgProps {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
  role?: string;
  "aria-label"?: string;
}

/** Base wrapper for SVG icons with accessibility support. */
export function IconWrapper({
  ref,
  className,
  children,
  "aria-hidden": ariaHidden,
  role,
  "aria-label": ariaLabel,
  ...props
}: IconSvgProps & { children: ReactNode; ref?: Ref<SVGSVGElement> }) {
  return (
    <svg
      ref={ref}
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden={ariaHidden}
      role={role}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Builds the accessibility props for an icon from whether it has a label. */
export function getAccessibleIconProps(
  ariaLabel?: string
): Pick<IconSvgProps, "aria-hidden" | "role" | "aria-label"> {
  if (ariaLabel) {
    return {
      "aria-hidden": false,
      role: "img",
      "aria-label": ariaLabel,
    };
  }

  return {
    "aria-hidden": true,
  };
}
