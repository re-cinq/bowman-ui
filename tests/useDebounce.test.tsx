import { act, renderHook } from "@testing-library/react";
import { useDebounce } from "../src/hooks/useDebounce.js";

const renderDebouncedA = () =>
  renderHook(({ value }) => useDebounce(value, 300), { initialProps: { value: "a" } });

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 300));

    expect(result.current).toBe("a");
  });

  it("still returns the previous value 299ms after a change and the new one at 301ms", () => {
    const { result, rerender } = renderDebouncedA();

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current).toBe("b");
  });

  it("a change before the deadline restarts the delay instead of firing the stale value", () => {
    const { result, rerender } = renderDebouncedA();

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(101);
    });
    expect(result.current).toBe("c");
  });
});
