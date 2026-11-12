"use client";

import { forwardRef, useId } from "react";
import {
  CONTROL_BORDER,
  DANGER,
  DANGER_BORDER,
  FOCUS_RING_COLOR,
  SURFACE,
  TEXT_MUTED,
  TEXT_STRONG,
} from "../theme/tokens.js";

export type TextFieldType = "text" | "email" | "url" | "tel";

export interface TextFieldLabels {
  /** The visible label and the input's accessible name - a real label, never the placeholder. */
  fieldLabel: string;
  /** Help text under the input. */
  fieldHint?: string;
  /** Its presence is the invalid state - there is no separate `invalid` prop. */
  fieldError?: string;
}

export interface TextFieldProps {
  value: string;
  /** Receives the input's new value verbatim - untrimmed, a controlled input's contract. */
  onChange: (value: string) => void;
  labels: TextFieldLabels;
  /** Default "text". */
  type?: TextFieldType;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  spellCheck?: boolean;
  name?: string;
}

const inputBaseClassName = `block w-full rounded-lg border ${SURFACE} px-3 py-2 text-sm ${TEXT_STRONG} focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} disabled:cursor-not-allowed disabled:opacity-50`;

const describedByOf = (...ids: (string | undefined)[]): string | undefined =>
  ids.filter(Boolean).join(" ") || undefined;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { value, onChange, labels, type = "text", required, disabled, autoComplete, spellCheck, name },
  ref
) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const hint = labels.fieldHint || undefined;
  const error = labels.fieldError || undefined;
  const describedBy = describedByOf(hint && hintId, error && errorId);

  return (
    <div>
      <label htmlFor={inputId} className={`mb-1 block text-sm font-medium ${TEXT_STRONG}`}>
        {labels.fieldLabel}
      </label>
      <input
        ref={ref}
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        name={name}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={`${inputBaseClassName} ${error ? DANGER_BORDER : CONTROL_BORDER}`}
      />
      {hint && (
        <p id={hintId} className={`mt-1 text-sm ${TEXT_MUTED}`}>
          {hint}
        </p>
      )}
      <p id={errorId} aria-live="polite" className={`mt-1 text-sm ${DANGER}`}>
        {error}
      </p>
    </div>
  );
});
