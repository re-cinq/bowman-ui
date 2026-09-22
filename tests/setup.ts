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
// request from model-authored content, so any fetch, XMLHttpRequest, WebSocket,
// EventSource or navigator.sendBeacon call during a test fails that test - the
// five channels bowman/no-network-egress names at lint time. The wrappers
// record instead of throwing so the failure names the request rather than
// surfacing as an unhandled error. jsdom defines WebSocket but neither
// EventSource nor sendBeacon, so those two are removed again, not restored.
let networkCalls: string[] = [];
let originalFetch: typeof globalThis.fetch;
let OriginalXMLHttpRequest: typeof globalThis.XMLHttpRequest;
let OriginalWebSocket: typeof globalThis.WebSocket | undefined;
let OriginalEventSource: typeof globalThis.EventSource | undefined;
let originalSendBeacon: Navigator["sendBeacon"] | undefined;

// tests/setup-traps.test.ts drains the record to prove each channel is caught.
export const takeNetworkCalls = (): string[] => networkCalls.splice(0);

const recordingConstructor = (name: string) =>
  class {
    constructor(url?: unknown) {
      networkCalls.push(url === undefined ? name : `${name}: ${String(url)}`);
    }
  };

const restoreOrRemove = <Host extends object, Key extends keyof Host>(
  host: Host,
  key: Key,
  original: Host[Key] | undefined
) => {
  if (original === undefined) {
    Reflect.deleteProperty(host, key);

    return;
  }
  host[key] = original;
};

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
  OriginalWebSocket = globalThis.WebSocket;
  OriginalEventSource = globalThis.EventSource;
  originalSendBeacon = navigator.sendBeacon;
  globalThis.fetch = ((input: unknown) => {
    networkCalls.push(`fetch: ${String(input)}`);

    return new Promise<Response>(() => {});
  }) as typeof globalThis.fetch;
  globalThis.XMLHttpRequest = recordingConstructor(
    "XMLHttpRequest"
  ) as unknown as typeof globalThis.XMLHttpRequest;
  globalThis.WebSocket = recordingConstructor(
    "WebSocket"
  ) as unknown as typeof globalThis.WebSocket;
  globalThis.EventSource = recordingConstructor(
    "EventSource"
  ) as unknown as typeof globalThis.EventSource;
  navigator.sendBeacon = (url) => {
    networkCalls.push(`sendBeacon: ${String(url)}`);

    return true;
  };
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  globalThis.fetch = originalFetch;
  globalThis.XMLHttpRequest = OriginalXMLHttpRequest;
  restoreOrRemove(globalThis, "WebSocket", OriginalWebSocket);
  restoreOrRemove(globalThis, "EventSource", OriginalEventSource);
  restoreOrRemove(navigator, "sendBeacon", originalSendBeacon);
  expect({ consoleCalls, networkCalls }).toEqual({ consoleCalls: [], networkCalls: [] });
});
