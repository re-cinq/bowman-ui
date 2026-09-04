import type { AssistantChatEntry, UserChatEntry } from "@re-cinq/bowman-ui";

export const fixtureUserInitials = "KT";

export const fixtureUserEntry: UserChatEntry = {
  id: "fixture-user-1",
  role: "user",
  content: "Hi, can I move the delivery of order VN-7305-KP to Friday?",
};

export const fixtureAssistantEntry: AssistantChatEntry = {
  id: "fixture-assistant-1",
  role: "assistant",
  content:
    "Hi Karla! Order **VN-7305-KP** can be moved to Friday at no charge. The books are the same as before.",
  isStreaming: false,
};

export const fixturePersonaId = "fixture-persona";

export const fixturePersonaName = "Billing";

export const fixtureAiDisclosure =
  "You are talking to an artificial intelligence. Answers can contain mistakes.";

export const fixturePersonaEntry: AssistantChatEntry = {
  id: "fixture-assistant-2",
  role: "assistant",
  content: "The new delivery is Friday at 09:15.",
  isStreaming: false,
  persona: fixturePersonaId,
};

export const fixtureEntries: ReadonlyArray<UserChatEntry | AssistantChatEntry> =
  [fixtureUserEntry, fixtureAssistantEntry, fixturePersonaEntry];
