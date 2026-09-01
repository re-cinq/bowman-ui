// The demo's one locale switch. VITE_DEMO_LOCALE=en picks the English
// catalogue; anything else - unset included - keeps Danish, which is what the
// Playwright suite and the assistive-technology pass run against.
//
// This covers the chat demo only. The documentation view's chrome does not
// follow this switch - it imports `docsLabels` from `./docs-labels` directly.

import * as danish from "./labels";
import * as english from "./labels.en";

export const demoLocale = import.meta.env.VITE_DEMO_LOCALE === "en" ? "en" : "da";

export const {
  appShellLabels,
  appSidebarLabels,
  chatComposerLabels,
  chatMessageListLabels,
  conversationListLabels,
  greetingText,
  navConversationsLabel,
  navSettingsLabel,
  signOutLabel,
  toastCopiedMessage,
  toastDemoOnlyMessage,
} = demoLocale === "en" ? english : danish;
