// The English catalogue exists so a non-Danish reviewer can read the demo
// (VITE_DEMO_LOCALE=en). It deliberately hands the library's own exported
// defaults straight back: every component ships a complete English default
// set, so the only strings worth writing here are the ones no default can
// supply - the required `aiDisclosure` (CONTRACT.md § Labels decision 5) and
// the demo's own screen copy. Danish stays the default; see labels.ts.

import {
  defaultAppShellLabels,
  defaultAppSidebarLabels,
  defaultChatComposerLabels,
  defaultChatMessageListLabels,
  defaultConversationListLabels,
} from "@re-cinq/bowman-ui";
import type {
  AppShellLabels,
  AppSidebarLabels,
  ChatComposerLabels,
  ChatMessageListLabels,
  ConversationListLabels,
} from "@re-cinq/bowman-ui";
import type { DocsLabels } from "./docs-labels";

export const appShellLabels: AppShellLabels = defaultAppShellLabels;

export const appSidebarLabels: AppSidebarLabels = defaultAppSidebarLabels;

export const conversationListLabels: ConversationListLabels = defaultConversationListLabels;

export const chatMessageListLabels: ChatMessageListLabels = {
  ...defaultChatMessageListLabels,
  aiDisclosure: "You are talking to an artificial intelligence. Answers can contain mistakes.",
};

export const chatComposerLabels: ChatComposerLabels = defaultChatComposerLabels;

export const toastCopiedMessage = "The reply was copied to the clipboard.";

export const toastDemoOnlyMessage = "Demo only - not a real page";

export const navConversationsLabel = "Conversations";
export const navSettingsLabel = "Settings";
export const signOutLabel = "Sign out of the demo";
export const greetingText = "How can we help you today?";

export const docsLabels: DocsLabels = {
  title: "Component documentation",
  intro:
    "Every public component of @re-cinq/bowman-ui with its purpose, its import, a running example, its props and its labels. The documentation itself is English; the page around it follows VITE_DEMO_LOCALE.",
  components: "Components",
  overview: "Hooks, markdown and types",
  backToChat: "Back to the chat",
  backToIndex: "Back to the index",
  purpose: "Purpose",
  importHeading: "Import",
  usage: "Usage",
  props: "Props",
  labelsHeading: "Labels",
  variants: "States",
  propName: "Name",
  propType: "Type",
  propRequired: "Required",
  propDefault: "Default",
  propDescription: "Description",
  required: "yes",
  optional: "no",
  noDefault: "no default",
  labelsNote:
    "Labels are the library's only language mechanism: a partial label object is merged over the English defaults, key by key.",
};
