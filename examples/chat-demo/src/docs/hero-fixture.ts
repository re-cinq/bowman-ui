// The conversation behind the documentation index's hero screenshot,
// which is also copied to docs/assets/hero-split.png for the root README.
// Unrelated to the chat fixture in src/fixtures.ts: it exists only to
// be rendered through the real library components and captured to a PNG by
// scripts/capture-hero.mjs. An engineer asking about caching strategy for a
// backend service - wholesome, free of personal data, and close to what the
// library's own consumers actually build. One exchange, then a second
// question left mid-response, so the capture also shows the busy
// ThinkingIndicator tail: a markdown reply with a list, a code block and a
// table, and the composer.

import type { ChatEntry, ConversationListItem } from "@re-cinq/bowman-ui";

export const heroUserInitials = "LM";

export const heroAiDisclosure =
  "You are talking to an artificial intelligence. Answers can contain mistakes.";

export const heroComposerPlaceholder = "Message Bowman...";

export const heroSidebarConversations: ReadonlyArray<ConversationListItem> = [
  {
    id: "cache-strategy-review",
    title: "Cache strategy review",
    timestamp: "Today",
    badge: "active",
  },
  { id: "flaky-test-triage", title: "Flaky test triage", timestamp: "Yesterday" },
  { id: "new-conversation", title: "New conversation", timestamp: "Aug 20" },
];

export const heroActiveConversationId = "cache-strategy-review";

const heroAssistantReply = [
  "Here is the cache comparison you asked for.",
  "Key trade-offs:",
  "- LRU keeps hot keys but evicts scan survivors",
  "- TTL bounds staleness without tracking access order",
  "- A stale-while-revalidate layer hides refresh latency",
  "```js\nconst cached = cache.get(key);\nif (cached && !isExpired(cached)) return cached.value;\n```",
  "| Strategy | Hit rate | Staleness bound |\n| --- | --- | --- |\n| LRU | 91% | unbounded |\n| TTL 60s | 84% | 60 seconds |",
  "For your read-heavy workload, LRU with a short TTL wins.",
].join("\n\n");

export const heroConversation: ReadonlyArray<ChatEntry> = [
  {
    id: "hero-1",
    role: "user",
    content: "Compare LRU and TTL caching for the profile service.",
  },
  {
    id: "hero-2",
    role: "assistant",
    content: heroAssistantReply,
    isStreaming: false,
  },
  {
    id: "hero-3",
    role: "user",
    content: "What happens if traffic doubles?",
  },
];
