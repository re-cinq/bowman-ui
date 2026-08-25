/**
 * The 015 characterization suite for Toast, ported against the extracted
 * component (issue 025). Four of the five source assertions survive
 * verbatim; the class assertion flips from animate-fade-in to
 * bowman-toast-fade-in (019's rename, tabled in
 * specs/bowman-ui-toast/spec.md). The divergence, message-restart and
 * duration-null tests are new: they pin the re-render-proof timer the
 * source component did not have.
 */
import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { Toast } from "../src/index.js";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders "Booking 4711 gemt" inside an element with role="status" and aria-live="polite"', () => {
    render(<Toast message="Booking 4711 gemt" onClose={() => {}} />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Booking 4711 gemt");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("with no duration prop, onClose is uncalled at 1999ms and called once at 2000ms", () => {
    const onClose = vi.fn();
    render(<Toast message="Booking 4711 gemt" onClose={onClose} />);

    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("duration={500} fires onClose at 500ms", () => {
    const onClose = vi.fn();
    render(<Toast message="Booking 4711 gemt" onClose={onClose} duration={500} />);

    vi.advanceTimersByTime(499);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("unmounting before the deadline never calls onClose", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="Booking 4711 gemt" onClose={onClose} />);

    vi.advanceTimersByTime(1000);
    unmount();
    vi.advanceTimersByTime(5000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("the rendered element carries bowman-toast-fade-in and the fixed bottom-8 left-1/2 z-50 -translate-x-1/2 positioning", () => {
    render(<Toast message="Booking 4711 gemt" onClose={() => {}} />);

    expect(screen.getByRole("status")).toHaveClass(
      "bowman-toast-fade-in",
      "fixed",
      "bottom-8",
      "left-1/2",
      "z-50",
      "-translate-x-1/2"
    );
  });

  it("a new onClose identity at 1000ms does not restart the countdown: the latest onClose fires once at 2000ms total", () => {
    const staleOnClose = vi.fn();
    const latestOnClose = vi.fn();
    const { rerender } = render(<Toast message="Booking 4711 gemt" onClose={staleOnClose} />);

    vi.advanceTimersByTime(1000);
    rerender(<Toast message="Booking 4711 gemt" onClose={latestOnClose} />);

    vi.advanceTimersByTime(999);
    expect(latestOnClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(latestOnClose).toHaveBeenCalledTimes(1);
    expect(staleOnClose).not.toHaveBeenCalled();
  });

  it("re-rendering with a different message restarts the countdown: onClose fires 2000ms after the new message", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Toast message="Booking 4711 gemt" onClose={onClose} />);

    vi.advanceTimersByTime(1000);
    rerender(<Toast message="Booking 4712 gemt" onClose={onClose} />);

    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("duration={null} calls onClose zero times after 60000ms and never invokes setTimeout", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const onClose = vi.fn();
    render(<Toast message="Booking 4711 gemt" onClose={onClose} duration={null} />);

    vi.advanceTimersByTime(60000);

    expect(onClose).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });
});

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : [join(dir, entry.name)]
  );

describe("the Toast source", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/Toast.tsx"), "utf8");

  it("imports no @clerk, swr, next-intl, next/, @discovery or @/ and every relative import ends in .js", () => {
    expect(source).not.toMatch(/@clerk|swr|next-intl|next\/|@discovery|@\//);
    for (const [, spec] of source.matchAll(/from\s+"(\.[^"]+)"/g)) {
      expect(spec).toMatch(/\.js$/);
    }
  });

  it("GDPR: references no console.*, localStorage, sessionStorage, fetch, sendBeacon or clipboard", () => {
    expect(source).not.toMatch(/console\.|localStorage|sessionStorage|fetch|sendBeacon|clipboard/i);
  });

  it('grep for "animate-fade-in" in src/ returns nothing', () => {
    const hits = sourceFiles(resolve(process.cwd(), "src")).filter((file) =>
      readFileSync(file, "utf8").includes("animate-fade-in")
    );
    expect(hits).toEqual([]);
  });
});
