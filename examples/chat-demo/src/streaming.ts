// The demo's stand-in for HAL's streaming lifecycle
// (hal-engine/docs/websocket-protocol.md 7.1): entry_upsert creates an empty
// assistant entry, entry_delta grows its content, entry_commit clears the
// streaming flag. Plain timers over the canned Danish reply in fixtures.ts -
// no @re-cinq/hal-engine dependency, no network, nothing to configure. The
// step count and interval exist so a screen-reader pass has a reply long
// enough to listen to (issue 97).

import { streamedReplyText } from "./fixtures";

export type StreamEvent = { kind: "upsert" } | { kind: "delta"; text: string } | { kind: "commit" };

export const streamStepCount = 24;
export const streamStepIntervalMs = 150;
export const streamStartDelayMs = 400;

const boundary = (index: number, wordCount: number, stepCount: number): number =>
  Math.round((index * wordCount) / stepCount);

export const splitIntoChunks = (text: string, stepCount: number): ReadonlyArray<string> => {
  const words = text.split(" ");
  return Array.from({ length: stepCount }, (_, index) => {
    const chunk = words
      .slice(boundary(index, words.length, stepCount), boundary(index + 1, words.length, stepCount))
      .join(" ");
    return index === 0 ? chunk : ` ${chunk}`;
  });
};

export const streamAssistantReply = (emit: (event: StreamEvent) => void): (() => void) => {
  const chunks = splitIntoChunks(streamedReplyText, streamStepCount);
  const timers: ReturnType<typeof setTimeout>[] = [];
  const at = (delayMs: number, event: StreamEvent) => {
    timers.push(setTimeout(() => emit(event), delayMs));
  };

  at(streamStartDelayMs, { kind: "upsert" });
  chunks.forEach((text, index) => {
    at(streamStartDelayMs + (index + 1) * streamStepIntervalMs, { kind: "delta", text });
  });
  at(streamStartDelayMs + (chunks.length + 1) * streamStepIntervalMs, { kind: "commit" });

  return () => {
    for (const timer of timers) {
      clearTimeout(timer);
    }
  };
};
