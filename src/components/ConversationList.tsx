"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { TrashIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";

export interface ConversationListItem {
  id: string;
  title: string;
  /** Display-ready text - the library reads no clock and no locale. */
  timestamp?: string;
  badge?: string;
  /** The producer's own knowledge that the title is still a generated placeholder. */
  isPlaceholderTitle?: boolean;
}

export interface ConversationLinkProps {
  className: string;
  children: ReactNode;
  onClick: () => void;
  "aria-current"?: "page";
}

export interface ConversationListLabels {
  /** The list's accessible name. */
  conversations: string;
  noConversations: string;
  loadingConversations: string;
  deleteConversation: (title: string) => string;
}

export const defaultConversationListLabels: Readonly<Required<ConversationListLabels>> =
  Object.freeze({
    conversations: "Conversations",
    noConversations: "No conversations yet",
    loadingConversations: "Loading conversations",
    deleteConversation: (title: string) => `Delete conversation: ${title}`,
  });

export interface ConversationListProps {
  items: ReadonlyArray<ConversationListItem>;
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Fires immediately - confirmation is the consumer's product decision. Omitted: no button. */
  onDelete?: (id: string) => void;
  /** The routing seam: the consumer's element must spread every prop it is handed (docs/design-notes.md § renderLink). */
  renderLink?: (item: ConversationListItem, props: ConversationLinkProps) => ReactNode;
  isLoading?: boolean;
  /** Switches the typewriter off entirely; undefined tracks prefers-reduced-motion. */
  reducedMotion?: boolean;
  labels?: Partial<ConversationListLabels>;
}

// The typewriter animation keeps its previous render per component instance
// (rows are keyed by item.id), instead of sniffing placeholder-title
// literals: it animates only when the title changed and the
// previous render carried isPlaceholderTitle, so a conversation genuinely
// titled with a placeholder-looking string never animates, and a third
// locale's placeholder animates without this file knowing its wording.
function TypewriterTitle({
  text,
  isPlaceholder,
  reducedMotion,
}: {
  text: string;
  isPlaceholder: boolean;
  reducedMotion: boolean;
}) {
  const [chars, setChars] = useState<Array<{ ch: string; opacity: number }>>(() =>
    text.split("").map((ch) => ({ ch, opacity: 1 }))
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const previousRef = useRef({ text, isPlaceholder });

  useEffect(() => {
    const previous = previousRef.current;

    previousRef.current = { text, isPlaceholder };

    if (text === previous.text) {
      return;
    }

    if (!previous.isPlaceholder || reducedMotion) {
      setChars(text.split("").map((ch) => ({ ch, opacity: 1 })));

      return;
    }

    setIsAnimating(true);

    const oldChars = previous.text.split("").map((ch) => ({ ch, opacity: 1 }));
    const newChars = text.split("");
    let phase = 1;
    let i = 0;

    setChars([...oldChars]);

    const interval = setInterval(() => {
      if (phase === 1) {
        oldChars[i] = { ...oldChars[i], opacity: 0 };
        setChars([...oldChars]);
        i++;

        if (i >= oldChars.length) {
          phase = 2;
          i = 0;
          setChars(newChars.map((ch) => ({ ch, opacity: 0 })));
        }

        return;
      }
      setChars((current) => current.map((c, index) => (index <= i ? { ...c, opacity: 1 } : c)));
      i++;

      if (i >= newChars.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 25);

    return () => {
      clearInterval(interval);
      setIsAnimating(false);
    };
  }, [text, isPlaceholder, reducedMotion]);

  // The per-character spans are presentation only: assistive tech reads the
  // plain full title (already the new one mid-animation) instead of a stream
  // of one-letter text nodes. Hidden with inline styles so the package needs
  // no stylesheet or Tailwind config from the consumer.
  return (
    <>
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        className="block overflow-hidden whitespace-nowrap"
        style={{ textOverflow: isAnimating ? "clip" : "ellipsis" }}
      >
        {chars.map((c, index) => (
          <span
            key={`${index}-${c.ch}`}
            style={{ opacity: c.opacity, transition: "opacity 0.1s ease" }}
          >
            {c.ch}
          </span>
        ))}
      </span>
    </>
  );
}

const defaultRenderLink = (_item: ConversationListItem, props: ConversationLinkProps) => (
  <button type="button" {...props} />
);

export function ConversationList({
  items,
  activeId,
  onSelect,
  onDelete,
  renderLink = defaultRenderLink,
  isLoading = false,
  reducedMotion,
  labels,
}: ConversationListProps) {
  const resolved = resolveLabels(defaultConversationListLabels, labels);
  const motionOff = useReducedMotion(reducedMotion);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label={resolved.loadingConversations}
        className="flex items-center justify-center py-8"
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
        {resolved.noConversations}
      </p>
    );
  }

  return (
    // role="list" is redundant markup everywhere except Safari, where
    // list-style: none strips a ul's list semantics and takes the accessible
    // name with it. The explicit role keeps VoiceOver announcing the list.
    <ul role="list" aria-label={resolved.conversations} className="list-none space-y-1">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const linkProps: ConversationLinkProps = {
          className:
            "-m-1 flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-3 py-2 text-left ring-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-white dark:ring-offset-slate-900 dark:focus:ring-blue-400",
          children: (
            <>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                <TypewriterTitle
                  text={item.title}
                  isPlaceholder={item.isPlaceholderTitle ?? false}
                  reducedMotion={motionOff}
                />
              </span>
              {(item.timestamp !== undefined || item.badge !== undefined) && (
                <span className="flex items-center gap-2">
                  {item.timestamp !== undefined && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.timestamp}
                    </span>
                  )}
                  {item.badge !== undefined && (
                    <span className="truncate rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </>
          ),
          onClick: () => onSelect?.(item.id),
          "aria-current": isActive ? "page" : undefined,
        };

        return (
          <li
            key={item.id}
            className={`group flex w-full items-center rounded-lg p-1 transition-colors ${
              isActive
                ? "bg-slate-100 dark:bg-slate-800"
                : "hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {renderLink(item, linkProps)}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="ml-1 flex-shrink-0 rounded p-1.5 text-slate-400 opacity-0 ring-offset-2 transition-opacity hover:bg-slate-200 hover:text-red-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-white group-hover:opacity-100 group-focus-within:opacity-100 dark:ring-offset-slate-900 dark:hover:bg-slate-700 dark:focus:ring-blue-400"
                aria-label={resolved.deleteConversation(item.title)}
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
