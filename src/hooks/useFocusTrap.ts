"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";

/**
 * Hook to trap focus within a container (for modals, drawers, dialogs)
 *
 * Implements EU/EAA accessibility requirements for focus management:
 * - Focus is trapped within the container when active
 * - Escape key closes the container and returns focus to trigger
 * - Tab cycles through focusable elements
 * - Shift+Tab cycles backwards
 *
 * @param isOpen - Whether the container is open/active
 * @param onClose - Callback to close the container
 * @param triggerRef - Optional ref to the element that triggered the container (for focus return)
 *
 * @example
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const containerRef = useFocusTrap(isOpen, onClose, triggerRef);
 * return <div ref={containerRef}>...</div>;
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const selector = [
      'a[href]:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(",");

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => el.offsetParent !== null // Filter out hidden elements
    );
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close on Escape
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      // Trap focus on Tab
      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, getFocusableElements]);

  // Focus management on open/close
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element in container
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Small delay to ensure DOM is ready; cancelled on close/unmount so a
        // rapid open-then-close never races focus back into the closed trap
        const frame = requestAnimationFrame(() => {
          focusableElements[0].focus();
        });
        return () => cancelAnimationFrame(frame);
      }
    } else {
      // Return focus to trigger or previous element
      const returnTarget = triggerRef?.current || previousActiveElement.current;
      if (returnTarget && typeof returnTarget.focus === "function") {
        returnTarget.focus();
      }
    }
  }, [isOpen, triggerRef, getFocusableElements]);

  return containerRef;
}
