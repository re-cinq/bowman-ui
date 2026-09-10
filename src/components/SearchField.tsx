"use client";

import { forwardRef } from "react";
import { SearchIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import {
  BORDER,
  FOCUS_RING_COLOR,
  PLACEHOLDER_SUBTLE,
  SURFACE,
  TEXT_SUBTLE,
} from "../theme/tokens.js";

export interface SearchFieldLabels {
  /** The input's accessible name - a real label, never the placeholder. */
  searchInput: string;
  searchPlaceholder: string;
}

export const defaultSearchFieldLabels: Readonly<Required<SearchFieldLabels>> = Object.freeze({
  searchInput: "Search",
  searchPlaceholder: "Search...",
});

export interface SearchFieldProps {
  value: string;
  /** Receives the input's new value verbatim - untrimmed, a controlled input's contract. */
  onChange: (value: string) => void;
  disabled?: boolean;
  labels?: Partial<SearchFieldLabels>;
}

const inputClassName = `block w-full rounded-lg border ${BORDER} ${SURFACE} py-2 pl-9 pr-3 text-sm text-slate-900 ${PLACEHOLDER_SUBTLE} focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200`;

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, disabled = false, labels },
  ref
) {
  const resolved = resolveLabels(defaultSearchFieldLabels, labels);

  return (
    <div className="relative">
      <SearchIcon
        className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${TEXT_SUBTLE}`}
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-label={resolved.searchInput}
        placeholder={resolved.searchPlaceholder}
        disabled={disabled}
        className={inputClassName}
      />
    </div>
  );
});
