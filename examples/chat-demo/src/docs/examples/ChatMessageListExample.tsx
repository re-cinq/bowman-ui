import { ChatMessageList } from "@re-cinq/bowman-ui";
import type { ChatEntry } from "@re-cinq/bowman-ui";

const entries: ReadonlyArray<ChatEntry> = [
  { id: "1", role: "user", content: "When does the last ferry leave on Friday?" },
  { id: "2", role: "tool", toolName: "lookup_departures", toolInput: { day: "friday" } },
  {
    id: "3",
    role: "assistant",
    content: "The last sailing is 21:40 from Nordhavnsbro.",
    isStreaming: false,
    persona: "support",
  },
];

export function ChatMessageListExample() {
  return (
    <div className="flex h-96 flex-col">
      <ChatMessageList
        entries={entries}
        userInitials="MV"
        attribution={{ support: { name: "Havkat Support" } }}
        labels={{
          aiDisclosure: "You are talking to an artificial intelligence. Answers can be wrong.",
        }}
      />
    </div>
  );
}
