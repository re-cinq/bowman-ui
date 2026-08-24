"use client";

import { useEffect, useCallback, useRef } from "react";

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

    // Sort by order attribute if present, otherwise by DOM order
    return groups.sort((a, b) => {
      const orderA = parseInt(a.dataset.focusGroupOrder || "999", 10);
      const orderB = parseInt(b.dataset.focusGroupOrder || "999", 10);
      if (orderA !== orderB) return orderA - orderB;
      // Fall back to DOM order
      return groups.indexOf(a) - groups.indexOf(b);
    });
  }, []);

  const focusFirstElement = useCallback((group: HTMLElement) => {
    // Find first focusable element within the group
    const focusableSelector = [
      'a[href]:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(",");

    const focusable = group.querySelector<HTMLElement>(focusableSelector);
    if (focusable) {
      focusable.focus();
    } else {
      // If no focusable element, make the group itself focusable temporarily
      const originalTabIndex = group.tabIndex;
      group.tabIndex = -1;
      group.focus();
      // Restore original tabIndex after focus
      requestAnimationFrame(() => {
        group.tabIndex = originalTabIndex;
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F6") return;

      event.preventDefault();

      const groups = getFocusGroups();
      if (groups.length === 0) return;

      // Determine direction
      const direction = event.shiftKey ? -1 : 1;

      // Calculate next index with wrapping
      currentGroupIndex.current =
        (currentGroupIndex.current + direction + groups.length) % groups.length;

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
  announcement.style.position = "absolute";
  announcement.style.width = "1px";
  announcement.style.height = "1px";
  announcement.style.padding = "0";
  announcement.style.margin = "-1px";
  announcement.style.overflow = "hidden";
  announcement.style.clip = "rect(0, 0, 0, 0)";
  announcement.style.whiteSpace = "nowrap";
  announcement.style.border = "0";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
