// Compiled by tests/chat-message-list-dist.test.ts with tsc --noEmit against
// the BUILT package: the self-referencing "@re-cinq/bowman-ui" import
// resolves through package.json's "." exports entry to dist/index.d.ts. Pins
// the required-label contract: aiDisclosure has no default, so omitting it
// from labels is a compile error and defaultChatMessageListLabels cannot
// satisfy the fully-required labels shape.
import { useRef, type ComponentProps } from "react";
import {
  ChatMessageList,
  defaultChatMessageListLabels,
  type AssistantChatEntry,
  type ChatMessageListHandle,
  type ChatMessageListLabels,
  type ChatMessageListProps,
  type ThinkingChatEntry,
  type ToolChatEntry,
  type UserChatEntry,
} from "@re-cinq/bowman-ui";

const entries: ReadonlyArray<UserChatEntry | AssistantChatEntry | ToolChatEntry> = [
  { id: "u1", role: "user", content: "Vis booking 4711" },
  { id: "t1", role: "tool", toolName: "get_weather", toolInput: { location: "Berlin" } },
  { id: "a1", role: "assistant", content: "Booking 4711 er fundet", isStreaming: false },
];

// A ThinkingChatEntry stays excluded from `entries` until
// 087-bowman-ui-thinking-trace widens the union and deletes this assertion.
const withThinking: ReadonlyArray<UserChatEntry | ThinkingChatEntry> = [
  { id: "u1", role: "user", content: "Vis booking 4711" },
  { id: "th1", role: "thinking", content: "Slår booking op", isStreaming: false },
];
// @ts-expect-error -- ThinkingChatEntry is not in entries until 087-bowman-ui-thinking-trace
const rejectedEntries: ComponentProps<typeof ChatMessageList>["entries"] = withThinking;
void rejectedEntries;

// @ts-expect-error -- aiDisclosure is declared without a default (EU AI Act:
// no English placeholder may reach a Danish customer), so the defaults
// object is not a Readonly<Required<ChatMessageListLabels>>.
const withDisclosureDefault = defaultChatMessageListLabels satisfies Readonly<
  Required<ChatMessageListLabels>
>;

const scoreFooter: NonNullable<ChatMessageListProps["renderEntryFooter"]> = (entry) => (
  <span data-entry-id={entry.id} />
);

const toolNameFooter: NonNullable<ChatMessageListProps["renderEntryFooter"]> = (entry) =>
  // @ts-expect-error -- the parameter stays UserChatEntry | AssistantChatEntry:
  // a widened `entries` must not widen this callback, so a tool row's
  // toolName is unreadable here.
  entry.toolName;

const Consumer = () => {
  const listRef = useRef<ChatMessageListHandle>(null);
  const jumpToLatest = () => {
    if (listRef.current?.isPinnedToBottom()) {
      return;
    }
    listRef.current?.scrollToBottom();
  };
  return (
    <>
      <ChatMessageList
        ref={listRef}
        entries={entries}
        userInitials="LM"
        labels={{ aiDisclosure: "Du chatter med en AI-assistent" }}
      />
      {/* @ts-expect-error -- omitting aiDisclosure from labels must not compile */}
      <ChatMessageList entries={entries} userInitials="LM" labels={{ transcript: "Samtale" }} />
      <ChatMessageList
        entries={entries}
        userInitials="LM"
        labels={{ aiDisclosure: withDisclosureDefault.transcript }}
        assistantAvatar={<span data-title={jumpToLatest.name} />}
        busy
        greeting={<p>God morgen</p>}
        prompts={<button type="button" onClick={jumpToLatest} />}
        showFeedback
        arrowKeyFeedback
        markdown={{ linkTarget: "_self" }}
        reducedMotion
        renderEntryFooter={scoreFooter}
        describeTool={(entry: ToolChatEntry) => entry.toolName}
        showToolName
        showToolInput
        toolIcon={<span />}
        onCopy={(text: string, entryId: string) => {
          void text;
          void entryId;
        }}
        onFeedback={(entryId: string, type: "up" | "down") => {
          void entryId;
          void type;
        }}
      />
    </>
  );
};

void Consumer;
void toolNameFooter;
