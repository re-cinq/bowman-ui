import { ThinkingTrace } from "@re-cinq/bowman-ui";
import type { ThinkingChatEntry } from "@re-cinq/bowman-ui";

const reasoning: ThinkingChatEntry = {
  id: "thinking-1",
  role: "thinking",
  content:
    "The customer asked about Friday. The Friday restock lands at 11:00 and includes the hardback. The order ships with the Flexible option, so a change costs nothing.",
  isStreaming: false,
};

export function ThinkingTraceExample() {
  return (
    <ThinkingTrace entry={reasoning} labels={{ thinkingTrace: "Reasoning" }} />
  );
}
