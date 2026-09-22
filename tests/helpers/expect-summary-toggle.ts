import { userEvent } from "@testing-library/user-event";
import { expect } from "vitest";

// jsdom runs the summary's activation behaviour on a click, never on Enter or
// Space, so the keyboard path is a browser's job (the demo's Playwright suite).
export const expectSummaryClickToggles = async (container: HTMLElement): Promise<void> => {
  const user = userEvent.setup();
  const details = container.querySelector("details");
  const summary = container.querySelector("summary");

  if (!details || !summary) {
    throw new Error("no details/summary rendered");
  }

  expect(details.open).toBe(false);

  await user.click(summary);
  expect(details.open).toBe(true);

  await user.click(summary);
  expect(details.open).toBe(false);
};
