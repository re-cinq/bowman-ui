/**
 * The Toast characterization suite. The class assertion pins the
 * bowman-toast-fade-in animation class (the naming decision is tabled in
 * specs/bowman-ui-toast/spec.md), and the divergence, message-restart and
 * duration-null tests pin the re-render-proof timer.
 */
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Toast } from "../src/index.js";
import { listFiles } from "./helpers/source-hygiene.js";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders "Booking 4711 guardado" inside an element with role="status" and aria-live="polite"', () => {
    render(<Toast message="Booking 4711 guardado" onClose={() => {}} />);

    const status = screen.getByRole("status");

    expect(status).toHaveTextContent("Booking 4711 guardado");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("the visible pill carries the message from the first render while the status region starts empty - the announcement text enters a live region that already exists", () => {
    const serverHtml = renderToStaticMarkup(
      <Toast message="Booking 4711 guardado" onClose={() => {}} />
    );

    expect(serverHtml).toContain("Booking 4711 guardado");
    expect(serverHtml).toMatch(/role="status"[^>]*><\/div>/);
  });

  it("the status region is a separate element hidden by the stylesheet's bowman-sr-only class", () => {
    render(<Toast message="Booking 4711 guardado" onClose={() => {}} />);

    const status = screen.getByRole("status");

    expect(status).not.toHaveClass("bowman-toast-fade-in");
    expect(status).toHaveClass("bowman-sr-only");
  });

  it("with no duration prop, onClose is uncalled at 1999ms and called once at 2000ms", () => {
    const onClose = vi.fn();

    render(<Toast message="Booking 4711 guardado" onClose={onClose} />);

    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("duration={500} fires onClose at 500ms", () => {
    const onClose = vi.fn();

    render(<Toast message="Booking 4711 guardado" onClose={onClose} duration={500} />);

    vi.advanceTimersByTime(499);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("unmounting before the deadline never calls onClose", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="Booking 4711 guardado" onClose={onClose} />);

    vi.advanceTimersByTime(1000);
    unmount();
    vi.advanceTimersByTime(5000);

    expect(onClose).not.toHaveBeenCalled();
  });

  // Re-pinned by the 2026-08-26 review: the positioning classes moved from
  // the status element to a dedicated visible pill, so an empty live region
  // never paints as an empty pill on the first frame.
  it("the visible pill carries bowman-toast-fade-in and the fixed bottom-8 left-1/2 z-50 -translate-x-1/2 positioning, and is not the live region", () => {
    render(<Toast message="Booking 4711 guardado" onClose={() => {}} />);

    const visible = screen.getByText("Booking 4711 guardado", {
      selector: "div.bowman-toast-fade-in",
    });

    expect(visible).toHaveClass(
      "bowman-toast-fade-in",
      "fixed",
      "bottom-8",
      "left-1/2",
      "z-50",
      "-translate-x-1/2"
    );
    expect(visible).not.toHaveAttribute("role");
    expect(visible).toHaveAttribute("aria-hidden", "true");
  });

  it("a new onClose identity at 1000ms does not restart the countdown: the latest onClose fires once at 2000ms total", () => {
    const staleOnClose = vi.fn();
    const latestOnClose = vi.fn();
    const { rerender } = render(<Toast message="Booking 4711 guardado" onClose={staleOnClose} />);

    vi.advanceTimersByTime(1000);
    rerender(<Toast message="Booking 4711 guardado" onClose={latestOnClose} />);

    vi.advanceTimersByTime(999);
    expect(latestOnClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(latestOnClose).toHaveBeenCalledTimes(1);
    expect(staleOnClose).not.toHaveBeenCalled();
  });

  it("re-rendering with a different message restarts the countdown: onClose fires 2000ms after the new message", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Toast message="Booking 4711 guardado" onClose={onClose} />);

    vi.advanceTimersByTime(1000);
    rerender(<Toast message="Booking 4712 guardado" onClose={onClose} />);

    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("duration={null} calls onClose zero times after 60000ms and never invokes setTimeout", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const onClose = vi.fn();

    render(<Toast message="Booking 4711 guardado" onClose={onClose} duration={null} />);

    vi.advanceTimersByTime(60000);

    expect(onClose).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });
});

describe("the Toast source", () => {
  const source = readFileSync(resolve(process.cwd(), "src/components/Toast.tsx"), "utf8");

  it("imports no @clerk, swr, next-intl, next/ or @/ and every relative import ends in .js", () => {
    expect(source).not.toMatch(/@clerk|swr|next-intl|next\/|@\//);

    for (const [, spec] of source.matchAll(/from\s+"(\.[^"]+)"/g)) {
      expect(spec).toMatch(/\.js$/);
    }
  });

  it("GDPR: references no console.*, localStorage, sessionStorage, fetch, sendBeacon or clipboard", () => {
    expect(source).not.toMatch(/console\.|localStorage|sessionStorage|fetch|sendBeacon|clipboard/i);
  });

  it('grep for "animate-fade-in" in src/ returns nothing', () => {
    const hits = listFiles(resolve(process.cwd(), "src")).filter((file) =>
      readFileSync(file, "utf8").includes("animate-fade-in")
    );

    expect(hits).toEqual([]);
  });
});
