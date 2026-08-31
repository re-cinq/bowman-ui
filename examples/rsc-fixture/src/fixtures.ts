import type { AssistantChatEntry, UserChatEntry } from "@re-cinq/bowman-ui";

export const fixtureUserInitials = "KT";

export const fixtureUserEntry: UserChatEntry = {
  id: "fixture-user-1",
  role: "user",
  content: "Hej, kan jeg ændre min afgang for reservation VN-7305-KP til fredag?",
};

export const fixtureAssistantEntry: AssistantChatEntry = {
  id: "fixture-assistant-1",
  role: "assistant",
  content:
    "Hej Karla! Reservation **VN-7305-KP** kan flyttes til fredag uden gebyr. Pladserne er de samme som før.",
  isStreaming: false,
};

export const fixturePersonaId = "fixture-persona";

export const fixturePersonaName = "Økonomi";

export const fixtureAiDisclosure =
  "Du taler med en kunstig intelligens. Svarene kan indeholde fejl.";

export const fixturePersonaEntry: AssistantChatEntry = {
  id: "fixture-assistant-2",
  role: "assistant",
  content: "Den nye afgang er fredag kl. 09:15.",
  isStreaming: false,
  persona: fixturePersonaId,
};

export const fixtureEntries: ReadonlyArray<UserChatEntry | AssistantChatEntry> = [
  fixtureUserEntry,
  fixtureAssistantEntry,
  fixturePersonaEntry,
];
