"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { SendIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";
import {
  ACCENT_BG,
  ACCENT_BG_HOVER,
  BORDER,
  FOCUS_WITHIN_RING_COLOR,
  PLACEHOLDER_SUBTLE,
  SURFACE,
} from "../theme/tokens.js";

export interface ChatComposerLabels {
  /** The textarea's accessible name - a real label, never the placeholder. */
  composerInput: string;
  composerPlaceholder: string;
  send: string;
}

export const defaultChatComposerLabels: Readonly<Required<ChatComposerLabels>> = Object.freeze({
  composerInput: "Your message",
  composerPlaceholder: "Reply...",
  send: "Send message",
});

export interface ChatComposerProps {
  /** Receives the trimmed draft; the component clears itself after calling it. */
  onSubmit: (text: string) => void;
  /** Disables the composer and pulses it - the agent is thinking. Default false. */
  busy?: boolean;
  /** Disables the composer without the pulse. Default false. */
  disabled?: boolean;
  autoFocus?: boolean;
  /** Auto-resize cap in pixels; the draft scrolls past it. Default 200. */
  maxHeightPx?: number;
  /** Rendered left of send. No attach button ships when omitted. */
  attachSlot?: ReactNode;
  /** Overrides the composer's strings; English defaults apply per key. */
  labels?: Partial<ChatComposerLabels>;
}

export interface ChatComposerHandle {
  focus(): void;
  /** Writes the draft from outside (clear-on-send, text injection) and re-runs the auto-resize. */
  setValue(value: string): void;
}

// Uncontrolled draft (outside writes use the ref handle); the isComposing guard keeps an IME commit from sending.
export function ChatComposer({
  onSubmit,
  busy = false,
  disabled = false,
  autoFocus = false,
  maxHeightPx = 200,
  attachSlot,
  labels,
  ref,
}: ChatComposerProps & { ref?: Ref<ChatComposerHandle> }) {
  const resolved = resolveLabels(defaultChatComposerLabels, labels);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const inactive = busy || disabled;

  const resize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeightPx)}px`;
  };

  const submit = () => {
    const textarea = textareaRef.current;

    if (!textarea || inactive) {
      return;
    }
    const text = textarea.value.trim();

    if (!text) {
      return;
    }
    onSubmit(text);
    textarea.value = "";
    textarea.style.height = "auto";
    setHasDraft(false);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setHasDraft(event.currentTarget.value.trim().length > 0);
    resize(event.currentTarget);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    submit();
  };

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setValue: (value: string) => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }
      textarea.value = value;
      setHasDraft(value.trim().length > 0);
      resize(textarea);
    },
  }));

  return (
    <div
      aria-busy={busy}
      className={`relative rounded-2xl border ${BORDER} ${SURFACE} shadow-sm transition-all focus-within:ring-2 ${FOCUS_WITHIN_RING_COLOR} ${busy ? "bowman-pulse-subtle" : ""}`}
    >
      <textarea
        ref={textareaRef}
        aria-label={resolved.composerInput}
        placeholder={resolved.composerPlaceholder}
        rows={1}
        className={`block w-full resize-none bg-transparent px-4 py-4 text-base text-slate-900 ${PLACEHOLDER_SUBTLE} focus:outline-none dark:text-slate-200`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={inactive}
        autoFocus={autoFocus}
      />
      <div
        className={`flex items-center justify-between border-t border-dashed ${BORDER} px-2 py-2`}
      >
        <div className="flex items-center gap-2">{attachSlot}</div>
        <button
          type="button"
          onClick={submit}
          disabled={!hasDraft || inactive}
          aria-label={resolved.send}
          className={`cursor-pointer rounded-lg ${ACCENT_BG} p-1.5 text-white ${ACCENT_BG_HOVER} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-50 dark:disabled:bg-slate-800 dark:disabled:text-slate-500`}
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
