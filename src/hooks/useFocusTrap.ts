"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";

import { FOCUSABLE_SELECTOR } from "./focusableSelector.js";

/**
 * Hook to trap focus within a container (for modals, drawers, dialogs)
 *
 * Implements EU/EAA accessibility requirements for focus management:
 * - Focus is trapped within the container when active
 * - Escape key closes the container and returns focus to trigger
 * - Tab cycles through focusable elements
 * - Shift+Tab cycles backwards
 *
 * Modal-only by design: while open, a Tab pressed with focus anywhere
 * outside the container pulls focus back in. Do not use it for non-modal
 * surfaces (popovers, toolbars) where the page behind stays interactive.
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
  triggerRef?: RefObject<HTMLElement | null>,
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasBeenOpen = useRef(false);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) {
      return [];
    }

    // checkVisibility with visibilityProperty tests display:none subtrees and
    // visibility:hidden - the states that also remove an element from the tab
    // order. Opacity stays untested on purpose: opacity-0 elements remain
    // tabbable in browsers (this package's own reveal-on-focus buttons rely
    // on that). The offsetParent fallback misreports fixed-position
    // descendants as hidden but is all older engines offer.
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) =>
      typeof el.checkVisibility === "function"
        ? el.checkVisibility({ visibilityProperty: true })
        : el.offsetParent !== null,
    );
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return;
    }

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

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus that escaped the trap (a programmatic move, a browser quirk)
        // is pulled back in instead of tabbing on through the page behind.
        if (!containerRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? lastElement : firstElement).focus();

          return;
        }

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
      hasBeenOpen.current = true;
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element in container
      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        return;
      }

      // Small delay to ensure DOM is ready; cancelled on close/unmount so a
      // rapid open-then-close never races focus back into the closed trap
      const frame = requestAnimationFrame(() => {
        focusableElements[0].focus();
      });

      return () => cancelAnimationFrame(frame);
    }

    // Only a genuine open-then-close returns focus. Mounting closed must leave
    // the page's focus untouched: with a triggerRef supplied, the unguarded
    // version pulled focus onto the trigger the moment the consumer's shell
    // rendered, stealing it from whatever the user was actually on.
    if (!hasBeenOpen.current) {
      return;
    }

    // Return focus to trigger or previous element
    const returnTarget = triggerRef?.current || previousActiveElement.current;

    if (returnTarget && typeof returnTarget.focus === "function") {
      returnTarget.focus();
    }
  }, [isOpen, triggerRef, getFocusableElements]);

  return containerRef;
}
