"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon, ThumbsDownIcon, ThumbsUpIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import {
  createMarkdownComponents,
  defaultMarkdownComponentsLabels,
} from "../markdown/components.js";
import {
  createUrlTransform,
  defaultMarkdownPolicy,
  type MarkdownPolicy,
} from "../markdown/urlPolicy.js";
import type { AssistantChatEntry, UserChatEntry } from "../types/chat.js";
import { InlineThinkingIndicator } from "./InlineThinkingIndicator.js";

export interface ChatMessageLabels {
  userMessage: string;
  assistantMessage: string;
  /**
   * The article's accessible name when `assistantName` is set - the
   * function form docs/design-notes.md § Labels decision 4 requires of an
   * interpolated label.
   */
  assistantMessageFrom: (name: string) => string;
  copy: string;
  copied: string;
  copiedNotice: string;
  feedbackPositive: string;
  feedbackNegative: string;
  feedbackNotice: string;
  thinking: string;
  linkOpensInNewTab: string;
}

// The keyboard shortcuts are off by default (arrowKeyFeedback), so the
// default aria-label and thumb labels carry no shortcut parentheticals; a
// consumer that re-enables the shortcuts supplies labels that mention them.
export const defaultChatMessageLabels: Readonly<Required<ChatMessageLabels>> = Object.freeze({
  userMessage: "Your message",
  assistantMessage: "Assistant response",
  assistantMessageFrom: (name: string) => `Response from ${name}`,
  copy: "Copy message",
  copied: "Copied",
  copiedNotice: "Copied!",
  feedbackPositive: "Good response",
  feedbackNegative: "Bad response",
  feedbackNotice: "Thanks!",
  thinking: "Thinking",
  linkOpensInNewTab: defaultMarkdownComponentsLabels.linkOpensInNewTab,
});

export interface ChatMessageProps {
  /**
   * The turn to render. Only user and assistant entries are renderable: a
   * `ThinkingChatEntry` or `ToolChatEntry` is a compile error, never a
   * silent `null` render, so tool arguments cannot reach a customer's
   * screen by accident.
   */
  entry: UserChatEntry | AssistantChatEntry;
  userInitials: string;
  /** Fills the assistant avatar circle; the circle renders empty without it. */
  assistantAvatar?: ReactNode;
  /**
   * Who answered, rendered as a name line above the response and as the
   * article's accessible name through `assistantMessageFrom`. Ignored for a
   * user entry. The avatar is decorative, so this line is the only place
   * authorship reaches assistive technology.
   */
  assistantName?: string;
  /** Shows the thumb buttons and gates the feedback keyboard path. Default true. */
  showFeedback?: boolean;
  /**
   * Opt-in ArrowUp/ArrowDown feedback shortcuts on a focused assistant
   * message. Off by default: the shortcuts preventDefault the scroll keys.
   */
  arrowKeyFeedback?: boolean;
  /** Rendered last in the message column, streaming or not. */
  footer?: ReactNode;
  /**
   * Overrides the link and image policy for the assistant markdown, field by
   * field over `defaultMarkdownPolicy` (https/mailto/tel links only, no
   * relative URLs, new tab, no images).
   */
  markdown?: MarkdownPolicy;
  /** Overrides the component's strings; English defaults apply per key. */
  labels?: Partial<ChatMessageLabels>;
  onCopy?: (text: string, entryId: string) => void;
  onFeedback?: (entryId: string, type: "up" | "down") => void;
}

const resolveArticleLabel = (
  entry: UserChatEntry | AssistantChatEntry,
  assistantName: string | undefined,
  resolved: Required<ChatMessageLabels>
): string => {
  if (entry.role === "user") {
    return resolved.userMessage;
  }
  if (!assistantName) {
    return resolved.assistantMessage;
  }
  return resolved.assistantMessageFrom(assistantName);
};

