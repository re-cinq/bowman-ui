// Entries the "states" strip of each doc page renders. English, like the rest
// of the documentation: these illustrate the API, not the demo chat screen at
// "/?view=chat", which has its own fixtures in src/fixtures.ts.

import type {
  AssistantChatEntry,
  ChatAttribution,
  ChatEntry,
  ConversationListItem,
  ThinkingChatEntry,
  ToolChatEntry,
  UserChatEntry,
} from "@re-cinq/bowman-ui";

export const docsUserInitials = "MW";

// ChatMessageList has no default for this one - see the labels table on its
// page - so every example that mounts a list has to supply it.
export const docsAiDisclosure =
  "You are talking to an artificial intelligence. Answers can contain mistakes.";

export const docsUserEntry: UserChatEntry = {
  id: "docs-user",
  role: "user",
  content: "When is The Cartographer's Atlas back in stock on Friday?",
};

export const docsMarkdownEntry: AssistantChatEntry = {
  id: "docs-markdown",
  role: "assistant",
  content:
    "The Friday restock arrives at **11:00** from the warehouse.\n\n| Edition | Price | Available |\n| --- | --- | --- |\n| Paperback | €12.99 | Friday |\n| Hardback | €24.99 | In stock |\n\nThe full terms are in the [delivery terms](https://example.invalid/terms). A `mailto:` or `tel:` link passes the default policy too; anything else is left as plain text.",
  isStreaming: false,
};

export const docsStreamingEntry: AssistantChatEntry = {
  id: "docs-streaming",
  role: "assistant",
  content: "I am checking the Friday restock for you, and",
  isStreaming: true,
};

export const docsNamedEntry: AssistantChatEntry = {
  id: "docs-named",
  role: "assistant",
  content: "The gift wrapping is on the order. An updated confirmation follows shortly.",
  isStreaming: false,
  persona: "orders",
};

export const docsFooterEntry: AssistantChatEntry = {
  id: "docs-footer",
  role: "assistant",
  content: "A delivery date can be moved without a fee until the day before dispatch.",
  isStreaming: false,
};

export const docsToolEntry: ToolChatEntry = {
  id: "docs-tool",
  role: "tool",
  toolName: "lookup_stock",
  toolInput: { title: "the-cartographers-atlas", format: "hardback", copies: 2 },
};

export const docsThinkingEntry: ThinkingChatEntry = {
  id: "docs-thinking",
  role: "thinking",
  content:
    "The customer asked about Friday. The Friday restock lands at 11:00 and includes the hardback. The order ships with the Flexible option, so a change costs nothing.",
  isStreaming: false,
};

export const docsStreamingThinkingEntry: ThinkingChatEntry = {
  id: "docs-thinking-streaming",
  role: "thinking",
  content: "The customer asked about Friday. The Friday restock",
  isStreaming: true,
};

// One entry of each role, in the order a real exchange produces them.
export const docsConversation: ReadonlyArray<ChatEntry> = [
  docsUserEntry,
  docsThinkingEntry,
  docsToolEntry,
  docsNamedEntry,
  {
    id: "docs-answer",
    role: "assistant",
    content: "The Friday restock arrives at 11:00 from the warehouse.",
    isStreaming: false,
    persona: "support",
  },
];

export const docsBusyConversation: ReadonlyArray<ChatEntry> = [docsUserEntry, docsToolEntry];

export const docsAttribution: Readonly<Record<string, ChatAttribution>> = {
  orders: { name: "Marginalia Orders" },
  support: { name: "Marginalia Support" },
};

export const docsConversationItems: ReadonlyArray<ConversationListItem> = [
  { id: "docs-1", title: "Delivery change for MB-4821-XQ", timestamp: "today 09:14" },
  {
    id: "docs-2",
    title: "Damaged copy of The Cartographer's Atlas",
    timestamp: "yesterday 16:02",
    badge: "2",
  },
  { id: "docs-3", title: "New conversation", timestamp: "today 10:31", isPlaceholderTitle: true },
];
