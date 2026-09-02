import { ChatMessageList } from "@re-cinq/bowman-ui";
import type { ChatEntry } from "@re-cinq/bowman-ui";

const entries: ReadonlyArray<ChatEntry> = [
  { id: "1", role: "user", content: "When is The Cartographer's Atlas back in stock?" },
  { id: "2", role: "tool", toolName: "lookup_stock", toolInput: { day: "friday" } },
  {
    id: "3",
    role: "assistant",
    content: "The Friday restock arrives at 11:00 from the warehouse.",
    isStreaming: false,
    persona: "support",
  },
];

export function ChatMessageListExample() {
  return (
    <div className="flex h-96 flex-col">
      <ChatMessageList
        entries={entries}
        userInitials="MW"
        attribution={{ support: { name: "Marginalia Support" } }}
        labels={{
          aiDisclosure: "You are talking to an artificial intelligence. Answers can be wrong.",
        }}
      />
    </div>
  );
}
