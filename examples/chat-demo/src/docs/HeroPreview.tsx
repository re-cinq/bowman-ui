// The surface scripts/capture-hero.mjs screenshots into
// src/docs/assets/chat-hero.png (also copied to docs/assets/hero-split.png
// for the root README). Rendered through the real library components - the
// full app shell, not just the transcript - so the hero image is what the
// package actually produces, never a mockup. Not part of the published app
// or its router: it is reached only through hero.html, which the production
// build (index.html only) does not emit. Single theme, light only: no
// consumer of this component gets a light/dark split.

import {
  AppShell,
  AppSidebar,
  ChatComposer,
  ChatIcon,
  ChatMessageList,
  ConversationList,
  PlusIcon,
  defaultAppShellLabels,
  defaultAppSidebarLabels,
  defaultChatComposerLabels,
  defaultChatMessageListLabels,
  defaultConversationListLabels,
} from "@re-cinq/bowman-ui";
import {
  heroActiveConversationId,
  heroAiDisclosure,
  heroComposerPlaceholder,
  heroConversation,
  heroSidebarConversations,
  heroUserInitials,
} from "./hero-fixture";

const heroChatMessageListLabels = {
  ...defaultChatMessageListLabels,
  aiDisclosure: heroAiDisclosure,
};

const heroChatComposerLabels = {
  ...defaultChatComposerLabels,
  composerPlaceholder: heroComposerPlaceholder,
};

const newChatButtonClassName =
  "flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

const renderSidebar = () => (
  <AppSidebar labels={defaultAppSidebarLabels}>
    <div className="flex flex-col gap-3 px-3 py-3">
      <button type="button" className={newChatButtonClassName}>
        <PlusIcon className="h-4 w-4" />
        New chat
      </button>
      <ConversationList
        items={heroSidebarConversations}
        activeId={heroActiveConversationId}
        labels={defaultConversationListLabels}
      />
    </div>
  </AppSidebar>
);

export function HeroPreview() {
  return (
    <div
      data-hero-capture
      className="h-screen w-[1320px] overflow-hidden bg-slate-50"
    >
      <AppShell renderSidebar={renderSidebar} labels={defaultAppShellLabels}>
        <div className="flex h-full min-h-0 flex-col">
          <ChatMessageList
            entries={heroConversation}
            userInitials={heroUserInitials}
            assistantAvatar={<ChatIcon className="h-4 w-4 text-blue-500" />}
            busy
            labels={heroChatMessageListLabels}
          />
          <div className="mx-auto w-full max-w-3xl px-4 pb-4">
            <ChatComposer onSubmit={() => {}} labels={heroChatComposerLabels} />
          </div>
        </div>
      </AppShell>
    </div>
  );
}
