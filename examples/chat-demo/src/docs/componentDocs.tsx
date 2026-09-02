// The documentation registry: one entry per public component, in the order the
// index lists them.
//
// The usage snippet on each page cannot drift from the code it documents. The
// example lives in its own file under examples/, is imported twice - once as a
// component to render, once through Vite's built-in `?raw` suffix to read its
// literal source - and the page shows both. Editing the example changes the
// running render and the printed listing in the same keystroke; there is no
// second copy to forget.

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  AppSidebar,
  ChatComposer,
  ChatMessage,
  ChatMessageList,
  ConversationList,
  ErrorBoundary,
  InlineThinkingIndicator,
  ThinkingIndicator,
  ThinkingTrace,
  ToolActivity,
  defaultAppShellLabels,
  defaultAppSidebarLabels,
  defaultChatComposerLabels,
  defaultChatMessageLabels,
  defaultChatMessageListLabels,
  defaultConversationListLabels,
  defaultErrorBoundaryLabels,
  defaultInlineThinkingIndicatorLabels,
  defaultThinkingIndicatorLabels,
  defaultThinkingTraceLabels,
  defaultToolActivityLabels,
} from "@re-cinq/bowman-ui";
import type { ChatComposerHandle, ToolChatEntry } from "@re-cinq/bowman-ui";
import { AppShellExample } from "./examples/AppShellExample";
import appShellSource from "./examples/AppShellExample.tsx?raw";
import { AppSidebarExample } from "./examples/AppSidebarExample";
import appSidebarSource from "./examples/AppSidebarExample.tsx?raw";
import { ChatComposerExample } from "./examples/ChatComposerExample";
import chatComposerSource from "./examples/ChatComposerExample.tsx?raw";
import { ChatMessageExample } from "./examples/ChatMessageExample";
import chatMessageSource from "./examples/ChatMessageExample.tsx?raw";
import { ChatMessageListExample } from "./examples/ChatMessageListExample";
import chatMessageListSource from "./examples/ChatMessageListExample.tsx?raw";
import { ConversationListExample } from "./examples/ConversationListExample";
import conversationListSource from "./examples/ConversationListExample.tsx?raw";
import { ErrorBoundaryExample } from "./examples/ErrorBoundaryExample";
import errorBoundarySource from "./examples/ErrorBoundaryExample.tsx?raw";
import { IconsExample } from "./examples/IconsExample";
import iconsSource from "./examples/IconsExample.tsx?raw";
import { InlineThinkingIndicatorExample } from "./examples/InlineThinkingIndicatorExample";
import inlineThinkingIndicatorSource from "./examples/InlineThinkingIndicatorExample.tsx?raw";
import { ThinkingIndicatorExample } from "./examples/ThinkingIndicatorExample";
import thinkingIndicatorSource from "./examples/ThinkingIndicatorExample.tsx?raw";
import { ThinkingTraceExample } from "./examples/ThinkingTraceExample";
import thinkingTraceSource from "./examples/ThinkingTraceExample.tsx?raw";
import { ToastExample } from "./examples/ToastExample";
import toastSource from "./examples/ToastExample.tsx?raw";
import { ToolActivityExample } from "./examples/ToolActivityExample";
import toolActivitySource from "./examples/ToolActivityExample.tsx?raw";
import {
  docsAiDisclosure,
  docsAttribution,
  docsBusyConversation,
  docsConversation,
  docsConversationItems,
  docsFooterEntry,
  docsMarkdownEntry,
  docsNamedEntry,
  docsStreamingEntry,
  docsStreamingThinkingEntry,
  docsThinkingEntry,
  docsToolEntry,
  docsUserEntry,
  docsUserInitials,
} from "./fixtures";
import {
  appShellPropDocs,
  appSidebarPropDocs,
  chatComposerPropDocs,
  chatMessageListPropDocs,
  chatMessagePropDocs,
  conversationListPropDocs,
  errorBoundaryPropDocs,
  iconPropDocs,
  inlineThinkingIndicatorPropDocs,
  thinkingIndicatorPropDocs,
  thinkingTracePropDocs,
  toastPropDocs,
  toolActivityPropDocs,
  type PropDoc,
} from "./propDocs";

/** A default label is either a string or the function form an interpolated label takes. */
export type LabelValue = string | ((value: string) => string);

