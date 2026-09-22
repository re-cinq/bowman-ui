"use client";

import type { ReactNode } from "react";
import { resolveLabels } from "../labels.js";
import type { ToolChatEntry } from "../types/chat.js";
import { TEXT_BODY, TEXT_MUTED, TEXT_SECONDARY } from "../theme/tokens.js";

export interface ToolActivityLabels {
  activity: string;
  activityDone: string;
  details: string;
  toolInputUnavailable: string;
}

export const defaultToolActivityLabels: Readonly<Required<ToolActivityLabels>> = Object.freeze({
  activity: "Looking something up",
  activityDone: "Looked something up",
  details: "Details",
  toolInputUnavailable: "Arguments could not be shown",
});

export interface ToolActivityProps {
  entry: ToolChatEntry;
  /** Replaces the default sentence (name and input still opt-in); receives the resolved pending so tense can match. */
  describeTool?: (entry: ToolChatEntry, pending: boolean) => ReactNode;
  /** The call is still in flight. Default false: `ChatMessageList` derives it from `busy`. */
  pending?: boolean;
  /** Reveals `entry.toolName`, an English machine identifier. Default false. */
  showToolName?: boolean;
  /** Reveals `entry.toolInput` as JSON behind a disclosure. Default false. */
  showToolInput?: boolean;
  icon?: ReactNode;
  /** Overrides the component's strings; English defaults apply per key. */
  labels?: Partial<ToolActivityLabels>;
}

const headlineFor = (
  resolved: Required<ToolActivityLabels>,
  entry: ToolChatEntry,
  pending: boolean,
  describeTool?: (entry: ToolChatEntry, pending: boolean) => ReactNode
): ReactNode => {
  if (describeTool) {
    return describeTool(entry, pending);
  }

  return pending ? resolved.activity : resolved.activityDone;
};

// Null when the arguments cannot be serialised (BigInt, cycle, throwing or undefined-yielding toJSON).
const toolInputJson = (input: Record<string, unknown>): string | null => {
  try {
    return JSON.stringify(input, null, 2) ?? null;
  } catch {
    return null;
  }
};

// Not a message; name and arguments are opt-in per prop, shown as JSON in a <details>, never markdown or HTML.
export function ToolActivity({
  entry,
  describeTool,
  pending = false,
  showToolName = false,
  showToolInput = false,
  icon,
  labels,
}: ToolActivityProps) {
  const resolved = resolveLabels(defaultToolActivityLabels, labels);
  const headline = headlineFor(resolved, entry, pending, describeTool);

  return (
    <div className={`flex w-full items-start gap-3 text-sm ${TEXT_MUTED}`}>
      {icon && (
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-black"
        >
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1 py-1">
        <span>{headline}</span>
        {showToolName && (
          <code className={`font-mono text-xs ${TEXT_SECONDARY}`}>{entry.toolName}</code>
        )}
        {showToolInput && (
          <details className="text-xs">
            <summary className={`cursor-pointer ${TEXT_MUTED}`}>{resolved.details}</summary>
            <pre
              className={`mt-1 overflow-x-auto rounded bg-slate-100 p-2 font-mono ${TEXT_BODY} dark:bg-slate-800`}
            >
              {toolInputJson(entry.toolInput) ?? resolved.toolInputUnavailable}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
