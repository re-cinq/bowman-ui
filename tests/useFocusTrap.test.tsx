import { useRef, type RefObject } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FOCUSABLE_SELECTOR } from "../src/hooks/focusableSelector.js";
import { useFocusTrap } from "../src/hooks/useFocusTrap.js";
import { stubFocusEnvironment } from "./helpers/focus-environment.js";

const Harness = ({
  isOpen,
  onClose,
  withTrigger,
  empty,
  unattached,
  focusable,
}: {
  isOpen: boolean;
  onClose: () => void;
  withTrigger?: boolean;
  empty?: boolean;
  unattached?: boolean;
  focusable?: boolean;
}) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useFocusTrap<HTMLDivElement>(
    isOpen,
    onClose,
    withTrigger ? triggerRef : undefined
  );

  return (
    <>
      <button ref={triggerRef}>trigger</button>
      {!unattached && (
        <div ref={containerRef} data-testid="container" tabIndex={focusable ? -1 : undefined}>
          {!empty && (
            <>
              <button>first</button>
              <button>middle</button>
              <button>last</button>
            </>
          )}
        </div>
      )}
    </>
  );
};

// An always-open trap over one button, for the tests that hand it their own triggerRef.
const OpenTrap = ({ triggerRef }: { triggerRef: RefObject<HTMLElement | null> }) => {
  const containerRef = useFocusTrap<HTMLDivElement>(true, () => {}, triggerRef);

  return (
    <div ref={containerRef}>
      <button>first</button>
    </div>
  );
};

// A trap whose only stops are a <details> disclosure's summary and, after it, one button.
const DisclosureTrap = () => {
  const containerRef = useFocusTrap<HTMLDivElement>(true, () => {});

  return (
    <div ref={containerRef}>
      <details>
        <summary>Mehr 4711</summary>
        <p>Inhalt 4711</p>
      </details>
      <button>after</button>
    </div>
  );
};

const openThenCloseTrapAfterFocusing = (previouslyFocused: HTMLElement | SVGElement) => {
  previouslyFocused.focus();

  const { rerender } = render(<Harness isOpen onClose={vi.fn()} />);

  rerender(<Harness isOpen={false} onClose={vi.fn()} />);
};

const focusOutsideAnOpenTrap = () => {
  render(<button>outside</button>);
  render(<Harness isOpen onClose={vi.fn()} />);
  screen.getByRole("button", { name: "outside" }).focus();
};

