"use client";

import { Component, type ErrorInfo, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { FOCUSABLE_SELECTOR } from "../hooks/focusableSelector.js";
import { focusWithTransientTabIndex } from "../hooks/focusWithTransientTabIndex.js";
import { WarningIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import {
  DANGER,
  DANGER_SOFT,
  FOCUS_VISIBLE_RING_COLOR,
  TEXT_SECONDARY,
  TEXT_STRONG,
} from "../theme/tokens.js";

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

// A mounted node always has a parent: React inserts the DOM before it runs any handler.
const parentOf = (node: Node): ParentNode => node.parentNode as ParentNode;

// The recovered children stand after the fallback's previous sibling and before any sibling that outlives the swap.
interface FallbackNeighbours {
  container: ParentNode;
  before: ChildNode | null;
  siblings: Set<Node>;
}

const neighboursOf = (fallbackRoot: Node): FallbackNeighbours => {
  const container = parentOf(fallbackRoot);
  const siblings = new Set<Node>(container.childNodes);

  siblings.delete(fallbackRoot);

  return { container, before: fallbackRoot.previousSibling, siblings };
};

// React reuses the fallback's host node for a same-typed child, so a set difference would miss it.
const nodesBetween = ({ container, before, siblings }: FallbackNeighbours): Node[] => {
  const nodes: Node[] = [];
  let node = before ? before.nextSibling : container.firstChild;

  while (node && !siblings.has(node)) {
    nodes.push(node);
    node = node.nextSibling;
  }

  return nodes;
};

const isElement = (node: Node): node is HTMLElement | SVGElement =>
  node instanceof HTMLElement || node instanceof SVGElement;

// Focuses the first focusable among the recovered children unless one already holds focus (autoFocus); none focuses their first element node.
const focusRecoveredChildren = (neighbours: FallbackNeighbours) => {
  const recovered = nodesBetween(neighbours);
  const holdsFocus = (node: Node) => node.contains(document.activeElement);

  if (recovered.some(holdsFocus)) {
    return;
  }
  const focusable = Array.from(
    neighbours.container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).find((element) => recovered.some((node) => node.contains(element)));

  if (focusable) {
    focusable.focus();

    return;
  }
  const firstElement = recovered.find(isElement);

  if (firstElement) {
    focusWithTransientTabIndex(firstElement);
  }
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  // The button sits directly under the fallback root; the neighbours are read before the swap.
  handleRetry = (event: MouseEvent<HTMLButtonElement>) => {
    const neighbours = neighboursOf(parentOf(event.currentTarget));

    flushSync(() => this.setState({ hasError: false }));
    focusRecoveredChildren(neighbours);
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
        <div className={`mb-4 rounded-full p-3 ${DANGER_SOFT}`}>
          <WarningIcon className={`h-6 w-6 ${DANGER}`} />
        </div>
        <h2 className={`mb-2 text-lg font-semibold ${TEXT_STRONG}`}>{labels.title}</h2>
        <p className={`mb-4 text-sm ${TEXT_SECONDARY}`}>{labels.description}</p>
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
