"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";

import { FOCUSABLE_SELECTOR } from "./focusableSelector.js";

/** Traps Tab within the container while isOpen; Escape calls onClose and refocuses triggerRef. Modal only. */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasBeenOpen = useRef(false);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) {
      return [];
    }

    // display:none and visibility:hidden leave the tab order; opacity-0 stays tabbable and is untested on purpose.
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) =>
      typeof el.checkVisibility === "function"
        ? el.checkVisibility({ visibilityProperty: true })
        : el.offsetParent !== null
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
      if (event.key !== "Tab") {
        return;
      }
      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Focus that escaped the trap is pulled back in instead of tabbing on through the page behind.
      if (!containerRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();

        return;
      }

      // Shift+Tab on the first wraps to the last, Tab on the last to the first; elsewhere tabs on normally.
      const wrapFrom = event.shiftKey ? firstElement : lastElement;
      const wrapTo = event.shiftKey ? lastElement : firstElement;

      if (document.activeElement === wrapFrom) {
        event.preventDefault();
        wrapTo.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, getFocusableElements]);

  // Focus management on open/close
  useEffect(() => {
    const focusFirstElementOnOpen = () => {
      hasBeenOpen.current = true;
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus first focusable element in container
      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        return undefined;
      }

      // Delay for the DOM; cancelled on close/unmount so a rapid open-then-close never focuses a closed trap.
      const frame = requestAnimationFrame(() => {
        focusableElements[0].focus();
      });

      return () => cancelAnimationFrame(frame);
    };

    const returnFocusOnClose = () => {
      // Only a real open-then-close returns focus: mounting closed must not steal focus onto the trigger.
      if (!hasBeenOpen.current) {
        return;
      }

      // Return focus to trigger or previous element
      const returnTarget = triggerRef?.current || previousActiveElement.current;

      if (returnTarget && typeof returnTarget.focus === "function") {
        returnTarget.focus();
      }
    };

    if (isOpen) {
      return focusFirstElementOnOpen();
    }
    returnFocusOnClose();

    return undefined;
  }, [isOpen, triggerRef, getFocusableElements]);

  return containerRef;
}
