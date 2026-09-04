"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
    // Storage access can throw (blocked third-party cookies, full quota);
    // degrade to in-memory state instead of crashing the consumer's shell.
  }
};

const subscribeHydration = (): (() => void) => () => {};

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

  // isHydrated flips false -> true across the server/client snapshot boundary, so
  // consumers can tell when the persisted value has taken over without a flash.
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );

  // The stored value is an external store: getServerSnapshot yields the default
  // (null) so server render and the first hydration render agree, then the client
  // snapshot reads localStorage and cross-tab writes arrive via the storage event.
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
    [storageKey],
  );
  const storedValue = useSyncExternalStore(
    subscribe,
    () => readStoredValue(storageKey),
    () => null,
  );

  const storedOpen =
    storedValue === null ? defaultOpen : storedValue === "true";

  // Once the consumer changes the value it becomes the source of truth, so the
  // persisted read only seeds the initial state and cross-tab updates.
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
