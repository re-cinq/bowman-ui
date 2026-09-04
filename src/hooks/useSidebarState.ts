"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";

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
    // Storage can throw (blocked cookies, full quota); fall back to in-memory state rather than crash the shell.
  }
};

const subscribeHydration = (): (() => void) => () => {};

/** Persists sidebar open state in localStorage under `${storagePrefix}${key}`, surviving navigation and visits. */
export function useSidebarState(key: string, options: SidebarStateOptions) {
  const { storagePrefix, defaultOpen = true } = options;
  const storageKey = `${storagePrefix}${key}`;

  // isHydrated flips false -> true across the server/client snapshot boundary, so consumers can avoid a flash.
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  );

  // External store: null server snapshot so hydration agrees; the client reads storage plus cross-tab storage events.
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const handler = (event: StorageEvent) => {
        if (event.key === null || event.key === storageKey) {
          onChange();
        }
      };

      window.addEventListener("storage", handler);

      return () => window.removeEventListener("storage", handler);
    },
    [storageKey]
  );
  const storedValue = useSyncExternalStore(
    subscribe,
    () => readStoredValue(storageKey),
    () => null
  );

  const storedOpen = storedValue === null ? defaultOpen : storedValue === "true";

  // Once the consumer changes the value it is the source of truth; the persisted read only seeds and syncs cross-tab.
  const [userValue, setUserValue] = useState<boolean | null>(null);
  const isOpen = userValue === null ? storedOpen : userValue;

  const storedOpenRef = useRef(storedOpen);

  storedOpenRef.current = storedOpen;

  const setIsOpen = useCallback<Dispatch<SetStateAction<boolean>>>((value) => {
    setUserValue((previous) => {
      const current = previous === null ? storedOpenRef.current : previous;

      return typeof value === "function" ? value(current) : value;
    });
  }, []);

  // Persist only what the consumer changed, so a mount never clobbers the stored value.
  useEffect(() => {
    if (userValue === null) {
      return;
    }
    writeStoredValue(storageKey, String(userValue));
  }, [userValue, storageKey]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [setIsOpen]);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen,
    isHydrated,
  };
}