describe("useFocusTrap", () => {
  const { restoreOffsetParent } = stubFocusEnvironment();

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "checkVisibility");
  });

  it("focuses the first focusable element when opened", () => {
    render(<Harness isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Tab on the last element wraps to the first", () => {
    render(<Harness isOpen onClose={vi.fn()} />);

    screen.getByRole("button", { name: "last" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Shift+Tab on the first element wraps to the last", () => {
    render(<Harness isOpen onClose={vi.fn()} />);

    screen.getByRole("button", { name: "first" }).focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "last" })).toHaveFocus();
  });

  it("Tab in the middle of the list is not intercepted", () => {
    render(<Harness isOpen onClose={vi.fn()} />);

    screen.getByRole("button", { name: "middle" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });

    expect(screen.getByRole("button", { name: "middle" })).toHaveFocus();
  });

  it("a non-Tab, non-Escape key leaves focus untouched", () => {
    render(<Harness isOpen onClose={vi.fn()} />);

    screen.getByRole("button", { name: "middle" }).focus();
    fireEvent.keyDown(document, { key: "Enter" });

    expect(screen.getByRole("button", { name: "middle" })).toHaveFocus();
  });

  it("Escape calls onClose", () => {
    const onClose = vi.fn();

    render(<Harness isOpen onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closing returns focus to the trigger ref when one is given", () => {
    const { rerender } = render(<Harness isOpen onClose={vi.fn()} withTrigger />);

    rerender(<Harness isOpen={false} onClose={vi.fn()} withTrigger />);

    expect(screen.getByRole("button", { name: "trigger" })).toHaveFocus();
  });

  it("closing returns focus to the previously active element without a trigger ref", () => {
    render(<button>outside</button>);
    const outside = screen.getByRole("button", { name: "outside" });

    openThenCloseTrapAfterFocusing(outside);

    expect(outside).toHaveFocus();
  });

  it("Shift+Tab in the middle of the list is not intercepted", () => {
    render(<Harness isOpen onClose={vi.fn()} />);

    screen.getByRole("button", { name: "middle" }).focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "middle" })).toHaveFocus();
  });

  it("a never-attached container ref yields no focusable elements and no crash", () => {
    render(<Harness isOpen onClose={vi.fn()} unattached />);

    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(true);
    expect(document.body).toHaveFocus();
  });

  it("mounting closed with no trigger and no prior focus does nothing", () => {
    render(<Harness isOpen={false} onClose={vi.fn()} />);

    expect(document.body).toHaveFocus();
  });

  it("mounting closed with a trigger ref leaves focus on the element the user was already on", () => {
    render(<button>outside</button>);
    const outside = screen.getByRole("button", { name: "outside" });

    outside.focus();

    render(<Harness isOpen={false} onClose={vi.fn()} withTrigger />);

    expect(outside).toHaveFocus();
  });

  it("closing before the focus frame fires never steals focus into the closed trap", () => {
    const queue: FrameRequestCallback[] = [];
    const cancelled: number[] = [];

    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      queue.push(callback);

      return queue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      cancelled.push(id);
    });

    const { rerender } = render(<Harness isOpen onClose={vi.fn()} withTrigger />);

    rerender(<Harness isOpen={false} onClose={vi.fn()} withTrigger />);

    for (const [index, callback] of queue.entries()) {
      if (!cancelled.includes(index + 1)) {
        callback(0);
      }
    }

    expect(screen.getByRole("button", { name: "trigger" })).toHaveFocus();
    expect(cancelled.length).toBeGreaterThan(0);
  });

  it("checkVisibility wins over offsetParent, so a fixed-position container's children are not treated as hidden", () => {
    restoreOffsetParent();
    Object.defineProperty(HTMLElement.prototype, "checkVisibility", {
      configurable: true,
      value: () => true,
    });

    render(<Harness isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Tab while focus sits outside the open trap pulls it to the first element", () => {
    focusOutsideAnOpenTrap();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Shift+Tab while focus sits outside the open trap pulls it to the last element", () => {
    focusOutsideAnOpenTrap();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "last" })).toHaveFocus();
  });

  it("an empty container without a tabindex leaves Tab handling alone", () => {
    render(<Harness isOpen onClose={vi.fn()} empty />);
    render(<button>outside</button>);
    const outside = screen.getByRole("button", { name: "outside" });

    outside.focus();

    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(true);
    expect(outside).toHaveFocus();
  });

  it("an empty container with a tabindex takes focus on open and Tab from it is prevented", () => {
    render(<Harness isOpen onClose={vi.fn()} empty focusable />);

    expect(screen.getByTestId("container")).toHaveFocus();
    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(false);
    expect(fireEvent.keyDown(document, { key: "Tab", shiftKey: true })).toBe(false);
    expect(screen.getByTestId("container")).toHaveFocus();
  });

  it("an empty container with a tabindex that fails the visibility check takes no focus and leaves Tab alone", () => {
    Object.defineProperty(HTMLElement.prototype, "checkVisibility", {
      configurable: true,
      value: function (this: HTMLElement) {
        return this.dataset.testid !== "container";
      },
    });

    render(<Harness isOpen onClose={vi.fn()} empty focusable />);

    expect(document.body).toHaveFocus();
    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(true);
  });

  it("Tab with focus escaped from an empty focusable container is prevented and pulls focus back to the container", () => {
    render(<button>outside</button>);
    render(<Harness isOpen onClose={vi.fn()} empty focusable />);
    screen.getByRole("button", { name: "outside" }).focus();

    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(false);
    expect(screen.getByTestId("container")).toHaveFocus();
  });

  it("Tab from the focused container itself reaches the first element", () => {
    render(<Harness isOpen onClose={vi.fn()} focusable />);
    screen.getByTestId("container").focus();

    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(false);
    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Shift+Tab from the focused container itself reaches the last element", () => {
    render(<Harness isOpen onClose={vi.fn()} focusable />);
    screen.getByTestId("container").focus();

    expect(fireEvent.keyDown(document, { key: "Tab", shiftKey: true })).toBe(false);
    expect(screen.getByRole("button", { name: "last" })).toHaveFocus();
  });

  it("unmounting while open returns focus to the element that held it before opening", () => {
    render(<button>outside</button>);
    const outside = screen.getByRole("button", { name: "outside" });

    outside.focus();

    const { unmount } = render(<Harness isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();

    unmount();

    expect(outside).toHaveFocus();
  });

  it("unmounting while open returns focus to the latest trigger ref when one is given", () => {
    const trigger = document.createElement("button");
    const triggerRef = { current: trigger };

    document.body.append(trigger);

    const { unmount } = render(<OpenTrap triggerRef={triggerRef} />);

    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("a close returns focus once and a later unmount while closed returns it no more", () => {
    const { rerender, unmount } = render(<Harness isOpen onClose={vi.fn()} withTrigger />);
    const trigger = screen.getByRole("button", { name: "trigger" });
    const focusSpy = vi.spyOn(trigger, "focus");

    rerender(<Harness isOpen={false} onClose={vi.fn()} withTrigger />);
    unmount();

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it("a new triggerRef while open never returns focus", () => {
    const firstRef = { current: document.createElement("button") };
    const secondRef = { current: document.createElement("button") };

    document.body.append(firstRef.current, secondRef.current);

    const firstSpy = vi.spyOn(firstRef.current, "focus");
    const secondSpy = vi.spyOn(secondRef.current, "focus");
    const { rerender } = render(<OpenTrap triggerRef={firstRef} />);

    rerender(<OpenTrap triggerRef={secondRef} />);

    expect(firstSpy).not.toHaveBeenCalled();
    expect(secondSpy).not.toHaveBeenCalled();
    firstRef.current.remove();
    secondRef.current.remove();
  });

  it("a return target removed before the close is skipped and focus stays where it was", () => {
    const outside = document.createElement("button");

    document.body.append(outside);
    outside.focus();

    const { rerender } = render(<Harness isOpen onClose={vi.fn()} />);
    const first = screen.getByRole("button", { name: "first" });

    outside.remove();
    rerender(<Harness isOpen={false} onClose={vi.fn()} />);

    expect(first).toHaveFocus();
  });

  it('closing returns focus to a previously active <svg tabindex="0"> without a trigger ref', () => {
    render(<svg tabIndex={0} data-testid="glyph" />);
    const glyph = screen.getByTestId("glyph");

    openThenCloseTrapAfterFocusing(glyph);

    expect(glyph).toHaveFocus();
  });

  it("closing after opening with a null active element and no trigger ref does not throw", () => {
    const activeElement = vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
    const { rerender } = render(<Harness isOpen onClose={vi.fn()} />);

    activeElement.mockRestore();

    expect(() => rerender(<Harness isOpen={false} onClose={vi.fn()} />)).not.toThrow();
  });

  it("a <details> summary is a trap stop: Shift+Tab from it wraps to the last, Tab from the last wraps to it", () => {
    render(<DisclosureTrap />);
    const summary = screen.getByText("Mehr 4711");
    const after = screen.getByRole("button", { name: "after" });

    expect(summary).toHaveFocus();
    expect(fireEvent.keyDown(document, { key: "Tab", shiftKey: true })).toBe(false);
    expect(after).toHaveFocus();
    expect(fireEvent.keyDown(document, { key: "Tab" })).toBe(false);
    expect(summary).toHaveFocus();
  });
});

describe("FOCUSABLE_SELECTOR", () => {
  it("matches a details' first summary, an editing host, controlled media and a frame, and not their opted-out variants", () => {
    render(
      <div data-testid="kinds">
        <details>
          <summary data-match="yes">first</summary>
          <summary data-match="no">second</summary>
        </details>
        <details>
          <summary tabIndex={-1} data-match="no">
            skipped
          </summary>
        </details>
        <div contentEditable suppressContentEditableWarning data-match="yes" />
        <div contentEditable="false" data-match="no" />
        <div contentEditable tabIndex={-1} suppressContentEditableWarning data-match="no" />
        <audio controls data-match="yes" />
        <audio data-match="no" />
        <video controls data-match="yes" />
        <video controls tabIndex={-1} data-match="no" />
        <iframe title="frame 4711" data-match="yes" />
        <iframe title="skipped frame 4711" tabIndex={-1} data-match="no" />
        <summary data-match="no">loose</summary>
      </div>
    );
    const verdicts = [...screen.getByTestId("kinds").querySelectorAll<HTMLElement>("[data-match]")];

    for (const element of verdicts) {
      expect(element.matches(FOCUSABLE_SELECTOR)).toBe(element.dataset.match === "yes");
    }
  });
});