export function ChatMessage({
  entry,
  userInitials,
  assistantAvatar,
  assistantName,
  showFeedback = true,
  arrowKeyFeedback = false,
  footer,
  markdown,
  labels,
  onCopy,
  onFeedback,
}: ChatMessageProps) {
  const resolved = resolveLabels(defaultChatMessageLabels, labels);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<{ id: string; type: "up" | "down" } | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const copyToClipboard = useCallback(
    (text: string, entryId: string) => {
      // Optional-chained: an insecure-context browser has no
      // navigator.clipboard and is a supported consumer environment. A denied
      // permission rejects the promise; swallow it so no consumer window
      // error handler fires - onCopy still reports the attempt either way.
      navigator.clipboard?.writeText(text)?.catch?.(() => {});
      setCopiedId(entryId);
      // A rapid second copy replaces the pending timer instead of letting the
      // first one dismiss the new notice early.
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
      onCopy?.(text, entryId);
    },
    [onCopy]
  );

  const handleFeedback = useCallback(
    (entryId: string, type: "up" | "down") => {
      setFeedbackId({ id: entryId, type });
      onFeedback?.(entryId, type);
    },
    [onFeedback]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (entry.role !== "assistant" || entry.isStreaming) return;

      // Cmd/Ctrl + C stays unconditional: it steals no navigation key and
      // already yields to an active text selection. Lowercasing covers Caps
      // Lock ("C"); Shift and Alt stay excluded so Cmd+Shift+C (the browser's
      // inspect chord) keeps its meaning.
      if (
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        !e.altKey &&
        e.key.toLowerCase() === "c" &&
        !window.getSelection()?.toString()
      ) {
        e.preventDefault();
        copyToClipboard(entry.content, entry.id);
      }

      // Arrow handling requires BOTH terms: showFeedback off must silence
      // the keyboard path too, not just hide the thumbs.
      if (!showFeedback || !arrowKeyFeedback) return;

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleFeedback(entry.id, "up");
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        handleFeedback(entry.id, "down");
      }
    },
    [entry, showFeedback, arrowKeyFeedback, copyToClipboard, handleFeedback]
  );

  const ariaLabel = resolveArticleLabel(entry, assistantName, resolved);

  return (
    <article
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className="group w-full rounded-xl p-2 text-slate-800 ring-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100 dark:ring-offset-slate-950 dark:focus:ring-blue-400"
    >
      {entry.role === "user" ? (
        <UserMessage content={entry.content} userInitials={userInitials} />
      ) : (
        <AssistantMessage
          entry={entry}
          resolved={resolved}
          assistantName={assistantName}
          markdown={markdown}
          copiedId={copiedId}
          feedbackId={feedbackId}
          showFeedback={showFeedback}
          assistantAvatar={assistantAvatar}
          footer={footer}
          onCopy={copyToClipboard}
          onFeedback={handleFeedback}
        />
      )}
    </article>
  );
}

interface UserMessageProps {
  content: string;
  userInitials: string;
}

function UserMessage({ content, userInitials }: UserMessageProps) {
  return (
    <div className="flex w-full flex-row-reverse items-start gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
        {userInitials}
      </div>
      <div className="relative max-w-[80%] rounded-3xl bg-slate-100 px-5 py-3.5 dark:bg-slate-800">
        <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
      </div>
    </div>
  );
}

interface AssistantMessageProps {
  entry: AssistantChatEntry;
  resolved: Required<ChatMessageLabels>;
  assistantName?: string;
  markdown?: MarkdownPolicy;
  copiedId: string | null;
  feedbackId: { id: string; type: "up" | "down" } | null;
  showFeedback: boolean;
  assistantAvatar?: ReactNode;
  footer?: ReactNode;
  onCopy: (text: string, entryId: string) => void;
  onFeedback: (entryId: string, type: "up" | "down") => void;
}

