"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export interface ErrorBoundaryLabels {
  title: string;
  description: string;
  retry: string;
}

const defaultLabels: ErrorBoundaryLabels = {
  title: "Something went wrong",
  description: "An unexpected error occurred. Please try again.",
  retry: "Try again",
};

interface Props {
  children: ReactNode;
  /** Replaces the built-in fallback UI entirely - including its `role="alert"`
   *  wrapper, which the consumer must re-add if screen readers should announce
   *  the failure; wins over `labels`. */
  fallback?: ReactNode;
  /** Overrides the built-in fallback's strings; English defaults apply per key. */
  labels?: Partial<ErrorBoundaryLabels>;
  /** The only error reporting channel; the boundary itself never writes to the console. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
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
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const labels = { ...defaultLabels, ...this.props.labels };

      return (
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center"
        >
          <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {labels.title}
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{labels.description}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {labels.retry}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
