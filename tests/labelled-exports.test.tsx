import { fireEvent, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AppShell,
  AppSidebar,
  ChatComposer,
  ChatMessage,
  ConversationList,
  ErrorBoundary,
  InlineThinkingIndicator,
  ThinkingIndicator,
  createMarkdownComponents,
  createUrlTransform,
  defaultAppShellLabels,
  defaultAppSidebarLabels,
  defaultChatComposerLabels,
  defaultChatMessageLabels,
  defaultConversationListLabels,
  defaultErrorBoundaryLabels,
  defaultInlineThinkingIndicatorLabels,
  defaultThinkingIndicatorLabels,
} from "../src/index.js";
import type {
  AppShellLabels,
  AppSidebarLabels,
  ChatComposerLabels,
  ChatMessageLabels,
  ConversationListLabels,
  ErrorBoundaryLabels,
  InlineThinkingIndicatorLabels,
  ThinkingIndicatorLabels,
} from "../src/index.js";
import {
  defaultMarkdownComponentsLabels,
  type MarkdownComponentsLabels,
} from "../src/markdown/components.js";

// CONTRACT.md § Labels enforcement (static, test-time - never a runtime
// warning): every VALUE export of the barrel is classified below. Type-only
// exports carry no strings and are excluded by design. A new export lands in
// exactly one bucket:
//   labelsProp     - takes labels?: Partial<XLabels> over English defaults
//   stringPropOnly - takes its strings through a dedicated prop (the three
//                    grandfathered shapes: icons' ariaLabel, useFocusGroups'
//                    announce, Toast's message)
//   noStrings      - renders/returns no user-visible or assistive string
const labelsProp = [
  "ErrorBoundary",
  "ChatMessage",
  "InlineThinkingIndicator",
  "ThinkingIndicator",
  "ChatComposer",
  "ConversationList",
  "AppShell",
  "AppSidebar",
  "createMarkdownComponents",
];

const stringPropOnly = [
  "ArtifactsIcon",
  "ChatIcon",
  "CheckIcon",
  "ChevronDownIcon",
  "ChevronUpIcon",
  "CloseIcon",
  "CompareIcon",
  "CopyIcon",
  "DashboardIcon",
  "DatabaseIcon",
  "ErrorIcon",
  "InfoIcon",
  "LoadingIcon",
  "MenuIcon",
  "PlusIcon",
  "RefreshIcon",
  "SearchIcon",
  "SendIcon",
  "SettingsIcon",
  "ThumbsDownIcon",
  "ThumbsUpIcon",
  "TrashIcon",
  "WarningIcon",
  "useFocusGroups",
  "Toast",
];

const noStrings = [
  "createUrlTransform",
  "defaultMarkdownPolicy",
  "IconWrapper",
  "getAccessibleIconProps",
  "useDebounce",
  "useFocusTrap",
  "useReducedMotion",
  "useSidebarState",
  "resolveLabels",
  "defaultErrorBoundaryLabels",
  "defaultChatMessageLabels",
  "defaultInlineThinkingIndicatorLabels",
  "defaultThinkingIndicatorLabels",
  "defaultChatComposerLabels",
  "defaultConversationListLabels",
  "defaultAppShellLabels",
  "defaultAppSidebarLabels",
];

// `export type { ... }` never matches: "type" sits between "export" and "{".
const parseValueExports = (source: string): string[] =>
  [...source.matchAll(/export\s*\{([^}]*)\}/g)].flatMap(([, names]) =>
    names
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  );

describe("the labels export partition", () => {
  it("labelsProp, stringPropOnly and noStrings together are exactly src/index.ts's value exports", () => {
    const source = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");
    const exported = [...parseValueExports(source)].sort();
    const classified = [...labelsProp, ...stringPropOnly, ...noStrings].sort();

    const unclassified = exported.filter((name) => !classified.includes(name));
    expect(
      unclassified,
      `Unclassified export(s): ${unclassified.join(", ")}. Every value export must be placed in ` +
        `labelsProp, stringPropOnly or noStrings in tests/labelled-exports.test.tsx - ` +
        `see CONTRACT.md § Labels for which bucket applies.`
    ).toEqual([]);
    expect(classified).toEqual(exported);
  });
});

const SENTINEL_ATTRIBUTES = [
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "title",
  "placeholder",
  "alt",
];

const LATIN_RUN = /[A-Za-z]{3}/;

const Bomb = () => {
  throw new Error("boom");
};

const silenced = { onCaughtError: () => {} };

const errorBoundarySentinels = {
  title: "⟦title⟧",
  description: "⟦description⟧",
  retry: "⟦retry⟧",
} satisfies Required<ErrorBoundaryLabels>;

