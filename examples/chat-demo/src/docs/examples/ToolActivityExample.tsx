import { ToolActivity } from "@re-cinq/bowman-ui";
import type { ToolChatEntry } from "@re-cinq/bowman-ui";

const call: ToolChatEntry = {
  id: "call-1",
  role: "tool",
  toolName: "lookup_stock",
  toolInput: { title: "the-cartographers-atlas", copies: 2 },
};

export function ToolActivityExample() {
  return (
    <ToolActivity
      entry={call}
      describeTool={(_entry, pending) => (pending ? "Looking up stock" : "Looked up stock")}
    />
  );
}
