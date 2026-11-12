"use client";

import { forwardRef, useId, type ReactNode, type Ref } from "react";
import { BORDER, SURFACE, SURFACE_HOVER, TEXT_BODY, TEXT_STRONG } from "../theme/tokens.js";
import { FOCUS_RING } from "../theme/focusRing.js";

export interface CardProps {
  heading?: ReactNode;
  children: ReactNode;
  /** When given, the whole card is one button. */
  onSelect?: () => void;
  /** Applies only with `onSelect`; a static card has no disabled state. */
  disabled?: boolean;
}

const cardClassName = `block w-full rounded-xl border p-4 text-left ${BORDER} ${SURFACE}`;
const headingClassName = `block font-semibold ${TEXT_STRONG}`;
const selectableClassName = `${cardClassName} cursor-pointer transition-colors ring-offset-2 ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-50`;

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { heading, children, onSelect, disabled },
  ref
) {
  const headingId = useId();
  const bodyId = useId();

  if (!onSelect) {
    return (
      <div ref={ref as Ref<HTMLDivElement>} className={cardClassName}>
        {heading && <h3 className={`mb-1 ${headingClassName}`}>{heading}</h3>}
        <div className={TEXT_BODY}>{children}</div>
      </div>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-labelledby={heading ? headingId : undefined}
      aria-describedby={heading ? bodyId : undefined}
      className={disabled ? selectableClassName : `${selectableClassName} ${SURFACE_HOVER}`}
    >
      {heading && (
        <span id={headingId} className={`mb-1 ${headingClassName}`}>
          {heading}
        </span>
      )}
      <span id={bodyId} className={`block ${TEXT_BODY}`}>
        {children}
      </span>
    </button>
  );
});
