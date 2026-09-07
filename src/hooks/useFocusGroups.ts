"use client";

import { useEffect, useCallback, useRef } from "react";

import { FOCUSABLE_SELECTOR } from "./focusableSelector.js";

export interface FocusGroupsOptions {
  /** Maps a group name to its screen-reader announcement; null suppresses it. Default: `Moved to ${groupName}`. */
  announce?: (groupName: string) => string | null;
}

const defaultAnnounce = (groupName: string): string => `Moved to ${groupName}`;

/** F6 / Shift+F6 cycles focus through [data-focus-group] sections, by data-focus-group-order then DOM order. */
export function useFocusGroups(options: FocusGroupsOptions = {}): void {
  const { announce = defaultAnnounce } = options;
  const currentGroupIndex = useRef(0);

  const getFocusGroups = useCallback((): HTMLElement[] => {
    const groups = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-group]"));

    // Stable sort of a DOM-ordered list: equal orders need no tiebreak, and an indexOf tiebreak mid-sort is unsafe.
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

      return;
    }
    // If no focusable element, make the group itself focusable temporarily
    const hadTabIndexAttribute = group.hasAttribute("tabindex");
    const originalTabIndex = group.tabIndex;

    group.tabIndex = -1;
    group.focus();
    // An element that carried no tabindex gets it removed again, not a permanent tabindex="-1".
    requestAnimationFrame(() => {
      if (hadTabIndexAttribute) {
        group.tabIndex = originalTabIndex;

        return;
      }
      group.removeAttribute("tabindex");
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // defaultPrevented: a second mounted instance leaves a handled press alone instead of moving focus twice.
      if (event.key !== "F6" || event.defaultPrevented) {
        return;
      }

      const groups = getFocusGroups();

      if (groups.length === 0) {
        return;
      }

      event.preventDefault();

      // Determine direction
      const direction = event.shiftKey ? -1 : 1;

      // Step from the group that actually holds focus; the stored index only covers focus outside every group.
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

      if (!groupName) {
        return;
      }
      const message = announce(groupName);

      if (message !== null) {
        announceToScreenReader(message);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [getFocusGroups, focusFirstElement, announce]);
}

/** Announces to screen readers through a live region hidden by the stylesheet's bowman-sr-only class. */
function announceToScreenReader(message: string): void {
  const announcement = document.createElement("div");

  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "bowman-sr-only";

  // Mount empty, fill next frame: a born-with-text region is unreliably announced, and a keydown implies frames run.
  document.body.appendChild(announcement);
  requestAnimationFrame(() => {
    announcement.textContent = message;
  });

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
