import { ToolActivity } from "@re-cinq/bowman-ui";
import type { ToolChatEntry } from "@re-cinq/bowman-ui";

const call: ToolChatEntry = {
  id: "call-1",
  role: "tool",
  toolName: "lookup_departures",
  toolInput: { route: "nordhavnsbro-skagerakoeen", passengers: 2 },
};

export function ToolActivityExample() {
  return (
    <ToolActivity
      entry={call}
      describeTool={(_entry, pending) =>
        pending ? "Looking up departures" : "Looked up departures"
      }
    />
  );
}
