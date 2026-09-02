import { useEffect, useRef, useState } from "react";
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
  createStreamingAssistantEntry,
  demoUserInitials,
  initialEntriesByConversation,
  type DemoEntry,
} from "./fixtures";
import { DocsApp } from "./docs/DocsApp";
import { staticDemoNote } from "./staticDemoNote";
import { streamAssistantReply } from "./streaming";
import {
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
} from "./labels";

const brandName = "Marginalia Books";
const toastDurationMs = 4000;
const conversationsNavKey = "conversations";
const settingsNavKey = "settings";

// The documentation is the landing: bare "/" (and the "?view=docs" alias that
// keeps existing component links resolving) renders the docs, and only
// "?view=chat" reaches the chat fixture - a local-test-only surface with no
// on-page link to it. "&component=<slug>" picks a docs page inside the docs
// view. Read once, at module scope, from the URL the document was loaded with:
// the demo has no router and needs none.
const query = new URLSearchParams(window.location.search);
const chatRequested = query.get("view") === "chat";
const requestedComponent = query.get("component");

export function App() {
  return chatRequested ? <ChatScreen /> : <DocsApp componentId={requestedComponent} />;
}

function ChatScreen() {
  const [entriesByConversation, setEntriesByConversation] = useState(initialEntriesByConversation);
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id);
  const [activeNavKey, setActiveNavKey] = useState(conversationsNavKey);
  const [busy, setBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const cancelStream = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelStream.current?.(), []);

  const activeEntries = entriesByConversation[activeConversationId] ?? [];

  const navItems: ReadonlyArray<SidebarNavItem> = [
    {
      key: conversationsNavKey,
      label: navConversationsLabel,
      isActive: activeNavKey === conversationsNavKey,
    },
    {
      key: settingsNavKey,
      label: navSettingsLabel,
      isActive: activeNavKey === settingsNavKey,
    },
  ];

  const appendEntry = (conversationId: string, entry: DemoEntry) => {
    setEntriesByConversation((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), entry],
    }));
  };

  const mapEntry = (
    conversationId: string,
    entryId: string,
    change: (entry: DemoEntry) => DemoEntry
  ) => {
    setEntriesByConversation((current) => ({
      ...current,
      [conversationId]: (current[conversationId] ?? []).map((entry) =>
        entry.id === entryId ? change(entry) : entry
      ),
    }));
  };

  const growEntry = (conversationId: string, entryId: string, chunk: string) => {
    mapEntry(conversationId, entryId, (entry) => ({ ...entry, content: entry.content + chunk }));
  };

  const commitEntry = (conversationId: string, entryId: string) => {
    mapEntry(conversationId, entryId, (entry) =>
      entry.role === "assistant" ? { ...entry, isStreaming: false } : entry
    );
  };

  const handleSubmit = (text: string) => {
    const conversationId = activeConversationId;
    const replyId = crypto.randomUUID();
    appendEntry(conversationId, { id: crypto.randomUUID(), role: "user", content: text });
    setBusy(true);
    cancelStream.current?.();
    cancelStream.current = streamAssistantReply((event) => {
      if (event.kind === "upsert") {
        appendEntry(conversationId, createStreamingAssistantEntry(replyId));
        setBusy(false);
        return;
      }
      if (event.kind === "delta") {
        growEntry(conversationId, replyId, event.text);
        return;
      }
      commitEntry(conversationId, replyId);
    });
  };

  const navigate = (key: string, close: () => void) => {
    close();
    if (key === settingsNavKey) {
      setToastMessage(toastDemoOnlyMessage);
      return;
    }
    setActiveNavKey(key);
  };

  const renderSidebar = (context: SidebarSlotContext) => (
    <AppSidebar
      brand={brandName}
      navItems={navItems}
      onNavigate={(key) => navigate(key, context.close)}
      labels={appSidebarLabels}
      footer={
        <button
          type="button"
          onClick={() => {
            context.close();
            setToastMessage(toastDemoOnlyMessage);
          }}
          className="w-full px-4 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {signOutLabel}
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
            greeting={<p className="text-lg text-slate-600 dark:text-slate-300">{greetingText}</p>}
            onCopy={() => setToastMessage(toastCopiedMessage)}
          />
          <div className="mx-auto w-full max-w-3xl px-4 pb-4">
            <ChatComposer onSubmit={handleSubmit} labels={chatComposerLabels} />
            <p
              data-static-demo-note
              className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500"
            >
              {staticDemoNote}
            </p>
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
