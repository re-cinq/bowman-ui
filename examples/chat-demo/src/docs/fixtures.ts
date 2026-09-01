// Entries the "states" strip of each doc page renders. English, like the rest
// of the documentation: these illustrate an English API, not the Danish
// product screen at "/", which has its own fixtures in src/fixtures.ts.

import type {
  AssistantChatEntry,
  ChatAttribution,
  ChatEntry,
  ConversationListItem,
  ThinkingChatEntry,
  ToolChatEntry,
  UserChatEntry,
} from "@re-cinq/bowman-ui";

export const docsUserInitials = "MV";

// ChatMessageList has no default for this one - see the labels table on its
// page - so every example that mounts a list has to supply it.
export const docsAiDisclosure =
  "You are talking to an artificial intelligence. Answers can contain mistakes.";

export const docsUserEntry: UserChatEntry = {
  id: "docs-user",
  role: "user",
  content: "When does the last ferry leave for Skagerakøen on Friday?",
};

export const docsMarkdownEntry: AssistantChatEntry = {
  id: "docs-markdown",
  role: "assistant",
  content:
    "The last sailing on Friday is **21:40** from Nordhavnsbro.\n\n| Departs | Arrives | Fare |\n| --- | --- | --- |\n| 17:10 | 18:25 | Standard |\n| 21:40 | 22:55 | Flexible |\n\nThe full terms are in the [travel conditions](https://example.invalid/terms). A `mailto:` or `tel:` link passes the default policy too; anything else is left as plain text.",
  isStreaming: false,
};

export const docsStreamingEntry: AssistantChatEntry = {
  id: "docs-streaming",
  role: "assistant",
  content: "I am checking the Friday sailings for you, and",
  isStreaming: true,
};

export const docsNamedEntry: AssistantChatEntry = {
  id: "docs-named",
  role: "assistant",
  content: "The cabin is on the booking. An updated itinerary follows shortly.",
  isStreaming: false,
  persona: "booking",
};

export const docsFooterEntry: AssistantChatEntry = {
  id: "docs-footer",
  role: "assistant",
  content: "A Flexible fare can be moved without a fee until two hours before departure.",
  isStreaming: false,
};

export const docsToolEntry: ToolChatEntry = {
  id: "docs-tool",
  role: "tool",
  toolName: "lookup_departures",
  toolInput: { route: "nordhavnsbro-skagerakoeen", date: "2026-09-04", passengers: 2 },
};

export const docsThinkingEntry: ThinkingChatEntry = {
  id: "docs-thinking",
  role: "thinking",
  content:
    "The customer asked about Friday. Friday has three sailings and the last one is 21:40. The booking is Flexible, so a change costs nothing.",
  isStreaming: false,
};

export const docsStreamingThinkingEntry: ThinkingChatEntry = {
  id: "docs-thinking-streaming",
  role: "thinking",
  content: "The customer asked about Friday. Friday has",
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
    content: "The last sailing on Friday is 21:40 from Nordhavnsbro.",
    isStreaming: false,
    persona: "support",
  },
];

export const docsBusyConversation: ReadonlyArray<ChatEntry> = [docsUserEntry, docsToolEntry];

export const docsAttribution: Readonly<Record<string, ChatAttribution>> = {
  booking: { name: "Havkat Booking" },
  support: { name: "Havkat Support" },
};

export const docsConversationItems: ReadonlyArray<ConversationListItem> = [
  { id: "docs-1", title: "Rebooking HK-4821-XQ", timestamp: "today 09:14" },
  { id: "docs-2", title: "Luggage to Skagerakøen", timestamp: "yesterday 16:02", badge: "2" },
  { id: "docs-3", title: "New conversation", timestamp: "today 10:31", isPlaceholderTitle: true },
];
