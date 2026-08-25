import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect } from "vitest";

// 023's GDPR rider, enforced suite-wide: entry content may carry booking
// identifiers and names, and the package writes nothing to the console
// (CONTRACT.md § Labels, decision 5). Every test therefore fails if anything
// it rendered called console.error or console.warn. The wrappers record and
// swallow instead of vi.spyOn so a test's own vi.restoreAllMocks() cannot
// erase the evidence before this afterEach runs (setup-file hooks run last).
let consoleCalls: string[] = [];
let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;

beforeEach(() => {
  consoleCalls = [];
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;
  console.error = (...args: unknown[]) => {
    consoleCalls.push(`console.error: ${args.map(String).join(" ")}`);
  };
  console.warn = (...args: unknown[]) => {
    consoleCalls.push(`console.warn: ${args.map(String).join(" ")}`);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  expect(consoleCalls).toEqual([]);
});
