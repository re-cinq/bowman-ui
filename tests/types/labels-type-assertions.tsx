// Compiled by tests/labels-dist.test.ts with tsc --noEmit against the BUILT
// package: the self-referencing "@re-cinq/bowman-ui" import resolves through
// package.json's "." exports entry to dist/index.d.ts. Proves resolveLabels,
// ErrorBoundaryLabels and defaultErrorBoundaryLabels all reach a consumer,
// and pins the convention's compile-time guarantee: a key added to a labels
// interface without a default cannot satisfy Readonly<Required<XLabels>>.
import {
  ErrorBoundary,
  defaultErrorBoundaryLabels,
  resolveLabels,
  type ErrorBoundaryLabels,
} from "@re-cinq/bowman-ui";

const resolved: Required<ErrorBoundaryLabels> = resolveLabels(
  defaultErrorBoundaryLabels,
  {
    title: "Algo salió mal",
    retry: undefined,
  },
);

const complete = defaultErrorBoundaryLabels satisfies Readonly<
  Required<ErrorBoundaryLabels>
>;

// @ts-expect-error -- a labels key without a default must not compile: an
// object missing `retry` is not a Readonly<Required<ErrorBoundaryLabels>>.
// This is what "adding a key to ErrorBoundaryLabels without extending
// defaultErrorBoundaryLabels fails npm run typecheck" looks like from outside.
const incomplete: Readonly<Required<ErrorBoundaryLabels>> = {
  title: "Something went wrong",
  description: "An unexpected error occurred. Please try again.",
};

const Consumer = () => (
  <ErrorBoundary labels={{ title: resolved.title }}>
    <span
      data-complete={complete === defaultErrorBoundaryLabels}
      data-title={incomplete.title}
    />
  </ErrorBoundary>
);

void Consumer;
