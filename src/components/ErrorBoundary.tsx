"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { WarningIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import { FOCUS_VISIBLE_RING_COLOR } from "../theme/tokens.js";

export interface ErrorBoundaryLabels {
  title: string;
  description: string;
  retry: string;
}

// Labels convention worked example (design-notes § Labels): a key without a default fails to compile here.
export const defaultErrorBoundaryLabels: Readonly<Required<ErrorBoundaryLabels>> = Object.freeze({
  title: "Something went wrong",
  description: "An unexpected error occurred. Please try again.",
  retry: "Try again",
});

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the built-in fallback, its role="alert" wrapper included (re-add it to announce); wins over labels. */
  fallback?: ReactNode;
  /** Overrides the built-in fallback's strings; English defaults apply per key. */
  labels?: Partial<ErrorBoundaryLabels>;
  /** The only error reporting channel; the boundary itself never writes to the console. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const labels = resolveLabels(defaultErrorBoundaryLabels, this.props.labels);

    return (
      <div
        role="alert"
        className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center"
      >
        <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <WarningIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {labels.title}
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{labels.description}</p>
        <button
          type="button"
          onClick={this.handleRetry}
          className={`rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:ring-2 ${FOCUS_VISIBLE_RING_COLOR} focus-visible:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200`}
        >
          {labels.retry}
        </button>
      </div>
    );
  }
}
