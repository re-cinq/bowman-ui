import { useState } from "react";
import {
  AppShell,
  AppSidebar,
  ChatComposer,
  ChatMessageList,
  ConversationList,
  Toast,
} from "@re-cinq/bowman-ui";
import type { SidebarNavItem, SidebarSlotContext } from "@re-cinq/bowman-ui";
import {
  conversations,
  createAssistantReply,
  demoUserInitials,
  initialEntriesByConversation,
  type DemoEntry,
} from "./fixtures";
import {
  appShellLabels,
  appSidebarLabels,
  chatComposerLabels,
  chatMessageListLabels,
  conversationListLabels,
  toastCopiedMessage,
} from "./labels";

const brandName = "Havkat Rejser";
const assistantReplyDelayMs = 600;
const toastDurationMs = 4000;

export function App() {
  const [entriesByConversation, setEntriesByConversation] = useState(initialEntriesByConversation);
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id);
  const [activeNavKey, setActiveNavKey] = useState("samtaler");
  const [busy, setBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeEntries = entriesByConversation[activeConversationId] ?? [];

  const navItems: ReadonlyArray<SidebarNavItem> = [
    { key: "samtaler", label: "Samtaler", isActive: activeNavKey === "samtaler" },
    { key: "indstillinger", label: "Indstillinger", isActive: activeNavKey === "indstillinger" },
  ];

  const appendEntry = (conversationId: string, entry: DemoEntry) => {
    setEntriesByConversation((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), entry],
    }));
  };

  const handleSubmit = (text: string) => {
    const conversationId = activeConversationId;
    appendEntry(conversationId, { id: crypto.randomUUID(), role: "user", content: text });
    setBusy(true);
    setTimeout(() => {
      appendEntry(conversationId, createAssistantReply(crypto.randomUUID()));
      setBusy(false);
    }, assistantReplyDelayMs);
  };

  const renderSidebar = (context: SidebarSlotContext) => (
    <AppSidebar
      brand={brandName}
      navItems={navItems}
      onNavigate={(key) => {
        setActiveNavKey(key);
        context.close();
      }}
      labels={appSidebarLabels}
      footer={
        <button
          type="button"
          onClick={context.close}
          className="w-full px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          Log ud af demoen
        </button>
      }
    >
      <div className="px-3 py-3">
        <ConversationList
          items={conversations}
          activeId={activeConversationId}
          onSelect={(id) => {
            setActiveConversationId(id);
            context.close();
          }}
          labels={conversationListLabels}
        />
      </div>
    </AppSidebar>
  );

  return (
    <>
      <AppShell brand={brandName} renderSidebar={renderSidebar} labels={appShellLabels}>
        <div className="flex h-full min-h-0 flex-col">
          <ChatMessageList
            entries={activeEntries}
            userInitials={demoUserInitials}
            labels={chatMessageListLabels}
            busy={busy}
            greeting={
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Hvordan kan vi hjælpe dig i dag?
              </p>
            }
            onCopy={() => setToastMessage(toastCopiedMessage)}
          />
          <div className="mx-auto w-full max-w-3xl px-4 pb-4">
            <ChatComposer onSubmit={handleSubmit} labels={chatComposerLabels} />
          </div>
        </div>
      </AppShell>
      {toastMessage !== null && (
        <Toast
          message={toastMessage}
          duration={toastDurationMs}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}
