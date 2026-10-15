"use client";

import { useState, type ReactNode } from "react";
import { resolveLabels } from "../labels.js";
import { BORDER, SURFACE, TEXT_STRONG } from "../theme/tokens.js";
import type { CardChatEntry } from "../types/chat.js";
import { defaultChatMessageLabels } from "./ChatMessage.js";
import { FeedbackButtons, type FeedbackType } from "./FeedbackButtons.js";

export interface ChatCardLabels {
  /** The card's accessible name. */
  card: string;
  /** Shown in place of a card nothing describes; the library never prints the card's data. */
  cardUnavailable: string;
  feedbackPositive: string;
  feedbackNegative: string;
  feedbackNotice: string;
}

export const defaultChatCardLabels: Readonly<Required<ChatCardLabels>> = Object.freeze({
  card: "Card",
  cardUnavailable: "This card could not be shown",
  feedbackPositive: defaultChatMessageLabels.feedbackPositive,
  feedbackNegative: defaultChatMessageLabels.feedbackNegative,
  feedbackNotice: defaultChatMessageLabels.feedbackNotice,
});

export interface ChatCardProps {
  entry: CardChatEntry;
  /** The card's body, from the consumer's own reading of entry.data; without it, or when it returns null or undefined, the cardUnavailable label shows. */
  describeCard?: (entry: CardChatEntry) => ReactNode;
  /** Shows the thumb buttons, rating this card alone. Default true, as on ChatMessage. */
  showFeedback?: boolean;
  /** Overrides the component's strings; English defaults apply per key. */
  labels?: Partial<ChatCardLabels>;
  onFeedback?: (entryId: string, type: FeedbackType) => void;
}

// A frame the library owns around a body the consumer draws; entry.data reaches the DOM only through describeCard.
export function ChatCard({
  entry,
  describeCard,
  showFeedback = true,
  labels,
  onFeedback,
}: ChatCardProps) {
  const resolved = resolveLabels(defaultChatCardLabels, labels);
  // Keyed by entry.id, as ChatMessage keys its own: a card handed another entry starts unrated.
  const [feedbackId, setFeedbackId] = useState<{ id: string; type: FeedbackType } | null>(null);
  const pressed = feedbackId?.id === entry.id ? feedbackId.type : null;

  const rate = (type: FeedbackType) => {
    setFeedbackId({ id: entry.id, type });
    onFeedback?.(entry.id, type);
  };

  return (
    <article
      aria-label={resolved.card}
      className={`group flex w-full flex-col gap-2 rounded-xl border ${BORDER} ${SURFACE} p-4 text-sm ${TEXT_STRONG}`}
    >
      <div className="min-w-0 break-words">{describeCard?.(entry) ?? resolved.cardUnavailable}</div>
      {showFeedback && (
        <div className="-ml-1 flex items-center gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <FeedbackButtons pressed={pressed} labels={resolved} onFeedback={rate} />
        </div>
      )}
    </article>
  );
}
