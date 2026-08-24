import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { ErrorBoundary } from "../src/components/ErrorBoundary.js";

const Bomb = ({ error }: { error: Error }) => {
  throw error;
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

  it("labels override the defaults per key and no English remains", () => {
    render(
      <ErrorBoundary
        labels={{ title: "Noget gik galt", description: "Prøv igen senere.", retry: "Prøv igen" }}
      >
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Noget gik galt");
    expect(alert).toHaveTextContent("Prøv igen senere.");
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeInTheDocument();
    expect(alert.textContent).not.toMatch(/Something went wrong|Try again/);
  });

  it("an explicit undefined label - a consumer's missed catalogue lookup - falls back to the English default", () => {
    render(
      <ErrorBoundary labels={{ title: undefined, retry: "Prøv igen" }}>
        <Bomb error={new Error("boom")} />
      </ErrorBoundary>,
      silenced
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeInTheDocument();
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
    const Recoverable = () => {
      const [attempt, setAttempt] = useState(0);
      return (
        <div onClickCapture={() => setAttempt((n) => n + 1)}>
          <ErrorBoundary>
            {attempt === 0 ? <Bomb error={new Error("first render")} /> : <p>second attempt</p>}
          </ErrorBoundary>
        </div>
      );
    };
    render(<Recoverable />, silenced);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("second attempt")).toBeInTheDocument();
  });

  it("a custom fallback can drive recovery", () => {
    render(<RetryableBomb />, silenced);

    fireEvent.click(screen.getByRole("button", { name: "defuse" }));

    expect(screen.getByText("recovered")).toBeInTheDocument();
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
});