const chatMessageSentinels = {
  userMessage: "⟦userMessage⟧",
  assistantMessage: "⟦assistantMessage⟧",
  copy: "⟦copy⟧",
  copied: "⟦copied⟧",
  copiedNotice: "⟦copiedNotice⟧",
  feedbackPositive: "⟦feedbackPositive⟧",
  feedbackNegative: "⟦feedbackNegative⟧",
  feedbackNotice: "⟦feedbackNotice⟧",
  thinking: "⟦thinking⟧",
  linkOpensInNewTab: "⟦linkOpensInNewTab⟧",
} satisfies Required<ChatMessageLabels>;

const markdownComponentsSentinels = {
  linkOpensInNewTab: "⟦linkOpensInNewTab⟧",
} satisfies Required<MarkdownComponentsLabels>;

const inlineThinkingIndicatorSentinels = {
  thinking: "⟦thinking⟧",
} satisfies Required<InlineThinkingIndicatorLabels>;

const thinkingIndicatorSentinels = {
  thinking: "⟦thinking⟧",
  thinkingRegion: "⟦thinkingRegion⟧",
} satisfies Required<ThinkingIndicatorLabels>;

const chatComposerSentinels = {
  composerInput: "⟦composerInput⟧",
  composerPlaceholder: "⟦composerPlaceholder⟧",
  send: "⟦send⟧",
} satisfies Required<ChatComposerLabels>;

// deleteConversation is the package's first function-form label in this
// harness: the sentinel is computed per title, and the strip list carries the
// one value the harness's numeric-titled item produces.
const conversationListSentinels = {
  conversations: "⟦conversations⟧",
  noConversations: "⟦noConversations⟧",
  loadingConversations: "⟦loadingConversations⟧",
  deleteConversation: (title: string) => `⟦deleteConversation:${title}⟧`,
} satisfies Required<ConversationListLabels>;

const appShellSentinels = {
  openSidebar: "⟦openSidebar⟧",
  closeSidebar: "⟦closeSidebar⟧",
  skipToMainContent: "⟦skipToMainContent⟧",
} satisfies Required<AppShellLabels>;

const appSidebarSentinels = {
  sidebar: "⟦sidebar⟧",
  mainNavigation: "⟦mainNavigation⟧",
} satisfies Required<AppSidebarLabels>;

// The fixture content carries no run of three Latin letters, so everything
// user-shaped the harness renders (content, "LM" initials) passes the
// LATIN_RUN check without its own strip entry.
const numericContent = "4711 – ok";

// Every labelsProp member needs an entry here: the harness renders it with
// every label set to a unique sentinel. Adding a labelsProp component without
// a harness fails the sentinel test by name.
const sentinelHarnesses: Record<
  string,
  { sentinels: string[]; renderContainer: () => HTMLElement }
> = {
  ErrorBoundary: {
    sentinels: Object.values(errorBoundarySentinels),
    renderContainer: () =>
      render(
        <ErrorBoundary labels={errorBoundarySentinels}>
          <Bomb />
        </ErrorBoundary>,
        silenced
      ).container,
  },
  ChatMessage: {
    sentinels: Object.values(chatMessageSentinels),
    renderContainer: () => {
      const { container, getAllByRole } = render(
        <>
          <ChatMessage
            entry={{ id: "u1", role: "user", content: numericContent }}
            userInitials="LM"
            labels={chatMessageSentinels}
          />
          <ChatMessage
            entry={{
              id: "a1",
              role: "assistant",
              content: `${numericContent} [42](https://4711.example/42)`,
              isStreaming: false,
            }}
            userInitials="LM"
            labels={chatMessageSentinels}
          />
          <ChatMessage
            entry={{ id: "a2", role: "assistant", content: "", isStreaming: true }}
            userInitials="LM"
            labels={chatMessageSentinels}
          />
        </>
      );
      // Clicking copy and thumbs-up surfaces the interaction-only labels
      // (copied, copiedNotice, feedbackNotice) so a hardcoded string on
      // those paths cannot hide from the Latin-run check.
      const [copyButton, thumbsUp] = getAllByRole("button");
      fireEvent.click(copyButton);
      fireEvent.click(thumbsUp);
      return container;
    },
  },
  InlineThinkingIndicator: {
    sentinels: Object.values(inlineThinkingIndicatorSentinels),
    renderContainer: () =>
      render(<InlineThinkingIndicator labels={inlineThinkingIndicatorSentinels} />).container,
  },
  ThinkingIndicator: {
    sentinels: Object.values(thinkingIndicatorSentinels),
    renderContainer: () =>
      render(<ThinkingIndicator labels={thinkingIndicatorSentinels} />).container,
  },
  ChatComposer: {
    sentinels: Object.values(chatComposerSentinels),
    renderContainer: () =>
      render(<ChatComposer onSubmit={() => {}} labels={chatComposerSentinels} />).container,
  },
  AppShell: {
    sentinels: Object.values(appShellSentinels),
    renderContainer: () =>
      render(
        <AppShell
          labels={appShellSentinels}
          brand={<span>4711</span>}
          renderSidebar={() => <span>4712</span>}
        >
          {numericContent}
        </AppShell>
      ).container,
  },
  AppSidebar: {
    sentinels: Object.values(appSidebarSentinels),
    renderContainer: () =>
      render(
        <AppSidebar
          labels={appSidebarSentinels}
          brand={<span>4711</span>}
          navItems={[{ key: "4712", label: "4713", isActive: true }]}
          footer={<span>4714</span>}
        >
          {numericContent}
        </AppSidebar>
      ).container,
  },
  createMarkdownComponents: {
    sentinels: Object.values(markdownComponentsSentinels),
    renderContainer: () =>
      render(
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={createMarkdownComponents({ labels: markdownComponentsSentinels })}
          urlTransform={createUrlTransform()}
        >
          {"[4711](https://4711.example/4711)"}
        </ReactMarkdown>
      ).container,
  },
  ConversationList: {
    sentinels: [
      conversationListSentinels.conversations,
      conversationListSentinels.noConversations,
      conversationListSentinels.loadingConversations,
      conversationListSentinels.deleteConversation(numericContent),
    ],
    renderContainer: () =>
      render(
        <>
          <ConversationList
            items={[{ id: "c1", title: numericContent, timestamp: "12–08", badge: "4711" }]}
            onDelete={() => {}}
            labels={conversationListSentinels}
          />
          <ConversationList items={[]} labels={conversationListSentinels} />
          <ConversationList items={[]} isLoading labels={conversationListSentinels} />
        </>
      ).container,
  },
};

