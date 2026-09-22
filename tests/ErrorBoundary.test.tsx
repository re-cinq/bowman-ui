import { render, screen, fireEvent } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "../src/components/ErrorBoundary.js";
import { expectDanger, expectDangerSoft, expectTextStrong } from "./helpers/expect-theme-tokens.js";

const Bomb = ({ error }: { error: Error }) => {
  throw error;
};

// The wrapper's capture-phase click counts the retry, so the boundary's own
// button is what swaps the throwing child for the recovered content; the
// buttons around the boundary are focusable siblings the retry must not pick.
const Recoverable = ({ recovered }: { recovered: ReactNode }) => {
  const [attempt, setAttempt] = useState(0);

  return (
    <div onClickCapture={() => setAttempt((count) => count + 1)}>
      <button type="button">before</button>
      <ErrorBoundary>
        {attempt === 0 ? <Bomb error={new Error("first render")} /> : recovered}
      </ErrorBoundary>
      <button type="button">after</button>
    </div>
  );
};

const RetryableBomb = () => {
  const [armed, setArmed] = useState(true);

  if (armed) {
    return (
      <ErrorBoundary
        fallback={
          <button
            onClick={() => {
              setArmed(false);
            }}
          >
            defuse
          </button>
        }
      >
        <Bomb error={new Error("armed")} />
      </ErrorBoundary>
    );
  }

  return <p>recovered</p>;
};

const silenced = { onCaughtError: () => {} };

describe("ErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>all is well</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("all is well")).toBeInTheDocument();
  });

  it("a throwing child renders the role=alert fallback with the three English defaults", () => {
    render(
      <ErrorBoundary>
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Something went wrong");
    expect(alert).toHaveTextContent("An unexpected error occurred. Please try again.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("the fallback heading reads the strong text token, so a consumer recolours it with the theme", () => {
    render(
      <ErrorBoundary>
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    expectTextStrong(screen.getByRole("heading", { name: "Something went wrong" }));
  });

  it("the error icon circle and glyph read the danger role, not the red palette classes", () => {
    render(
      <ErrorBoundary>
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );
    const alert = screen.getByRole("alert");

    expectDangerSoft(alert.querySelector(".rounded-full"));
    expectDanger(alert.querySelector("svg"));
  });

  it("labels override the defaults per key and no English remains", () => {
    render(
      <ErrorBoundary
        labels={{
          title: "Algo salió mal",
          description: "Inténtalo de nuevo más tarde.",
          retry: "Reintentar",
        }}
      >
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Algo salió mal");
    expect(alert).toHaveTextContent("Inténtalo de nuevo más tarde.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(alert.textContent).not.toMatch(/Something went wrong|Try again/);
  });

  it("an explicit undefined label - a consumer's missed catalogue lookup - falls back to the English default", () => {
    render(
      <ErrorBoundary labels={{ title: undefined, retry: "Reintentar" }}>
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("a fallback node wins over labels", () => {
    render(
      <ErrorBoundary fallback={<p>custom fallback</p>} labels={{ title: "ignored" }}>
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    expect(screen.getByText("custom fallback")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("the retry button re-renders children", () => {
    render(<Recoverable recovered={<p>second attempt</p>} />, silenced);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("second attempt")).toBeInTheDocument();
  });

  it("the retry button inside a consumer form retries without submitting it, and a child that throws again leaves focus on the fresh retry button", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => {
      event.preventDefault();
    });

    render(
      <form onSubmit={onSubmit}>
        <ErrorBoundary>
          <Bomb error={new Error("boom")} />
        </ErrorBoundary>
      </form>,
      silenced
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Try again" }));
  });

  it("a custom fallback can drive recovery", () => {
    render(<RetryableBomb />, silenced);

    fireEvent.click(screen.getByRole("button", { name: "defuse" }));

    expect(screen.getByText("recovered")).toBeInTheDocument();
  });

  it("the retry button keeps focus-visible:ring-2 beside the --bowman-focus-ring colour, with no dark ring", () => {
    render(
      <ErrorBoundary>
        <Bomb error={new Error("kaputt")} />
      </ErrorBoundary>,
      silenced
    );

    expect(screen.getByRole("button", { name: "Try again" })).toHaveClass(
      "focus-visible:ring-2",
      "focus-visible:ring-(--bowman-focus-ring,var(--color-blue-500))"
    );
    expect(screen.getByRole("button", { name: "Try again" }).className).not.toMatch(
      /focus-visible:ring-blue-500|dark:focus-visible:ring/
    );
  });

  it("reports only through onError and writes nothing to the console or localStorage", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    localStorage.clear();
    const onError = vi.fn();
    const bookingError = new Error("booking 4711 not found");

    render(
      <ErrorBoundary onError={onError}>
        <Bomb error={bookingError} />
      </ErrorBoundary>,
      silenced
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      bookingError,
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    vi.restoreAllMocks();
  });

  describe("focus after retry", () => {
    const retryInto = async (recovered: ReactNode): Promise<HTMLElement> => {
      const user = userEvent.setup();
      const { container } = render(<Recoverable recovered={recovered} />, silenced);

      await user.click(screen.getByRole("button", { name: "Try again" }));

      return container;
    };

    it('clicking "Try again" moves focus to the first focusable element of the recovered children, past the focusable siblings before and after the boundary', async () => {
      await retryInto(
        <>
          <p>second attempt</p>
          <button type="button">recovered</button>
        </>
      );

      expect(document.activeElement).toBe(screen.getByRole("button", { name: "recovered" }));
    });

    it("recovered children without a focusable element leave document.activeElement on body and write no tabindex into the consumer's DOM", async () => {
      const container = await retryInto(<p>second attempt</p>);

      expect(screen.getByText("second attempt")).toBeInTheDocument();
      expect(document.activeElement).toBe(document.body);
      expect(container.querySelector("[tabindex]")).toBeNull();
    });

    it("an autoFocus input among the recovered children keeps the focus it took during the commit", async () => {
      await retryInto(
        <>
          <button type="button">recovered</button>
          <input autoFocus aria-label="Reintentar con" />
        </>
      );

      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Reintentar con" }));
    });

    it("recovered children rooted in a <div> - the host node React reuses from the fallback - still get the focus", async () => {
      await retryInto(
        <div>
          <button type="button">recovered</button>
        </div>
      );

      expect(document.activeElement).toBe(screen.getByRole("button", { name: "recovered" }));
    });
  });
});
