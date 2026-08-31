// Illustrative Danish catalogue only. These strings have not been reviewed by
// a Danish speaker and are not the real support-agent catalogue: the real
// disclosure wording and customer-facing copy are owned by issue 32
// ("Ship the Danish AI disclosure on every surface the customer reaches").
// This app proves the label-substitution mechanism works end to end, not that
// the wording is correct.

import type {
  AppShellLabels,
  AppSidebarLabels,
  ChatComposerLabels,
  ChatMessageListLabels,
  ConversationListLabels,
} from "@re-cinq/bowman-ui";

export const appShellLabels: AppShellLabels = {
  openSidebar: "Åbn sidepanelet",
  closeSidebar: "Luk sidepanelet",
  skipToMainContent: "Gå til hovedindholdet",
  sidebarDialog: "Sidepanel",
};

export const appSidebarLabels: AppSidebarLabels = {
  sidebar: "Sidepanel",
  mainNavigation: "Hovednavigation",
};

export const conversationListLabels: ConversationListLabels = {
  conversations: "Samtaler",
  noConversations: "Ingen samtaler endnu",
  loadingConversations: "Henter samtaler",
  deleteConversation: (title: string) => `Slet samtalen: ${title}`,
};

export const chatMessageListLabels: ChatMessageListLabels = {
  aiDisclosure: "Du taler med en kunstig intelligens. Svarene kan indeholde fejl.",
  transcript: "Samtaleudskrift",
  userMessage: "Din besked",
  assistantMessage: "Assistentens svar",
  copy: "Kopiér svaret",
  copied: "Kopieret",
  copiedNotice: "Kopieret!",
  feedbackPositive: "Godt svar",
  feedbackNegative: "Dårligt svar",
  feedbackNotice: "Tak!",
  thinking: "Tænker",
  thinkingRegion: "Henter svar",
  linkOpensInNewTab: "(åbner i en ny fane)",
  activity: "Slår noget op",
  activityDone: "Slog noget op",
  details: "Detaljer",
};

export const chatComposerLabels: ChatComposerLabels = {
  composerInput: "Skriv en besked",
  composerPlaceholder: "Skriv til os her...",
  send: "Send beskeden",
};

export const toastCopiedMessage = "Svaret er kopieret til udklipsholderen.";