const stripSentinels = (text: string, sentinels: string[]): string =>
  sentinels.reduce((rest, sentinel) => rest.split(sentinel).join(" "), text);

describe("the sentinel render check", () => {
  it("ErrorBoundary's sentinel labels cover every defaultErrorBoundaryLabels key", () => {
    expect(Object.keys(errorBoundarySentinels).sort()).toEqual(
      Object.keys(defaultErrorBoundaryLabels).sort()
    );
  });

  it("ChatMessage's sentinel labels cover every defaultChatMessageLabels key", () => {
    expect(Object.keys(chatMessageSentinels).sort()).toEqual(
      Object.keys(defaultChatMessageLabels).sort()
    );
  });

  it("InlineThinkingIndicator's sentinel labels cover every defaultInlineThinkingIndicatorLabels key", () => {
    expect(Object.keys(inlineThinkingIndicatorSentinels).sort()).toEqual(
      Object.keys(defaultInlineThinkingIndicatorLabels).sort()
    );
  });

  it("ThinkingIndicator's sentinel labels cover every defaultThinkingIndicatorLabels key", () => {
    expect(Object.keys(thinkingIndicatorSentinels).sort()).toEqual(
      Object.keys(defaultThinkingIndicatorLabels).sort()
    );
  });

  it("ChatComposer's sentinel labels cover every defaultChatComposerLabels key", () => {
    expect(Object.keys(chatComposerSentinels).sort()).toEqual(
      Object.keys(defaultChatComposerLabels).sort()
    );
  });

  it("ConversationList's sentinel labels cover every defaultConversationListLabels key", () => {
    expect(Object.keys(conversationListSentinels).sort()).toEqual(
      Object.keys(defaultConversationListLabels).sort()
    );
  });

  it("AppShell's sentinel labels cover every defaultAppShellLabels key", () => {
    expect(Object.keys(appShellSentinels).sort()).toEqual(
      Object.keys(defaultAppShellLabels).sort()
    );
  });

  it("AppSidebar's sentinel labels cover every defaultAppSidebarLabels key", () => {
    expect(Object.keys(appSidebarSentinels).sort()).toEqual(
      Object.keys(defaultAppSidebarLabels).sort()
    );
  });

  it("createMarkdownComponents' sentinel labels cover every defaultMarkdownComponentsLabels key", () => {
    expect(Object.keys(markdownComponentsSentinels).sort()).toEqual(
      Object.keys(defaultMarkdownComponentsLabels).sort()
    );
  });

  it("no run of three Latin letters survives outside the sentinels for any labelsProp member", () => {
    for (const name of labelsProp) {
      const harness = sentinelHarnesses[name];
      if (!harness) {
        throw new Error(
          `${name} is in labelsProp but has no sentinel harness - add one to sentinelHarnesses ` +
            `in tests/labelled-exports.test.tsx (CONTRACT.md § Labels).`
        );
      }

      const container = harness.renderContainer();

      const strayText = stripSentinels(container.textContent ?? "", harness.sentinels);
      expect(strayText, `${name} renders hardcoded text: "${strayText.trim()}"`).not.toMatch(
        LATIN_RUN
      );

      for (const element of container.querySelectorAll("*")) {
        for (const attribute of SENTINEL_ATTRIBUTES) {
          const value = element.getAttribute(attribute);
          if (value === null) {
            continue;
          }
          const strayAttribute = stripSentinels(value, harness.sentinels);
          expect(
            strayAttribute,
            `${name} renders a hardcoded ${attribute}: "${value}"`
          ).not.toMatch(LATIN_RUN);
        }
      }
    }
  });
});
