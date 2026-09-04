"use client";

import { useState, useEffect } from "react";

/** Returns `value` once it has held still for `delay` ms - for search and form inputs that gate expensive work. */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel the timeout if the value changes before it fires
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
