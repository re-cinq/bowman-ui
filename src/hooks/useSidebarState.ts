"use client";

import { useState, useEffect, useCallback } from "react";

export interface SidebarStateOptions {
  /** Consumer-owned localStorage key prefix (e.g. "olt-"). Required so two apps on the same origin never collide. */
  storagePrefix: string;
  /** Initial state if no stored value exists (default: true) */
  defaultOpen?: boolean;
}

const readStoredValue = (storageKey: string): string | null => {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const writeStoredValue = (storageKey: string, value: string): void => {
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // Storage access can throw (blocked third-party cookies, full quota);
    // degrade to in-memory state instead of crashing the consumer's shell.
  }
};

/**
 * Hook to persist sidebar collapse state across sessions
 *
 * Stores state in localStorage for EU/EAA accessibility compliance:
 * - User preference is remembered between visits
 * - Sidebar state persists across page navigation
 *
 * The stored key is `${storagePrefix}${key}`.
 *
 * @param key - Unique key within the consumer's prefix (e.g. "chat", "dashboard")
 * @param options - `storagePrefix` (required) and `defaultOpen`
 *
 * @example
 * const { isOpen, toggle, open, close } = useSidebarState("chat", { storagePrefix: "olt-" });
 */
export function useSidebarState(key: string, options: SidebarStateOptions) {
  const { storagePrefix, defaultOpen = true } = options;
  const storageKey = `${storagePrefix}${key}`;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = readStoredValue(storageKey);
    if (stored !== null) {
      setIsOpen(stored === "true");
    }
    setIsHydrated(true);
  }, [storageKey]);

  // Save to localStorage on change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    writeStoredValue(storageKey, String(isOpen));
  }, [isOpen, isHydrated, storageKey]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen,
    isHydrated,
  };
}
