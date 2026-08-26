import { useRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useFocusTrap } from "../src/hooks/useFocusTrap.js";

// jsdom always reports offsetParent as null, which would make the trap see
// every element as hidden; give attached elements a real-looking offsetParent.
const offsetParentDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetParent"
);

const Harness = ({
  isOpen,
  onClose,
  withTrigger,
  empty,
  unattached,
}: {
  isOpen: boolean;
  onClose: () => void;
  withTrigger?: boolean;
  empty?: boolean;
  unattached?: boolean;
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
        <div ref={containerRef}>
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

describe("useFocusTrap", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetParent", {
      configurable: true,
      get() {
        return (this as HTMLElement).parentElement;
      },
    });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    if (offsetParentDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "offsetParent", offsetParentDescriptor);
    }
    Reflect.deleteProperty(HTMLElement.prototype, "checkVisibility");
    vi.unstubAllGlobals();
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
    outside.focus();

    const { rerender } = render(<Harness isOpen onClose={vi.fn()} />);
    rerender(<Harness isOpen={false} onClose={vi.fn()} />);

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

    fireEvent.keyDown(document, { key: "Tab" });

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
      if (!cancelled.includes(index + 1)) callback(0);
    }

    expect(screen.getByRole("button", { name: "trigger" })).toHaveFocus();
    expect(cancelled.length).toBeGreaterThan(0);
  });

  it("checkVisibility wins over offsetParent, so a fixed-position container's children are not treated as hidden", () => {
    if (offsetParentDescriptor) {
      Object.defineProperty(HTMLElement.prototype, "offsetParent", offsetParentDescriptor);
    }
    Object.defineProperty(HTMLElement.prototype, "checkVisibility", {
      configurable: true,
      value: () => true,
    });

    render(<Harness isOpen onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Tab while focus sits outside the open trap pulls it to the first element", () => {
    render(<button>outside</button>);
    render(<Harness isOpen onClose={vi.fn()} />);
    screen.getByRole("button", { name: "outside" }).focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(screen.getByRole("button", { name: "first" })).toHaveFocus();
  });

  it("Shift+Tab while focus sits outside the open trap pulls it to the last element", () => {
    render(<button>outside</button>);
    render(<Harness isOpen onClose={vi.fn()} />);
    screen.getByRole("button", { name: "outside" }).focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "last" })).toHaveFocus();
  });

  it("an empty container leaves Tab handling alone", () => {
    render(<Harness isOpen onClose={vi.fn()} empty />);
    render(<button>outside</button>);
    const outside = screen.getByRole("button", { name: "outside" });
    outside.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(outside).toHaveFocus();
  });
});
