import { ThinkingTrace } from "@re-cinq/bowman-ui";
import type { ThinkingChatEntry } from "@re-cinq/bowman-ui";

const reasoning: ThinkingChatEntry = {
  id: "thinking-1",
  role: "thinking",
  content:
    "The customer asked about Friday. Friday has three sailings and the last one is 21:40. The booking is Flexible, so a change costs nothing.",
  isStreaming: false,
};

export function ThinkingTraceExample() {
  return <ThinkingTrace entry={reasoning} labels={{ thinkingTrace: "Reasoning" }} />;
}
