import { ChatMessage } from "@re-cinq/bowman-ui";
import type { AssistantChatEntry } from "@re-cinq/bowman-ui";

const reply: AssistantChatEntry = {
  id: "reply-1",
  role: "assistant",
  content:
    "The last sailing on Friday is **21:40** from Nordhavnsbro. The full terms are in the [travel conditions](https://example.invalid/terms).",
  isStreaming: false,
};

export function ChatMessageExample() {
  return <ChatMessage entry={reply} userInitials="MV" assistantName="Havkat Support" />;
}
