import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, expect } from "vitest";

// 023's GDPR rider, enforced suite-wide: entry content may carry booking
// identifiers and names, and the package writes nothing to the console
// (docs/design-notes.md § Labels, decision 5). Every test therefore fails if anything
// it rendered called console.error or console.warn. The wrappers record and
// swallow instead of vi.spyOn so a test's own vi.restoreAllMocks() cannot
// erase the evidence before this afterEach runs (setup-file hooks run last).
let consoleCalls: string[] = [];
let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;

// 076's rider on the same principle: no rendering path may initiate a network
// request from model-authored content, so any fetch or XMLHttpRequest call
// during a test fails that test. The wrappers record instead of throwing so
// the failure names the request rather than surfacing as an unhandled error.
let networkCalls: string[] = [];
let originalFetch: typeof globalThis.fetch;
let OriginalXMLHttpRequest: typeof globalThis.XMLHttpRequest;

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
  networkCalls = [];
  originalFetch = globalThis.fetch;
  OriginalXMLHttpRequest = globalThis.XMLHttpRequest;
  globalThis.fetch = ((input: unknown) => {
    networkCalls.push(`fetch: ${String(input)}`);

    return new Promise<Response>(() => {});
  }) as typeof globalThis.fetch;
  globalThis.XMLHttpRequest = class {
    constructor() {
      networkCalls.push("XMLHttpRequest");
    }
  } as unknown as typeof globalThis.XMLHttpRequest;
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  globalThis.fetch = originalFetch;
  globalThis.XMLHttpRequest = OriginalXMLHttpRequest;
  expect({ consoleCalls, networkCalls }).toEqual({
    consoleCalls: [],
    networkCalls: [],
  });
});
