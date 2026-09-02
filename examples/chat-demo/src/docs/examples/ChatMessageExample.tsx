import { ChatMessage } from "@re-cinq/bowman-ui";
import type { AssistantChatEntry } from "@re-cinq/bowman-ui";

const reply: AssistantChatEntry = {
  id: "reply-1",
  role: "assistant",
  content:
    "The Friday restock arrives at **11:00** from the warehouse. The full terms are in the [delivery terms](https://example.invalid/terms).",
  isStreaming: false,
};

export function ChatMessageExample() {
  return <ChatMessage entry={reply} userInitials="MW" assistantName="Marginalia Support" />;
}
