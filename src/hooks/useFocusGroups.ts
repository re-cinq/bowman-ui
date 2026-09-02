"use client";

import { useEffect, useCallback, useRef } from "react";

import { FOCUSABLE_SELECTOR } from "./focusableSelector.js";
import { visuallyHidden } from "./visuallyHidden.js";

export interface FocusGroupsOptions {
  /**
   * Maps a group name to the screen-reader announcement for it.
   * Returning null suppresses the announcement entirely.
   * Defaults to the English sentence `Moved to ${groupName}`.
   */
  announce?: (groupName: string) => string | null;
}

const defaultAnnounce = (groupName: string): string => `Moved to ${groupName}`;

/**
 * Hook for F6-based focus group navigation (WCAG 2.1 AA)
 *
 * Implements F6 keyboard navigation between major page sections:
 * - F6 moves focus to next focus group
 * - Shift+F6 moves focus to previous focus group
 *
 * This is a standard accessibility pattern used in browser DevTools
 * and complex multi-panel interfaces.
 *
 * Usage:
 * 1. Add data-focus-group="group-name" to each major section
 * 2. Optionally add data-focus-group-order="0" to control order
 * 3. Call useFocusGroups() to enable the navigation
 *
 * @example
 * useFocusGroups(); // Enable F6 navigation
 *
 * return (
 *   <>
 *     <header data-focus-group="header" data-focus-group-order="0">...</header>
 *     <main data-focus-group="main" data-focus-group-order="1">...</main>
 *     <footer data-focus-group="footer" data-focus-group-order="2">...</footer>
 *   </>
 * );
 */
export function useFocusGroups(options: FocusGroupsOptions = {}): void {
  const { announce = defaultAnnounce } = options;
  const currentGroupIndex = useRef(0);

  const getFocusGroups = useCallback((): HTMLElement[] => {
    const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-group]"));

    // Sort by order attribute if present, otherwise by DOM order. Array#sort
    // is stable and querySelectorAll already returns DOM order, so groups
    // sharing an order need no tiebreak - and must not get one that calls
    // indexOf on the very array sort is midway through reordering.
    return groups.sort(
      (a, b) =>
        parseInt(a.dataset.focusGroupOrder || "999", 10) -
        parseInt(b.dataset.focusGroupOrder || "999", 10)
    );
  }, []);

  const focusFirstElement = useCallback((group: HTMLElement) => {
    const focusable = group.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusable) {
      focusable.focus();
    } else {
      // If no focusable element, make the group itself focusable temporarily
      const hadTabIndexAttribute = group.hasAttribute("tabindex");
      const originalTabIndex = group.tabIndex;
      group.tabIndex = -1;
      group.focus();
      // Restore after focus: an element that carried no tabindex attribute
      // gets it removed again rather than keeping a permanent tabindex="-1"
      requestAnimationFrame(() => {
        if (hadTabIndexAttribute) {
          group.tabIndex = originalTabIndex;
        } else {
          group.removeAttribute("tabindex");
        }
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // defaultPrevented: a second mounted instance leaves a press one
      // instance has already handled alone, instead of moving focus twice.
      if (event.key !== "F6" || event.defaultPrevented) return;

      const groups = getFocusGroups();
      if (groups.length === 0) return;

      event.preventDefault();

      // Determine direction
      const direction = event.shiftKey ? -1 : 1;

      // Step from the group that actually holds focus - the user may have
      // tabbed or clicked elsewhere since the last F6. The stored index is
      // only the fallback for focus outside every group.
      const activeGroup = document.activeElement?.closest("[data-focus-group]");
      const activeIndex = groups.findIndex((group) => group === activeGroup);
      const fromIndex = activeIndex === -1 ? currentGroupIndex.current : activeIndex;

      // Calculate next index with wrapping
      currentGroupIndex.current = (fromIndex + direction + groups.length) % groups.length;

      // Focus the target group
      const targetGroup = groups[currentGroupIndex.current];
      focusFirstElement(targetGroup);

      // Announce for screen readers
      const groupName = targetGroup.dataset.focusGroup;
      if (groupName) {
        const message = announce(groupName);
        if (message !== null) {
          announceToScreenReader(message);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [getFocusGroups, focusFirstElement, announce]);
}

/**
 * Announce a message to screen readers using a live region.
 * The element is visually hidden with inline styles so the package
 * needs no stylesheet or Tailwind config from the consumer.
 */
function announceToScreenReader(message: string): void {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  Object.assign(announcement.style, visuallyHidden);

  // A live region inserted already holding its text is unreliably announced;
  // insert it empty and write the text once the region exists in the tree.
  // The frame always fires before the removal timer here: the announcement
  // is keyboard-triggered, and a keydown implies a focused, visible tab
  // where frames are not suspended.
  document.body.appendChild(announcement);
  requestAnimationFrame(() => {
    announcement.textContent = message;
  });

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
