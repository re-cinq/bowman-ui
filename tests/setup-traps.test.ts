import { takeNetworkCalls } from "./setup.js";

// The traps in tests/setup.ts fail any test that reaches the network; this
// file proves each of the five channels is recorded, draining the record so
// the suite-wide afterEach still sees an empty list.
describe("the suite-wide network traps", () => {
  it("record fetch, XMLHttpRequest, WebSocket, EventSource and navigator.sendBeacon by channel and URL", () => {
    void fetch("https://example.test/api");
    new XMLHttpRequest();
    new WebSocket("wss://example.test/socket");
    new EventSource("https://example.test/events");
    navigator.sendBeacon("https://example.test/beacon");

    expect(takeNetworkCalls()).toEqual([
      "fetch: https://example.test/api",
      "XMLHttpRequest",
      "WebSocket: wss://example.test/socket",
      "EventSource: https://example.test/events",
      "sendBeacon: https://example.test/beacon",
    ]);
  });
});
