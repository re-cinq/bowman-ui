"use client";

import type { ReactElement, ReactNode } from "react";
import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon, WarningIcon } from "../icons/index.js";
import type { IconProps } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import {
  BORDER,
  DANGER_TONE,
  INFO_TONE,
  SUCCESS_TONE,
  SURFACE,
  TEXT_BODY,
  TEXT_STRONG,
  WARNING_TONE,
} from "../theme/tokens.js";
import { IconButton } from "./IconButton.js";

export type NoticeTone = "info" | "success" | "warning" | "error";

export interface NoticeLabels {
  /** The dismiss button's accessible name; read only when `onDismiss` is given. */
  dismissNotice: string;
}

export const defaultNoticeLabels: Readonly<Required<NoticeLabels>> = Object.freeze({
  dismissNotice: "Dismiss",
});

export interface NoticeProps {
  tone: NoticeTone;
  heading?: ReactNode;
  children: ReactNode;
  /** When given, a dismiss button renders and calls it; the consumer stops rendering the notice. */
  onDismiss?: () => void;
  labels?: Partial<NoticeLabels>;
}

interface ToneStyle {
  icon: (props: IconProps) => ReactElement;
  role: "status" | "alert";
  className: string;
}

const toneStyles: Readonly<Record<NoticeTone, ToneStyle>> = Object.freeze({
  info: { icon: InfoIcon, role: "status", className: INFO_TONE },
  success: { icon: CheckIcon, role: "status", className: SUCCESS_TONE },
  warning: { icon: WarningIcon, role: "alert", className: WARNING_TONE },
  error: { icon: ErrorIcon, role: "alert", className: DANGER_TONE },
});

export function Notice({ tone, heading, children, onDismiss, labels }: NoticeProps): ReactElement {
  const resolved = resolveLabels(defaultNoticeLabels, labels);
  const { icon: ToneIcon, role, className } = toneStyles[tone];

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-l-4 p-3 ${BORDER} ${SURFACE} ${className}`}
    >
      <div role={role} className="flex min-w-0 flex-1 items-start gap-3">
        <ToneIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          {heading && <span className={`block font-semibold ${TEXT_STRONG}`}>{heading}</span>}
          <div className={TEXT_BODY}>{children}</div>
        </div>
      </div>
      {onDismiss && (
        <IconButton
          icon={CloseIcon}
          variant="ghost"
          size="sm"
          labels={{ accessibleName: resolved.dismissNotice }}
          onClick={onDismiss}
        />
      )}
    </div>
  );
}
