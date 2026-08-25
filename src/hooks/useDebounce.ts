"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to debounce a value with a specified delay.
 * Useful for search inputs, form inputs, and other frequent state changes
 * where you want to defer expensive operations (API calls, etc).
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
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
