/** Role discriminant for {@link ChatEntry}, hal-engine's four SessionEntry roles (docs/websocket-protocol.md §6). */
export type ChatEntryRole = "user" | "assistant" | "thinking" | "tool";

/** A message authored by the user (docs/websocket-protocol.md §6.1); fully formed, never streams (§7.2). */
export interface UserChatEntry {
  /** Opaque identifier assigned by the consuming adapter. */
  id: string;
  /** Discriminant. */
  role: "user";
  /** The message text. */
  content: string;
}

/** A response from the AI model (docs/websocket-protocol.md §6.2); streams via upsert/delta/commit (§7.1). */
export interface AssistantChatEntry {
  /** Opaque identifier assigned by the consuming adapter. */
  id: string;
  /** Discriminant. */
  role: "assistant";
  /** Markdown text, grown incrementally while streaming. */
  content: string;
  /** `true` while deltas are still arriving; `false` once committed. */
  isStreaming: boolean;
  /** Presentational status line while a tool runs ("Running get_weather..."); caller-supplied, no HAL counterpart. */
  toolStatus?: string;
  /** Opaque persona id keying the consumer's attribution table; never rendered, never personal data. */
  persona?: string;
}

/** Internal AI reasoning, collapsible (docs/websocket-protocol.md §6.3); streams via upsert/delta/commit (§7.1). */
export interface ThinkingChatEntry {
  /** Opaque identifier assigned by the consuming adapter. */
  id: string;
  /** Discriminant. */
  role: "thinking";
  /** Reasoning text, grown incrementally while streaming. */
  content: string;
  /** `true` while deltas are still arriving; `false` once committed. */
  isStreaming: boolean;
}

/** A tool invocation the model requested (docs/websocket-protocol.md §6.4); fully formed (§7.2), no content. */
export interface ToolChatEntry {
  /** Opaque identifier assigned by the consuming adapter. */
  id: string;
  /** Discriminant. */
  role: "tool";
  /** Registered tool name. */
  toolName: string;
  /** Key-value pairs passed to the tool. */
  toolInput: Record<string, unknown>;
}

/** One entry per piece of content, discriminated on role (docs/websocket-protocol.md §6; chat-entry-types spec). */
export type ChatEntry = UserChatEntry | AssistantChatEntry | ThinkingChatEntry | ToolChatEntry;

/** Coarse conversation state: "idle" between exchanges, "streaming" in flight, "error" after a terminal error. */
export type ChatStreamState = "idle" | "streaming" | "error";

/** Error details; code is the protocol error code (docs/websocket-protocol.md §5.6), left open for new codes. */
export interface ChatErrorInfo {
  /** Human-readable detail. */
  message: string;
  /** Machine-readable code, when the source provides one. */
  code?: string;
}
