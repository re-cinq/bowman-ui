export const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(",");

// display:none and visibility:hidden leave the tab order; opacity-0 stays tabbable and is untested on purpose.
export const isRendered = (element: HTMLElement): boolean =>
  typeof element.checkVisibility === "function"
    ? element.checkVisibility({ visibilityProperty: true })
    : element.offsetParent !== null;

export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isRendered);
}
