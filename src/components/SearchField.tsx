"use client";

import { forwardRef } from "react";
import { SearchIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";

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

const inputClassName =
  "block w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:ring-blue-400";

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, disabled = false, labels },
  ref
) {
  const resolved = resolveLabels(defaultSearchFieldLabels, labels);

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
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
