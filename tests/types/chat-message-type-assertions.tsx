// Compiled by tests/chat-message-dist.test.ts with tsc --noEmit against the
// BUILT package: the self-referencing "@re-cinq/bowman-ui" import resolves
// through package.json's "." exports entry to dist/index.d.ts. Pins 023's
// Decision 1 (only user and assistant entries render - a thinking or tool
// entry is a compile error, never a silent null) and the labels convention's
// compile-time guarantee for both new components: a key added to a labels
// interface without a default cannot satisfy Readonly<Required<XLabels>>.
import {
  ChatMessage,
  defaultChatMessageLabels,
  defaultInlineThinkingIndicatorLabels,
  type AssistantChatEntry,
  type ChatMessageLabels,
  type InlineThinkingIndicatorLabels,
  type ThinkingChatEntry,
  type ToolChatEntry,
  type UserChatEntry,
} from "@re-cinq/bowman-ui";

const userEntry: UserChatEntry = { id: "u1", role: "user", content: "Vis booking 4711" };
const assistantEntry: AssistantChatEntry = {
  id: "a1",
  role: "assistant",
  content: "Booking 4711 er bekræftet",
  isStreaming: false,
};
const thinkingEntry: ThinkingChatEntry = {
  id: "t1",
  role: "thinking",
  content: "reasoning",
  isStreaming: true,
};
const toolEntry: ToolChatEntry = {
  id: "x1",
  role: "tool",
  toolName: "get_booking",
  toolInput: { bookingId: 4711 },
};

const Renderable = () => (
  <>
    <ChatMessage entry={userEntry} userInitials="LM" />
    <ChatMessage entry={assistantEntry} userInitials="LM" />
    {/* @ts-expect-error -- Decision 1: a ThinkingChatEntry must fail the entry prop */}
    <ChatMessage entry={thinkingEntry} userInitials="LM" />
    {/* @ts-expect-error -- Decision 1: a ToolChatEntry must fail the entry prop */}
    <ChatMessage entry={toolEntry} userInitials="LM" />
  </>
);

const completeDefaults = defaultChatMessageLabels satisfies Readonly<Required<ChatMessageLabels>>;

// @ts-expect-error -- a ChatMessageLabels key without a default must not
// compile: an object missing `thinking` (the ninth key) is not a
// Readonly<Required<ChatMessageLabels>>.
const incompleteDefaults: Readonly<Required<ChatMessageLabels>> = {
  userMessage: "Your message",
  assistantMessage: "Assistant response",
  copy: "Copy message",
  copied: "Copied",
  copiedNotice: "Copied!",
  feedbackPositive: "Good response",
  feedbackNegative: "Bad response",
  feedbackNotice: "Thanks!",
};

const inlineComplete = defaultInlineThinkingIndicatorLabels satisfies Readonly<
  Required<InlineThinkingIndicatorLabels>
>;

// @ts-expect-error -- the indicator's single key still needs a default: an
// empty object is not a Readonly<Required<InlineThinkingIndicatorLabels>>.
const inlineIncomplete: Readonly<Required<InlineThinkingIndicatorLabels>> = {};

void Renderable;
void completeDefaults;
void incompleteDefaults;
void inlineComplete;
void inlineIncomplete;
