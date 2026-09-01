// Illustrative Danish catalogue only. These strings have not been reviewed by
// a Danish speaker and are not the real support-agent catalogue: the real
// disclosure wording and customer-facing copy are owned by re-cinq/Otto#32
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
import type { DocsLabels } from "./docs-labels";

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
  assistantMessageFrom: (name: string) => `Svar fra ${name}`,
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
  thinkingTrace: "Ræsonnement",
};

export const chatComposerLabels: ChatComposerLabels = {
  composerInput: "Skriv en besked",
  composerPlaceholder: "Skriv til os her...",
  send: "Send beskeden",
};

export const toastCopiedMessage = "Svaret er kopieret til udklipsholderen.";

export const toastDemoOnlyMessage = "Kun til demonstration - ikke en rigtig side.";

export const navConversationsLabel = "Samtaler";
export const navSettingsLabel = "Indstillinger";
export const signOutLabel = "Log ud af demoen";
export const greetingText = "Hvordan kan vi hjælpe dig i dag?";

export const docsLabels: DocsLabels = {
  title: "Komponentdokumentation",
  intro:
    "Hver offentlig komponent i @re-cinq/bowman-ui med sit formål, sin import, et kørende eksempel, sine egenskaber og sine etiketter. Selve dokumentationen er på engelsk; siden omkring den følger VITE_DEMO_LOCALE.",
  components: "Komponenter",
  overview: "Kroge, markdown og typer",
  backToChat: "Tilbage til chatten",
  backToIndex: "Tilbage til oversigten",
  purpose: "Formål",
  importHeading: "Import",
  usage: "Brug",
  props: "Egenskaber",
  labelsHeading: "Etiketter",
  variants: "Tilstande",
  propName: "Navn",
  propType: "Type",
  propRequired: "Påkrævet",
  propDefault: "Standard",
  propDescription: "Beskrivelse",
  required: "ja",
  optional: "nej",
  noDefault: "ingen standard",
  labelsNote:
    "Etiketterne er bibliotekets eneste sprogmekanisme: en delvis etiketpakke lægges hen over de engelske standarder, nøgle for nøgle.",
};
