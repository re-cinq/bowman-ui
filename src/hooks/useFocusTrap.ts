"use client";

import { useEffect, useRef, type RefObject } from "react";

import { getFocusableElements, isRendered } from "./focusableSelector.js";

// An empty trap holds focus on its container only when it carries a tabindex and is visible.
const canTakeFocus = (container: HTMLElement | null): container is HTMLElement =>
  container !== null && container.hasAttribute("tabindex") && isRendered(container);

const focusSitsOutsideTheEnds = (container: HTMLElement): boolean =>
  document.activeElement === container || !container.contains(document.activeElement);

// A detached return target is skipped with no fallback, so focus stays where the browser put it.
const canReturnFocusTo = (target: Element | null): target is HTMLElement | SVGElement =>
  (target instanceof HTMLElement || target instanceof SVGElement) && target.isConnected;

const returnFocusTo = (target: Element | null) => {
  if (canReturnFocusTo(target)) {
    target.focus();
  }
};

/** Traps Tab within the container while isOpen; Escape calls onClose and refocuses triggerRef. Modal only. */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const hasBeenOpen = useRef(false);
  const isOpenRef = useRef(isOpen);
  const latestTriggerRef = useRef(triggerRef);

  useEffect(() => {
    isOpenRef.current = isOpen;
    latestTriggerRef.current = triggerRef;
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();

        return;
      }

      const container = containerRef.current;

      if (event.key !== "Tab" || !container) {
        return;
      }
      const focusableElements = getFocusableElements(container);

      if (focusableElements.length === 0) {
        holdFocusOnEmptyContainer(event, container);

        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Focus on the container, or escaped from it, is pulled to an end instead of tabbing on.
      if (focusSitsOutsideTheEnds(container)) {
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
  }, [isOpen, onClose]);

  useEffect(() => {
    const focusFirstElementOnOpen = () => {
      hasBeenOpen.current = true;
      previousActiveElement.current = document.activeElement;

      const container = containerRef.current;
      const [firstElement] = getFocusableElements(container);
      const target = firstElement ?? (canTakeFocus(container) ? container : undefined);

      if (!target) {
        return undefined;
      }

      // Delay for the DOM; cancelled on close/unmount so a rapid open-then-close never focuses a closed trap.
      const frame = requestAnimationFrame(() => {
        target.focus();
      });

      return () => cancelAnimationFrame(frame);
    };

    if (isOpen) {
      return focusFirstElementOnOpen();
    }

    // Only a real open-then-close returns focus: mounting closed must not steal focus onto the trigger.
    if (hasBeenOpen.current) {
      returnFocusTo(triggerRef?.current || previousActiveElement.current);
    }

    return undefined;
  }, [isOpen, triggerRef]);

  useEffect(
    () => () => returnFocusOnUnmount(isOpenRef, latestTriggerRef, previousActiveElement),
    []
  );

  return containerRef;
}

function holdFocusOnEmptyContainer(event: KeyboardEvent, container: HTMLElement) {
  if (!canTakeFocus(container)) {
    return;
  }
  event.preventDefault();

  if (!container.contains(document.activeElement)) {
    container.focus();
  }
}

function returnFocusOnUnmount(
  isOpenRef: RefObject<boolean>,
  triggerRef: RefObject<RefObject<HTMLElement | null> | undefined>,
  previousActiveElement: RefObject<Element | null>
) {
  if (isOpenRef.current) {
    returnFocusTo(triggerRef.current?.current || previousActiveElement.current);
  }
}
