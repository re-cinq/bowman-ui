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
import { resolveTheme, type DemoTheme } from "./themes";
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

const toastDurationMs = 4000;
const conversationsNavKey = "conversations";
const settingsNavKey = "settings";

// The documentation is the landing: bare "/" (and the "?view=docs" alias that
// keeps existing component links resolving) renders the docs, and only
// "?view=chat" reaches the chat fixture - a local-test-only surface with no
// on-page link to it. "&component=<slug>" picks a docs page inside the docs
// view. "&theme=copperline" - meaningful only with "?view=chat" - renders the
// same chat fixture as the invented second company: wrapped in the class that
// overrides the theming tokens, under its own name, with its own avatar mark;
// an unknown value falls back to the default theme. Read once, at module scope,
// from the URL the document was loaded with: the demo has no router and needs
// none.
const query = new URLSearchParams(window.location.search);
const chatRequested = query.get("view") === "chat";
const requestedComponent = query.get("component");
const requestedTheme = resolveTheme(query.get("theme"));

export function App() {
  return chatRequested ? (
    <ChatScreen theme={requestedTheme} />
  ) : (
    <DocsApp componentId={requestedComponent} />
  );
}

function ChatScreen({ theme }: { theme: DemoTheme }) {
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
      brand={theme.name}
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

  const screen = (
    <>
      <AppShell brand={theme.name} renderSidebar={renderSidebar} labels={appShellLabels}>
        <div className="flex h-full min-h-0 flex-col">
          <ChatMessageList
            entries={activeEntries}
            userInitials={demoUserInitials}
            assistantAvatar={theme.assistantAvatar}
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

  if (theme.className === undefined) {
    return screen;
  }

  return <div className={theme.className}>{screen}</div>;
}
