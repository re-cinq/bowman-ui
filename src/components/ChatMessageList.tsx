"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type UIEvent,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { resolveLabels } from "../labels.js";
import type { MarkdownPolicy } from "../markdown/urlPolicy.js";
import type { AssistantChatEntry, UserChatEntry } from "../types/chat.js";
import { ChatMessage, defaultChatMessageLabels, type ChatMessageLabels } from "./ChatMessage.js";
import {
  ThinkingIndicator,
  defaultThinkingIndicatorLabels,
  type ThinkingIndicatorLabels,
} from "./ThinkingIndicator.js";

export interface ChatMessageListLabels extends ChatMessageLabels, ThinkingIndicatorLabels {
  /**
   * The EU AI Act disclosure line, rendered outside the scroll region in
   * every state. Required with no default: no English placeholder may
   * reach a Danish customer (CONTRACT.md § Labels decision 5).
   */
  aiDisclosure: string;
  /** The scroll region's accessible name. */
  transcript: string;
}

export const defaultChatMessageListLabels: Readonly<
  Required<Omit<ChatMessageListLabels, "aiDisclosure">>
> = Object.freeze({
  ...defaultChatMessageLabels,
  ...defaultThinkingIndicatorLabels,
  transcript: "Conversation",
});

export interface ChatMessageListProps {
  /** The conversation to render, in order. A delta must arrive as a new array. */
  entries: ReadonlyArray<UserChatEntry | AssistantChatEntry>;
  userInitials: string;
  /**
   * Required, unlike every sibling component's optional `labels`:
   * `aiDisclosure` has no default, so the prop cannot be omitted.
   */
  labels: Partial<ChatMessageListLabels> & Required<Pick<ChatMessageListLabels, "aiDisclosure">>;
  /** Fills the avatar circle of every ChatMessage and the busy indicator. */
  assistantAvatar?: ReactNode;
  /** Renders one ThinkingIndicator after the last entry. Default false. */
  busy?: boolean;
  /** Empty state only, centred in place of the transcript column. */
  greeting?: ReactNode;
  /** Empty state only, rendered under the greeting. */
  prompts?: ReactNode;
  showFeedback?: boolean;
  arrowKeyFeedback?: boolean;
  markdown?: MarkdownPolicy;
  /** Forces instant scrolling; undefined tracks the OS preference. */
  reducedMotion?: boolean;
  onCopy?: (text: string, entryId: string) => void;
  onFeedback?: (entryId: string, type: "up" | "down") => void;
}

export interface ChatMessageListHandle {
  scrollToBottom(): void;
  isPinnedToBottom(): boolean;
}

const PINNED_THRESHOLD_PX = 32;

const isNearBottom = (node: HTMLElement | null): boolean => {
  if (!node) {
    return false;
  }
  return node.scrollHeight - node.scrollTop - node.clientHeight <= PINNED_THRESHOLD_PX;
};

// scrollTo with a scrollTop fallback - never the element-walking scroll
// method, which targets the nearest scrollable ancestor outside this
// package's control. jsdom implements neither, hence the fallback.
const scrollRegionToBottom = (node: HTMLElement | null, behavior: ScrollBehavior) => {
  if (!node) {
    return;
  }
  if (typeof node.scrollTo === "function") {
    node.scrollTo({ top: node.scrollHeight, behavior });
    return;
  }
  node.scrollTop = node.scrollHeight;
};

export const ChatMessageList = forwardRef<ChatMessageListHandle, ChatMessageListProps>(
  function ChatMessageList(
    {
      entries,
      userInitials,
      labels,
      assistantAvatar,
      busy = false,
      greeting,
      prompts,
      showFeedback,
      arrowKeyFeedback,
      markdown,
      reducedMotion,
      onCopy,
      onFeedback,
    },
    ref
  ) {
    const resolved = {
      ...resolveLabels(defaultChatMessageListLabels, labels),
      aiDisclosure: labels.aiDisclosure,
    };
    const prefersReducedMotion = useReducedMotion(reducedMotion);
    const regionRef = useRef<HTMLDivElement>(null);
    const pinnedRef = useRef(true);
    const smoothScrollInFlightRef = useRef(false);
    const lastScrollTopRef = useRef(0);
    const previousLengthRef = useRef<number | null>(null);

    useEffect(() => {
      const previousLength = previousLengthRef.current;
      previousLengthRef.current = entries.length;
      if (previousLength === null) {
        smoothScrollInFlightRef.current = false;
        scrollRegionToBottom(regionRef.current, "auto");
        return;
      }
      if (!pinnedRef.current) {
        return;
      }
      const grew = entries.length > previousLength;
      const behavior: ScrollBehavior = prefersReducedMotion || !grew ? "auto" : "smooth";
      smoothScrollInFlightRef.current = behavior === "smooth";
      scrollRegionToBottom(regionRef.current, behavior);
    }, [entries, busy, prefersReducedMotion]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => {
          const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
          pinnedRef.current = true;
          smoothScrollInFlightRef.current = behavior === "smooth";
          scrollRegionToBottom(regionRef.current, behavior);
        },
        isPinnedToBottom: () => isNearBottom(regionRef.current),
      }),
      [prefersReducedMotion]
    );

    // A smooth animation this component started fires downward scroll
    // events of its own; those must not unpin the reader. Reaching the
    // bottom (or any upward, reader-initiated movement) settles the flight.
    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
      const node = event.currentTarget;
      const previousTop = lastScrollTopRef.current;
      lastScrollTopRef.current = node.scrollTop;
      if (isNearBottom(node)) {
        pinnedRef.current = true;
        smoothScrollInFlightRef.current = false;
        return;
      }
      if (smoothScrollInFlightRef.current && node.scrollTop > previousTop) {
        return;
      }
      pinnedRef.current = false;
      smoothScrollInFlightRef.current = false;
    };

    const showEmptyState = entries.length === 0 && !busy;

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="border-b border-slate-200 px-4 py-2 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {resolved.aiDisclosure}
        </p>
        <div
          ref={regionRef}
          role="log"
          aria-live="off"
          aria-label={resolved.transcript}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {showEmptyState ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
              {greeting}
              {prompts}
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
              {entries.map((entry) => (
                <ChatMessage
                  key={entry.id}
                  entry={entry}
                  userInitials={userInitials}
                  assistantAvatar={assistantAvatar}
                  showFeedback={showFeedback}
                  arrowKeyFeedback={arrowKeyFeedback}
                  markdown={markdown}
                  labels={resolved}
                  onCopy={onCopy}
                  onFeedback={onFeedback}
                />
              ))}
              {busy && (
                <ThinkingIndicator
                  assistantAvatar={assistantAvatar}
                  labels={{
                    thinking: resolved.thinking,
                    thinkingRegion: resolved.thinkingRegion,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