function AssistantMessage({
  entry,
  resolved,
  assistantName,
  markdown,
  copiedId,
  feedbackId,
  showFeedback,
  assistantAvatar,
  footer,
  onCopy,
  onFeedback,
}: AssistantMessageProps) {
  // The memo keys on the resolved policy fields rather than the `markdown`
  // object, so an inline `markdown={{...}}` literal does not hand ReactMarkdown
  // fresh component identities - and a remounted markdown subtree - on every
  // streaming token.
  const { allowedSchemes, allowRelativeUrls, linkTarget, allowImages } = resolveLabels(
    defaultMarkdownPolicy,
    markdown
  );
  const schemesKey = JSON.stringify(allowedSchemes);
  const linkOpensInNewTab = resolved.linkOpensInNewTab;
  const { components, urlTransform } = useMemo(() => {
    const policy = {
      allowedSchemes: JSON.parse(schemesKey) as string[],
      allowRelativeUrls,
      linkTarget,
      allowImages,
    };
    return {
      components: createMarkdownComponents({ policy, labels: { linkOpensInNewTab } }),
      urlTransform: createUrlTransform(policy),
    };
  }, [schemesKey, allowRelativeUrls, linkTarget, allowImages, linkOpensInNewTab]);

  // Once content or tool status has appeared for THIS entry id, never show
  // the thinking indicator again. The latch is keyed by entry.id and reset
  // on an id change: a consumer typically keys its message list by id, but
  // a library cannot assume every consumer does.
  const latch = useRef({ id: entry.id, hasReceivedContent: false });
  if (latch.current.id !== entry.id) {
    latch.current = { id: entry.id, hasReceivedContent: false };
  }
  if (entry.content || entry.toolStatus) {
    latch.current.hasReceivedContent = true;
  }

  return (
    <div className="flex w-full items-start gap-4">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${entry.isStreaming ? "bowman-pulse-subtle border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-black"}`}
      >
        {assistantAvatar}
      </div>
      <div className="flex min-w-0 max-w-full flex-col gap-2">
        {assistantName && (
          <span className="pt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            {assistantName}
          </span>
        )}
        <div className="max-w-none overflow-x-auto pt-1 text-sm leading-6">
          {entry.toolStatus && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
              <span>{entry.toolStatus}</span>
            </div>
          )}
          {entry.content && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={components}
              urlTransform={urlTransform}
            >
              {entry.content}
            </ReactMarkdown>
          )}
          {entry.isStreaming && !latch.current.hasReceivedContent && (
            <InlineThinkingIndicator labels={{ thinking: resolved.thinking }} />
          )}
        </div>

        {!entry.isStreaming && (
          <div className="-ml-1 flex items-center gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 ring-offset-2 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus:ring-blue-400"
              onClick={() => onCopy(entry.content, entry.id)}
              aria-label={copiedId === entry.id ? resolved.copied : resolved.copy}
            >
              {copiedId === entry.id ? (
                <CheckIcon className="h-4 w-4 text-green-500" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </button>
            {copiedId === entry.id && (
              <span className="bowman-fade-in text-xs text-slate-400 dark:text-slate-500">
                {resolved.copiedNotice}
              </span>
            )}

            {showFeedback && (
              <>
                <button
                  type="button"
                  className={`rounded p-1.5 ring-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-slate-950 dark:focus:ring-blue-400 ${
                    feedbackId?.id === entry.id && feedbackId.type === "up"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  }`}
                  onClick={() => onFeedback(entry.id, "up")}
                  aria-label={resolved.feedbackPositive}
                  aria-pressed={feedbackId?.id === entry.id && feedbackId.type === "up"}
                >
                  <ThumbsUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`rounded p-1.5 ring-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-slate-950 dark:focus:ring-blue-400 ${
                    feedbackId?.id === entry.id && feedbackId.type === "down"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  }`}
                  onClick={() => onFeedback(entry.id, "down")}
                  aria-label={resolved.feedbackNegative}
                  aria-pressed={feedbackId?.id === entry.id && feedbackId.type === "down"}
                >
                  <ThumbsDownIcon className="h-4 w-4" />
                </button>
                {feedbackId?.id === entry.id && (
                  <span className="bowman-fade-in ml-1 text-xs text-slate-400 dark:text-slate-500">
                    {resolved.feedbackNotice}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}
