import { act, fireEvent, render, screen } from "@testing-library/react";
import { useFocusGroups, type FocusGroupsOptions } from "../src/hooks/useFocusGroups.js";

const Harness = (options: FocusGroupsOptions & { withButtons?: boolean; noOrder?: boolean }) => {
  const { withButtons = true, noOrder, ...focusOptions } = options;

  useFocusGroups(focusOptions);

  return (
    <>
      <main data-focus-group="main" data-focus-group-order={noOrder ? undefined : "1"}>
        {withButtons && <button>main action</button>}
      </main>
      <header data-focus-group="header" data-focus-group-order={noOrder ? undefined : "0"}>
        {withButtons && <button>header action</button>}
      </header>
    </>
  );
};

const pressF6 = (shiftKey = false) => {
  fireEvent.keyDown(document, { key: "F6", shiftKey });
};

describe("useFocusGroups", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);

      return 0;
    });
  });

  afterEach(() => {
    act(() => {
      vi.runAllTimers();
    });
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("F6 follows data-focus-group-order, not DOM order", () => {
    render(<Harness />);

    pressF6();

    expect(screen.getByRole("button", { name: "main action" })).toHaveFocus();
  });

  it("F6 wraps forward past the last group and Shift+F6 wraps backward past the first", () => {
    render(<Harness />);

    pressF6();
    pressF6();
    expect(screen.getByRole("button", { name: "header action" })).toHaveFocus();

    pressF6();
    expect(screen.getByRole("button", { name: "main action" })).toHaveFocus();

    pressF6(true);
    expect(screen.getByRole("button", { name: "header action" })).toHaveFocus();
  });

  it("equal orders fall back to DOM order, so the first F6 lands on the second group", () => {
    render(<Harness noOrder />);

    pressF6();

    expect(screen.getByRole("button", { name: "header action" })).toHaveFocus();
  });

  it("twelve unordered groups are visited in DOM order, wrapping back to the first", () => {
    const names = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const ManyGroups = () => {
      useFocusGroups({ announce: () => null });

      return (
        <>
          {names.map((name) => (
            <section key={name} data-focus-group={name}>
              <button>{name}</button>
            </section>
          ))}
        </>
      );
    };

    render(<ManyGroups />);

    const visited = names.map(() => {
      pressF6();

      return document.activeElement?.textContent;
    });

    expect(visited).toEqual([...names.slice(1), names[0]]);
  });

  it('announces "Moved to main" in a role=status live region with inline clip styles and no class', () => {
    render(<Harness />);

    pressF6();

    const region = screen.getByRole("status");

    expect(region).toHaveTextContent("Moved to main");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(region.hasAttribute("class")).toBe(false);
    expect(region.style).toMatchObject({ position: "absolute", width: "1px", height: "1px" });
  });

  it("the announcement element is removed after 1000ms", () => {
    render(<Harness />);

    pressF6();
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1001);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("a custom announce function replaces the English sentence", () => {
    render(<Harness announce={(group) => `Ahora en ${group}`} />);

    pressF6();

    expect(screen.getByRole("status")).toHaveTextContent("Ahora en main");
  });

  it("announce returning null suppresses the live region entirely", () => {
    render(<Harness announce={() => null} />);

    pressF6();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("a group with no focusable element receives focus itself via a temporary tabIndex", () => {
    render(<Harness withButtons={false} />);

    pressF6();

    const main = document.querySelector('[data-focus-group="main"]') as HTMLElement;

    expect(main).toHaveFocus();
    expect(main.tabIndex).toBe(-1);
    expect(main.hasAttribute("tabindex")).toBe(false);
  });

  it("a group that already carried a tabindex attribute gets it restored", () => {
    const Preset = () => {
      useFocusGroups();

      return <section data-focus-group="preset" tabIndex={5} />;
    };

    render(<Preset />);

    pressF6();

    const preset = document.querySelector('[data-focus-group="preset"]') as HTMLElement;

    expect(preset).toHaveFocus();
    expect(preset.getAttribute("tabindex")).toBe("5");
  });

  it("the live region is inserted empty and receives its text a frame later, so screen readers announce it", () => {
    const frames: FrameRequestCallback[] = [];

    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);

      return frames.length;
    });
    render(<Harness />);

    pressF6();

    const region = screen.getByRole("status");

    expect(region).toHaveTextContent("");

    act(() => {
      for (const frame of frames) {
        frame(0);
      }
    });
    expect(region).toHaveTextContent("Moved to main");
  });

  it("F6 steps from the group that actually holds focus, not from the last F6 target", () => {
    render(<Harness />);

    screen.getByRole("button", { name: "main action" }).focus();
    pressF6();

    expect(screen.getByRole("button", { name: "header action" })).toHaveFocus();
  });

  it("Shift+F6 steps backward from the focused group even when the stored index points elsewhere", () => {
    render(<Harness />);

    pressF6();
    expect(screen.getByRole("button", { name: "main action" })).toHaveFocus();

    screen.getByRole("button", { name: "header action" }).focus();
    pressF6(true);

    expect(screen.getByRole("button", { name: "main action" })).toHaveFocus();
  });

  it("F6 with no groups on the page leaves the browser's own F6 behavior alone", () => {
    const Groupless = () => {
      useFocusGroups();

      return <div>no groups here</div>;
    };

    render(<Groupless />);

    const notPrevented = fireEvent.keyDown(document, { key: "F6" });

    expect(notPrevented).toBe(true);
  });

  it("two mounted instances announce one F6 press exactly once", () => {
    const Twice = () => {
      useFocusGroups();
      useFocusGroups();

      return (
        <main data-focus-group="main">
          <button>main action</button>
        </main>
      );
    };

    render(<Twice />);

    pressF6();

    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("non-F6 keys are ignored", () => {
    render(<Harness />);

    fireEvent.keyDown(document, { key: "F5" });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("F6 on a page without groups does nothing", () => {
    const Groupless = () => {
      useFocusGroups();

      return <div>no groups here</div>;
    };

    render(<Groupless />);

    pressF6();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("unmounting removes the keydown listener", () => {
    const { unmount } = render(<Harness />);

    unmount();

    pressF6();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
