// Green fixture for scripts/check-client-directives.mjs: an implements clause
// is a pure type position and must not fire, even naming a global on the
// trigger list. Only extends heritage is walked. Test doubles of DOM
// interfaces are the motivating shape.
export declare class MockSocket implements WebSocket {
  close(): void;
}

export declare class FakeObserver implements ResizeObserver {
  disconnect(): void;
}
