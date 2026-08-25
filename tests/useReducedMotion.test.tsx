import { act, render, renderHook } from "@testing-library/react";
import { useReducedMotion } from "../src/hooks/useReducedMotion.js";

type ChangeHandler = (event: { matches: boolean }) => void;

// jsdom implements no window.matchMedia at all, so the tests stub it wholesale.
const stubMatchMedia = (matches: boolean) => {
  const handlers: ChangeHandler[] = [];
  const removeEventListener = vi.fn((_type: string, handler: ChangeHandler) => {
    const index = handlers.indexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  });
  const matchMedia = vi.fn(() => ({
    matches,
    addEventListener: (_type: string, handler: ChangeHandler) => handlers.push(handler),
    removeEventListener,
  }));
  vi.stubGlobal("matchMedia", matchMedia);
  return { matchMedia, handlers, removeEventListener };
};

describe("useReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the boolean override as-is and never consults matchMedia", () => {
    const { matchMedia } = stubMatchMedia(false);

    const on = renderHook(() => useReducedMotion(true));
    const off = renderHook(() => useReducedMotion(false));

    expect(on.result.current).toBe(true);
    expect(off.result.current).toBe(false);
    expect(matchMedia).not.toHaveBeenCalled();
  });

  it("tracks prefers-reduced-motion: reduce when no override is given", () => {
    const { matchMedia } = stubMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(matchMedia).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(result.current).toBe(true);
  });

  it("follows a change event from the media query", () => {
    const { handlers } = stubMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      for (const handler of handlers) handler({ matches: true });
    });
    expect(result.current).toBe(true);
  });

  it("reports the preference on the very first render - no flash frame", () => {
    stubMatchMedia(true);
    const renders: boolean[] = [];
    const Probe = () => {
      renders.push(useReducedMotion());
      return null;
    };
    render(<Probe />);

    expect(renders[0]).toBe(true);
  });

  it("an environment without matchMedia reports false and does not throw", () => {
    vi.stubGlobal("matchMedia", undefined);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it("removes the change listener on unmount", () => {
    const { removeEventListener } = stubMatchMedia(false);

    const { unmount } = renderHook(() => useReducedMotion());
    unmount();

    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });
});
