import { act, renderHook } from "@testing-library/react";
import { useSidebarState } from "../src/hooks/useSidebarState.js";

describe("useSidebarState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts open by default and reports hydrated after mount", () => {
    const { result } = renderHook(() => useSidebarState("chat", { storagePrefix: "olt-" }));

    expect(result.current).toMatchObject({ isOpen: true, isHydrated: true });
  });

  it("defaultOpen: false starts closed when nothing is stored", () => {
    const { result } = renderHook(() =>
      useSidebarState("chat", { storagePrefix: "olt-", defaultOpen: false })
    );

    expect(result.current.isOpen).toBe(false);
  });

  it('persists toggles under the exact key "olt-chat"', () => {
    const { result } = renderHook(() => useSidebarState("chat", { storagePrefix: "olt-" }));

    act(() => {
      result.current.toggle();
    });
    expect(localStorage.getItem("olt-chat")).toBe("false");

    act(() => {
      result.current.open();
    });
    expect(localStorage.getItem("olt-chat")).toBe("true");

    act(() => {
      result.current.close();
    });
    expect(localStorage.getItem("olt-chat")).toBe("false");

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(localStorage.getItem("olt-chat")).toBe("true");
  });

  it('a stored "false" wins over defaultOpen on mount', () => {
    localStorage.setItem("olt-chat", "false");

    const { result } = renderHook(() => useSidebarState("chat", { storagePrefix: "olt-" }));

    expect(result.current.isOpen).toBe(false);
  });

  it("degrades to in-memory state when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    const { result } = renderHook(() => useSidebarState("chat", { storagePrefix: "olt-" }));

    expect(result.current).toMatchObject({ isOpen: true, isHydrated: true });

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });
});
