"use client";

import { forwardRef, type KeyboardEvent } from "react";
import { SearchIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import {
  BORDER,
  FOCUS_RING_COLOR,
  PLACEHOLDER_SUBTLE,
  SURFACE,
  TEXT_STRONG,
  TEXT_SUBTLE,
} from "../theme/tokens.js";
import { IconButton } from "./IconButton.js";

export interface SearchFieldLabels {
  /** The input's accessible name - a real label, never the placeholder. */
  searchInput: string;
  searchPlaceholder: string;
  /** The submit button's accessible name, read only when `onSubmit` is given. */
  submitSearch: string;
}

export const defaultSearchFieldLabels: Readonly<Required<SearchFieldLabels>> = Object.freeze({
  searchInput: "Search",
  searchPlaceholder: "Search...",
  submitSearch: "Submit search",
});

export interface SearchFieldProps {
  value: string;
  /** Receives the input's new value verbatim - untrimmed, a controlled input's contract. */
  onChange: (value: string) => void;
  /** Runs the search on Enter or the submit button; without it, no button renders. */
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  labels?: Partial<SearchFieldLabels>;
}

const inputClassName = (padding: string) =>
  `block w-full rounded-lg border ${BORDER} ${SURFACE} py-2 ${padding} text-sm ${TEXT_STRONG} ${PLACEHOLDER_SUBTLE} focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} disabled:cursor-not-allowed disabled:opacity-50`;

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, onSubmit, disabled = false, labels },
  ref
) {
  const resolved = resolveLabels(defaultSearchFieldLabels, labels);

  const submitOnEnter = (submit: (value: string) => void) => (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();

    if (!disabled) {
      submit(value);
    }
  };

  return (
    <div className="relative">
      {!onSubmit && (
        <SearchIcon
          className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${TEXT_SUBTLE}`}
        />
      )}
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={onSubmit && submitOnEnter(onSubmit)}
        aria-label={resolved.searchInput}
        placeholder={resolved.searchPlaceholder}
        disabled={disabled}
        className={inputClassName(onSubmit ? "pl-3 pr-10" : "pl-9 pr-3")}
      />
      {onSubmit && (
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2">
          <IconButton
            icon={SearchIcon}
            variant="ghost"
            size="sm"
            disabled={disabled}
            labels={{ accessibleName: resolved.submitSearch }}
            onClick={() => onSubmit(value)}
          />
        </div>
      )}
    </div>
  );
});
