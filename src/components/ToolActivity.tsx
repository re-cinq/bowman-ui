"use client";

import type { ReactNode } from "react";
import { resolveLabels } from "../labels.js";
import type { ToolChatEntry } from "../types/chat.js";

export interface ToolActivityLabels {
  activity: string;
  activityDone: string;
  details: string;
}

export const defaultToolActivityLabels: Readonly<Required<ToolActivityLabels>> = Object.freeze({
  activity: "Looking something up",
  activityDone: "Looked something up",
  details: "Details",
});

export interface ToolActivityProps {
  entry: ToolChatEntry;
  /** Replaces the default sentence with a caller-authored one; still no tool name or input unless opted in. */
  describeTool?: (entry: ToolChatEntry) => ReactNode;
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
  describeTool?: (entry: ToolChatEntry) => ReactNode
): ReactNode => {
  if (describeTool) {
    return describeTool(entry);
  }
  return pending ? resolved.activity : resolved.activityDone;
};

// A tool invocation the model requested on the customer's behalf. It is not a
// message: no avatar, copy or feedback affordance. The default withholds the
// tool name (an English machine identifier in a Danish-first product) and the
// arguments (model-authored data that may carry a booking reference or a
// customer identifier); a consumer opts each in per prop. Arguments, when
// shown, are JSON in a <pre> behind a native <details> - never markdown or
// HTML - so nothing model-authored is interpreted.
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
    <div className="flex w-full items-start gap-3 text-sm text-slate-500 dark:text-slate-400">
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
          <code className="font-mono text-xs text-slate-600 dark:text-slate-300">
            {entry.toolName}
          </code>
        )}
        {showToolInput && (
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 dark:text-slate-400">
              {resolved.details}
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {JSON.stringify(entry.toolInput, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
