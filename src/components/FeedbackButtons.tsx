"use client";

import { ThumbsDownIcon, ThumbsUpIcon } from "../icons/index.js";
import {
  CONTROL_HOVER,
  DANGER,
  DANGER_SOFT,
  FOCUS_RING_COLOR,
  SUCCESS,
  SUCCESS_SOFT,
  TEXT_SECONDARY_HOVER,
  TEXT_SUBTLE,
} from "../theme/tokens.js";

export type FeedbackType = "up" | "down";

export interface FeedbackButtonsLabels {
  feedbackPositive: string;
  feedbackNegative: string;
  feedbackNotice: string;
}

export interface FeedbackButtonsProps {
  /** The thumb this entry was last rated with, or null before any rating. */
  pressed: FeedbackType | null;
  labels: FeedbackButtonsLabels;
  onFeedback: (type: FeedbackType) => void;
}

const feedbackButtons = [
  {
    type: "up",
    Icon: ThumbsUpIcon,
    labelKey: "feedbackPositive",
    selected: `${SUCCESS_SOFT} ${SUCCESS}`,
  },
  {
    type: "down",
    Icon: ThumbsDownIcon,
    labelKey: "feedbackNegative",
    selected: `${DANGER_SOFT} ${DANGER}`,
  },
] as const;

// Internal, never in the barrel: ChatMessage and ChatCard share it, so a rated message and a rated card read the same.
export function FeedbackButtons({ pressed, labels, onFeedback }: FeedbackButtonsProps) {
  return (
    <>
      {feedbackButtons.map(({ type, Icon, labelKey, selected }) => (
        <button
          key={type}
          type="button"
          className={`rounded p-1.5 ring-offset-2 transition-colors focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} dark:ring-offset-slate-950 ${
            pressed === type ? selected : `${TEXT_SUBTLE} ${CONTROL_HOVER} ${TEXT_SECONDARY_HOVER}`
          }`}
          onClick={() => onFeedback(type)}
          aria-label={labels[labelKey]}
          aria-pressed={pressed === type}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
      {pressed !== null && (
        <span className={`bowman-fade-in ml-1 text-xs ${TEXT_SUBTLE}`}>
          {labels.feedbackNotice}
        </span>
      )}
    </>
  );
}
