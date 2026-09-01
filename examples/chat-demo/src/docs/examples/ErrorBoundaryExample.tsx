import { useState } from "react";
import { ErrorBoundary } from "@re-cinq/bowman-ui";

function BreakOnDemand({ broken, onBreak }: { broken: boolean; onBreak: () => void }) {
  if (broken) {
    throw new Error("A render failed");
  }
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
      onClick={onBreak}
    >
      Throw during render
    </button>
  );
}

export function ErrorBoundaryExample() {
  const [broken, setBroken] = useState(false);

  // Resetting from onError is what makes the fallback's retry button work: the
  // boundary re-renders its children, and a still-broken child throws again.
  return (
    <ErrorBoundary onError={() => setBroken(false)}>
      <BreakOnDemand broken={broken} onBreak={() => setBroken(true)} />
    </ErrorBoundary>
  );
}