export interface DocVariant {
  id: string;
  /** English, like every other line describing the library. */
  caption: string;
  node: ReactNode;
}

export interface ComponentDoc {
  /** URL slug, carried in the `component` query parameter. */
  id: string;
  name: string;
  purpose: string;
  importLine: string;
  Example: ComponentType;
  exampleSource: string;
  props: Readonly<Record<string, PropDoc>>;
  /** Absent for a component that renders no strings of its own. */
  labels?: {
    defaults: Readonly<Record<string, LabelValue>>;
    /** Keys the library ships no default for, so the prop cannot be omitted. */
    missing: ReadonlyArray<string>;
  };
  variants: ReadonlyArray<DocVariant>;
}

const ignore = () => {};

function BoundedList({ children }: { children: ReactNode }) {
  return <div className="flex h-96 flex-col overflow-hidden">{children}</div>;
}

// ThinkingTrace and ToolActivity hide their detail behind a native <details>,
// which no prop opens - the reader clicks it. Showing the expanded state costs
// one attribute on mount.
function OpenedDetails({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stageRef.current?.querySelector("details")?.setAttribute("open", "");
  }, []);

  return <div ref={stageRef}>{children}</div>;
}

function GrownComposer() {
  const composerRef = useRef<ChatComposerHandle>(null);

  useEffect(() => {
    composerRef.current?.setValue(
      "Hello again,\nI would like to move the delivery to Friday.\nSame delivery slot if that is possible."
    );
  }, []);

  return <ChatComposer ref={composerRef} onSubmit={ignore} />;
}

function CustomFallbackBoundary() {
  const [broken, setBroken] = useState(false);

  return (
    <ErrorBoundary
      onError={() => setBroken(false)}
      fallback={
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          A consumer-authored fallback, including its own role=&quot;alert&quot;.
        </p>
      }
    >
      <FallbackTrigger broken={broken} onBreak={() => setBroken(true)} />
    </ErrorBoundary>
  );
}

function FallbackTrigger({ broken, onBreak }: { broken: boolean; onBreak: () => void }) {
  if (broken) {
    throw new Error("A render failed");
  }
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700"
      onClick={onBreak}
    >
      Throw during render
    </button>
  );
}

const describeTool = (_entry: ToolChatEntry, pending: boolean): ReactNode =>
  pending ? "Looking up stock" : "Looked up stock";

