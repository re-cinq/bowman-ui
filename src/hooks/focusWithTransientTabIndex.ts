"use client";

// Focuses an element that is not itself focusable; an element that carried no tabindex gets it removed again next frame.
export function focusWithTransientTabIndex(element: HTMLElement | SVGElement): void {
  const hadTabIndexAttribute = element.hasAttribute("tabindex");
  const originalTabIndex = element.tabIndex;

  element.tabIndex = -1;
  element.focus();
  requestAnimationFrame(() => {
    if (hadTabIndexAttribute) {
      element.tabIndex = originalTabIndex;

      return;
    }
    element.removeAttribute("tabindex");
  });
}