export const componentDocs: ReadonlyArray<ComponentDoc> = [
  {
    id: "chat-message",
    name: "ChatMessage",
    purpose:
      "One turn of a conversation. Reach for it when you are laying out messages yourself; reach for ChatMessageList when you want the whole transcript. It renders a user turn as a plain bubble and an assistant turn as markdown behind a link and image policy, with copy and feedback affordances that appear on hover or focus. Only user and assistant entries are renderable: handing it a thinking or tool entry is a compile error rather than a silent blank, so tool arguments cannot reach a customer's screen by accident.",
    importLine: 'import { ChatMessage } from "@re-cinq/bowman-ui";',
    Example: ChatMessageExample,
    exampleSource: chatMessageSource,
    props: chatMessagePropDocs,
    labels: { defaults: defaultChatMessageLabels, missing: [] },
    variants: [
      {
        id: "user",
        caption: "User turn",
        node: <ChatMessage entry={docsUserEntry} userInitials={docsUserInitials} />,
      },
      {
        id: "markdown",
        caption: "Assistant, committed, with markdown and a policy-allowed link",
        node: <ChatMessage entry={docsMarkdownEntry} userInitials={docsUserInitials} />,
      },
      {
        id: "streaming",
        caption: "Assistant, streaming: no action row until the entry commits",
        node: <ChatMessage entry={docsStreamingEntry} userInitials={docsUserInitials} />,
      },
      {
        id: "named",
        caption: "With assistantName: a name line, and the article's accessible name",
        node: (
          <ChatMessage
            entry={docsNamedEntry}
            userInitials={docsUserInitials}
            assistantName="Marginalia Orders"
          />
        ),
      },
      {
        id: "footer",
        caption: "With a footer node under the action row",
        node: (
          <ChatMessage
            entry={docsFooterEntry}
            userInitials={docsUserInitials}
            footer={
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source: an invented delivery term
              </p>
            }
          />
        ),
      },
    ],
  },
  {
    id: "chat-message-list",
    name: "ChatMessageList",
    purpose:
      "The whole transcript: the EU AI Act disclosure pinned outside the scroll region, a labelled log the reader can scroll, and one row per entry dispatched on role. It keeps the reader pinned to the bottom while a reply streams and stops doing so the moment they scroll away. Reach for it as the default chat surface; its labels prop is the only one in the library that is required, because the disclosure line has no English default to fall back on.",
    importLine: 'import { ChatMessageList } from "@re-cinq/bowman-ui";',
    Example: ChatMessageListExample,
    exampleSource: chatMessageListSource,
    props: chatMessageListPropDocs,
    labels: { defaults: defaultChatMessageListLabels, missing: ["aiDisclosure"] },
    variants: [
      {
        id: "conversation",
        caption: "All four roles, showThinking on, two personas through attribution",
        node: (
          <BoundedList>
            <ChatMessageList
              entries={docsConversation}
              userInitials={docsUserInitials}
              labels={{ aiDisclosure: docsAiDisclosure }}
              attribution={docsAttribution}
              showThinking
            />
          </BoundedList>
        ),
      },
      {
        id: "busy",
        caption: "busy: a ThinkingIndicator after the last entry, and a pending tool row",
        node: (
          <BoundedList>
            <ChatMessageList
              entries={docsBusyConversation}
              userInitials={docsUserInitials}
              labels={{ aiDisclosure: docsAiDisclosure }}
              busy
            />
          </BoundedList>
        ),
      },
      {
        id: "empty",
        caption: "Empty state: the greeting replaces the transcript, the disclosure stays",
        node: (
          <BoundedList>
            <ChatMessageList
              entries={[]}
              userInitials={docsUserInitials}
              labels={{ aiDisclosure: docsAiDisclosure }}
              greeting={
                <p className="text-lg text-slate-600 dark:text-slate-300">
                  How can we help you today?
                </p>
              }
            />
          </BoundedList>
        ),
      },
    ],
  },
  {
    id: "tool-activity",
    name: "ToolActivity",
    purpose:
      "A tool invocation the model requested, rendered as a status line rather than a message: no avatar, no copy, no feedback. The default withholds both the tool name (a machine identifier, not customer-facing copy) and the arguments (model-authored data that may carry an order reference), and a consumer opts each in per prop. Arguments, when shown, are JSON in a pre behind a native details element, so nothing model-authored is ever interpreted as markup.",
    importLine: 'import { ToolActivity } from "@re-cinq/bowman-ui";',
    Example: ToolActivityExample,
    exampleSource: toolActivitySource,
    props: toolActivityPropDocs,
    labels: { defaults: defaultToolActivityLabels, missing: [] },
    variants: [
      {
        id: "default",
        caption: "Default: the safe state, with no name and no arguments",
        node: <ToolActivity entry={docsToolEntry} />,
      },
      {
        id: "pending",
        caption: "pending: the present-tense label",
        node: <ToolActivity entry={docsToolEntry} pending />,
      },
      {
        id: "tool-name",
        caption: "showToolName: the machine identifier, opted in",
        node: <ToolActivity entry={docsToolEntry} showToolName />,
      },
      {
        id: "tool-input",
        caption: "showToolInput, shown expanded: JSON in a pre, never markdown",
        node: (
          <OpenedDetails>
            <ToolActivity entry={docsToolEntry} showToolInput />
          </OpenedDetails>
        ),
      },
      {
        id: "describe-tool",
        caption: "describeTool: a caller-authored sentence, in both tenses",
        node: (
          <div className="flex flex-col gap-2">
            <ToolActivity entry={docsToolEntry} describeTool={describeTool} pending />
            <ToolActivity entry={docsToolEntry} describeTool={describeTool} />
          </div>
        ),
      },
    ],
  },
  {
    id: "thinking-trace",
    name: "ThinkingTrace",
    purpose:
      "The model's own reasoning, persisted as a thinking entry and rendered behind a native details element that stays collapsed until a reader asks for it. The summary carries the label alone, never a preview, and no state opens the section on its own. The content is plain text in a pre-wrap block, never markdown and never HTML: nobody reviews its shape the way an assistant answer is reviewed. ChatMessageList only mounts it when showThinking is on.",
    importLine: 'import { ThinkingTrace } from "@re-cinq/bowman-ui";',
    Example: ThinkingTraceExample,
    exampleSource: thinkingTraceSource,
    props: thinkingTracePropDocs,
    labels: { defaults: defaultThinkingTraceLabels, missing: [] },
    variants: [
      {
        id: "committed",
        caption: "Committed and collapsed",
        node: <ThinkingTrace entry={docsThinkingEntry} />,
      },
      {
        id: "streaming",
        caption: "Streaming: the dots sit in the summary",
        node: <ThinkingTrace entry={docsStreamingThinkingEntry} />,
      },
      {
        id: "expanded",
        caption: "Expanded by the reader",
        node: (
          <OpenedDetails>
            <ThinkingTrace entry={docsThinkingEntry} />
          </OpenedDetails>
        ),
      },
    ],
  },
  {
    id: "chat-composer",
    name: "ChatComposer",
    purpose:
      "The input surface: an uncontrolled textarea that grows with the draft up to a cap and then scrolls, Enter to send, Shift+Enter for a newline, and an IME guard so committing a candidate never sends a half-finished message. Write into it from outside through its ref handle, which exposes focus() and setValue(). Reach for busy while a reply streams and disabled when the whole surface is unavailable; both disable the field, and only busy pulses.",
    importLine:
      'import { ChatComposer } from "@re-cinq/bowman-ui";\nimport type { ChatComposerHandle } from "@re-cinq/bowman-ui";',
    Example: ChatComposerExample,
    exampleSource: chatComposerSource,
    props: chatComposerPropDocs,
    labels: { defaults: defaultChatComposerLabels, missing: [] },
    variants: [
      { id: "empty", caption: "Empty", node: <ChatComposer onSubmit={ignore} /> },
      {
        id: "grown",
        caption: "Grown to several lines through the ref handle's setValue()",
        node: <GrownComposer />,
      },
      {
        id: "busy",
        caption: "busy: disabled and pulsing",
        node: <ChatComposer onSubmit={ignore} busy />,
      },
      {
        id: "disabled",
        caption: "disabled: the same field, no pulse",
        node: <ChatComposer onSubmit={ignore} disabled />,
      },
    ],
  },
  {
    id: "thinking-indicator",
    name: "ThinkingIndicator",
    purpose:
      "The block-level wait marker shown after the last entry while a response is still on its way. It is a labelled status region with an aria-hidden avatar circle, because an announced avatar inside a live region is only noise. ChatMessageList renders one for you when busy is set; reach for it directly only if you are laying out the transcript yourself.",
    importLine: 'import { ThinkingIndicator } from "@re-cinq/bowman-ui";',
    Example: ThinkingIndicatorExample,
    exampleSource: thinkingIndicatorSource,
    props: thinkingIndicatorPropDocs,
    labels: { defaults: defaultThinkingIndicatorLabels, missing: [] },
    variants: [{ id: "default", caption: "Default", node: <ThinkingIndicator /> }],
  },
  {
    id: "inline-thinking-indicator",
    name: "InlineThinkingIndicator",
    purpose:
      "The same wait marker at message scale: it sits inside an assistant message that is streaming but has produced no content yet, and disappears for good once the first token or tool status arrives. ChatMessage mounts it on your behalf; it is exported so a consumer laying out its own message body can reuse the exact affordance rather than approximating it.",
    importLine: 'import { InlineThinkingIndicator } from "@re-cinq/bowman-ui";',
    Example: InlineThinkingIndicatorExample,
    exampleSource: inlineThinkingIndicatorSource,
    props: inlineThinkingIndicatorPropDocs,
    labels: { defaults: defaultInlineThinkingIndicatorLabels, missing: [] },
    variants: [{ id: "default", caption: "Default", node: <InlineThinkingIndicator /> }],
  },
  {
    id: "toast",
    name: "Toast",
    purpose:
      "A short notification that dismisses itself: a visible pill plus a separate visually hidden status region, which starts empty and receives the text one commit later so screen readers reliably announce it. The countdown restarts on a new message and survives a parent re-render that hands it a fresh onClose. Mount it while you have something to say and unmount it from onClose; pass duration null to keep it until you take it away.",
    importLine: 'import { Toast } from "@re-cinq/bowman-ui";',
    Example: ToastExample,
    exampleSource: toastSource,
    props: toastPropDocs,
    variants: [],
  },
  {
    id: "error-boundary",
    name: "ErrorBoundary",
    purpose:
      'A class error boundary with a labelled fallback and a retry button that re-renders the subtree. Wrap the parts of a screen that may fail independently. It never writes to the console: onError is the only reporting channel, so the consumer decides what reaches Sentry. Supplying fallback replaces the built-in UI entirely, including its role="alert" wrapper, which the consumer then has to re-add.',
    importLine: 'import { ErrorBoundary } from "@re-cinq/bowman-ui";',
    Example: ErrorBoundaryExample,
    exampleSource: errorBoundarySource,
    props: errorBoundaryPropDocs,
    labels: { defaults: defaultErrorBoundaryLabels, missing: [] },
    variants: [
      {
        id: "custom-fallback",
        caption: "A consumer-supplied fallback replaces the built-in one",
        node: <CustomFallbackBoundary />,
      },
    ],
  },
  {
    id: "conversation-list",
    name: "ConversationList",
    purpose:
      "The sidebar list of conversations: a labelled list with an optional current row, an optional delete button that fires immediately, and a typewriter animation that runs only when a row whose title was a known placeholder gets its real title. renderLink is the routing seam - return your framework's link element and spread every prop it is handed, and the list keeps its own class names, current marking and click behaviour.",
    importLine: 'import { ConversationList } from "@re-cinq/bowman-ui";',
    Example: ConversationListExample,
    exampleSource: conversationListSource,
    props: conversationListPropDocs,
    labels: { defaults: defaultConversationListLabels, missing: [] },
    variants: [
      {
        id: "loading",
        caption: "isLoading: a labelled spinner in place of the list",
        node: <ConversationList items={[]} isLoading />,
      },
      { id: "empty", caption: "No items", node: <ConversationList items={[]} /> },
    ],
  },
  {
    id: "app-sidebar",
    name: "AppSidebar",
    purpose:
      "The sidebar's contents, and its landmarks: an aside with an optional brand row, an optional nav landmark built from nav items, a scrollable middle for whatever the app keeps there, and an optional bordered footer. It runs no path comparison of its own - isActive is the consumer's answer - and renderNavLink is the same routing seam ConversationList offers. Render it from AppShell's renderSidebar so one implementation serves both the desktop rail and the mobile drawer.",
    importLine: 'import { AppSidebar } from "@re-cinq/bowman-ui";',
    Example: AppSidebarExample,
    exampleSource: appSidebarSource,
    props: appSidebarPropDocs,
    labels: { defaults: defaultAppSidebarLabels, missing: [] },
    variants: [
      {
        id: "no-chrome",
        caption: "No brand and no footer: neither bordered region renders at all",
        node: (
          <div className="flex h-64 w-72 flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <AppSidebar>
              <div className="px-3 py-3">
                <ConversationList items={docsConversationItems} activeId="docs-1" />
              </div>
            </AppSidebar>
          </div>
        ),
      },
    ],
  },
  {
    id: "app-shell",
    name: "AppShell",
    purpose:
      "The frame around a whole screen, and the frame around this page. Above the md breakpoint it lays out a fixed sidebar rail beside a scrolling main region; below it, the sidebar becomes a focus-trapped drawer behind a hamburger, with a backdrop, Escape to close, focus returned to the trigger and the body scroll lock lifted again on rotation to desktop. It ships a skip link by default. renderSidebar is called once per position, so one implementation covers both.",
    importLine: 'import { AppShell } from "@re-cinq/bowman-ui";',
    Example: AppShellExample,
    exampleSource: appShellSource,
    props: appShellPropDocs,
    labels: { defaults: defaultAppShellLabels, missing: [] },
    variants: [],
  },
  {
    id: "icons",
    name: "Icons",
    purpose:
      'Twenty-three stroke icons drawn in this repository rather than pulled from an icon package, so the published bundle carries no icon dependency. Every icon takes the same props: an icon given an ariaLabel becomes role="img" with that name, and one given none is aria-hidden, which is what a glyph beside a text label wants. IconWrapper and getAccessibleIconProps are exported too, for a consumer drawing an icon of its own that has to behave the same way.',
    importLine: 'import { SearchIcon, SendIcon } from "@re-cinq/bowman-ui";',
    Example: IconsExample,
    exampleSource: iconsSource,
    props: iconPropDocs,
    variants: [],
  },
];

export const componentDocById = (id: string | null): ComponentDoc | undefined =>
  componentDocs.find((doc) => doc.id === id);
