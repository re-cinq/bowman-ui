// The props tables, and the one mechanism that keeps them honest.
//
// Each table is written as an object literal closed with
// `satisfies Record<keyof XProps, PropDoc>`. TypeScript then enforces both
// directions at compile time: a prop added to the library with no row here is
// a missing-key error, and a row for a prop that no longer exists is an
// excess-property error. Neither can be argued with, and neither needs a
// reviewer to notice.
//
// The check runs wherever this file is compiled - `npm run typecheck` in
// examples/chat-demo, which scripts/consumer-app.sh runs against the packed
// tarball in CI. The types come from the installed package, not from a copy.
//
// Types are written as prose because a table cell is prose; they are the
// declared types, spelled the way the source spells them.

import type {
  AppShellProps,
  AppSidebarProps,
  ChatComposerProps,
  ChatMessageListProps,
  ChatMessageProps,
  ConversationListProps,
  ErrorBoundaryProps,
  IconProps,
  InlineThinkingIndicatorProps,
  ThinkingIndicatorProps,
  ThinkingTraceProps,
  ToastProps,
  ToolActivityProps,
} from "@re-cinq/bowman-ui";

export interface PropDoc {
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export const chatMessagePropDocs = {
  entry: {
    type: "UserChatEntry | AssistantChatEntry",
    required: true,
    description: "The turn to render. A thinking or tool entry is a compile error, never a blank.",
  },
  userInitials: {
    type: "string",
    required: true,
    description: "Fills the user avatar circle.",
  },
  assistantAvatar: {
    type: "ReactNode",
    required: false,
    description: "Fills the assistant avatar circle; it renders empty without one.",
  },
  assistantName: {
    type: "string",
    required: false,
    description: "Who answered. Also becomes the article's accessible name.",
  },
  showFeedback: {
    type: "boolean",
    required: false,
    default: "true",
    description: "Shows the thumb buttons and gates the feedback keyboard path.",
  },
  arrowKeyFeedback: {
    type: "boolean",
    required: false,
    default: "false",
    description:
      "Opt-in ArrowUp/ArrowDown feedback shortcuts; they preventDefault the scroll keys.",
  },
  footer: {
    type: "ReactNode",
    required: false,
    description: "Rendered last in the message column, streaming or not.",
  },
  markdown: {
    type: "MarkdownPolicy",
    required: false,
    default: "defaultMarkdownPolicy",
    description: "Overrides the link and image policy field by field.",
  },
  labels: {
    type: "Partial<ChatMessageLabels>",
    required: false,
    default: "defaultChatMessageLabels",
    description: "Overrides the component's strings; English defaults apply per key.",
  },
  onCopy: {
    type: "(text: string, entryId: string) => void",
    required: false,
    description: "Fires after the copy attempt, whether or not the clipboard accepted it.",
  },
  onFeedback: {
    type: '(entryId: string, type: "up" | "down") => void',
    required: false,
    description: "Fires on a thumb press or a feedback shortcut.",
  },
} satisfies Record<keyof ChatMessageProps, PropDoc>;

export const chatMessageListPropDocs = {
  entries: {
    type: "ReadonlyArray<ChatEntry>",
    required: true,
    description: "The conversation in order, all four roles. A delta must arrive as a new array.",
  },
  userInitials: { type: "string", required: true, description: "Fills every user avatar circle." },
  labels: {
    type: "Partial<ChatMessageListLabels> & { aiDisclosure: string }",
    required: true,
    description: "Required, unlike every sibling: aiDisclosure has no default.",
  },
  attribution: {
    type: "Readonly<Record<string, ChatAttribution>>",
    required: false,
    description: "Persona id to name and avatar. A lookup table, so RSC can pass it.",
  },
  assistantAvatar: {
    type: "ReactNode",
    required: false,
    description: "Fills the avatar circle of every message and the busy indicator.",
  },
  busy: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Renders one ThinkingIndicator after the last entry.",
  },
  greeting: {
    type: "ReactNode",
    required: false,
    description: "Empty state only, centred in place of the transcript.",
  },
  prompts: {
    type: "ReactNode",
    required: false,
    description: "Empty state only, rendered under the greeting.",
  },
  renderEntryFooter: {
    type: "(entry: UserChatEntry | AssistantChatEntry) => ReactNode",
    required: false,
    description: "Runs for every rendered message, user rows included.",
  },
  showFeedback: {
    type: "boolean",
    required: false,
    default: "true",
    description: "Forwarded to every ChatMessage.",
  },
  arrowKeyFeedback: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Forwarded to every ChatMessage.",
  },
  markdown: {
    type: "MarkdownPolicy",
    required: false,
    default: "defaultMarkdownPolicy",
    description: "Forwarded to every assistant message.",
  },
  reducedMotion: {
    type: "boolean",
    required: false,
    description: "Forces instant scrolling; undefined tracks the OS preference.",
  },
  describeTool: {
    type: "(entry: ToolChatEntry, pending: boolean) => ReactNode",
    required: false,
    description:
      "Replaces a tool entry's default sentence, with the pending flag this list derives.",
  },
  showToolName: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Reveals each tool entry's machine name.",
  },
  showToolInput: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Reveals each tool entry's arguments as JSON behind a disclosure.",
  },
  toolIcon: {
    type: "ReactNode",
    required: false,
    description: "Fills the icon slot of every ToolActivity.",
  },
  showThinking: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Mounts a ThinkingTrace per thinking entry. Off gates the mount, not the display.",
  },
  onCopy: {
    type: "(text: string, entryId: string) => void",
    required: false,
    description: "Forwarded to every message.",
  },
  onFeedback: {
    type: '(entryId: string, type: "up" | "down") => void',
    required: false,
    description: "Forwarded to every message.",
  },
} satisfies Record<keyof ChatMessageListProps, PropDoc>;

export const toolActivityPropDocs = {
  entry: { type: "ToolChatEntry", required: true, description: "The tool call to describe." },
  describeTool: {
    type: "(entry: ToolChatEntry, pending: boolean) => ReactNode",
    required: false,
    description: "Replaces the default sentence; still reveals no name or input on its own.",
  },
  pending: {
    type: "boolean",
    required: false,
    default: "false",
    description: "The call is still in flight; ChatMessageList derives it from busy.",
  },
  showToolName: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Reveals entry.toolName, an English machine identifier.",
  },
  showToolInput: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Reveals entry.toolInput as JSON in a pre, never as markdown or HTML.",
  },
  icon: { type: "ReactNode", required: false, description: "Rendered in an aria-hidden circle." },
  labels: {
    type: "Partial<ToolActivityLabels>",
    required: false,
    default: "defaultToolActivityLabels",
    description: "Overrides the component's strings; English defaults apply per key.",
  },
} satisfies Record<keyof ToolActivityProps, PropDoc>;

export const thinkingTracePropDocs = {
  entry: { type: "ThinkingChatEntry", required: true, description: "The reasoning to render." },
  reducedMotion: {
    type: "boolean",
    required: false,
    description: "Forces the streaming dots still; undefined tracks the OS preference.",
  },
  labels: {
    type: "Partial<ThinkingTraceLabels>",
    required: false,
    default: "defaultThinkingTraceLabels",
    description: "Overrides the summary's string.",
  },
} satisfies Record<keyof ThinkingTraceProps, PropDoc>;

export const chatComposerPropDocs = {
  onSubmit: {
    type: "(text: string) => void",
    required: true,
    description: "Receives the trimmed draft; the composer clears itself after calling it.",
  },
  busy: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Disables the composer and pulses it - the agent is thinking.",
  },
  disabled: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Disables the composer without the pulse.",
  },
  autoFocus: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Focuses the textarea on mount.",
  },
  maxHeightPx: {
    type: "number",
    required: false,
    default: "200",
    description: "Auto-resize cap in pixels; the draft scrolls past it.",
  },
  attachSlot: {
    type: "ReactNode",
    required: false,
    description: "Rendered left of send. No attach button ships without one.",
  },
  labels: {
    type: "Partial<ChatComposerLabels>",
    required: false,
    default: "defaultChatComposerLabels",
    description: "Overrides the composer's strings; English defaults apply per key.",
  },
} satisfies Record<keyof ChatComposerProps, PropDoc>;

export const thinkingIndicatorPropDocs = {
  assistantAvatar: {
    type: "ReactNode",
    required: false,
    description: "Fills the pulsing circle; it stays empty without one.",
  },
  labels: {
    type: "Partial<ThinkingIndicatorLabels>",
    required: false,
    default: "defaultThinkingIndicatorLabels",
    description: "Overrides the indicator's strings.",
  },
} satisfies Record<keyof ThinkingIndicatorProps, PropDoc>;

export const inlineThinkingIndicatorPropDocs = {
  labels: {
    type: "Partial<InlineThinkingIndicatorLabels>",
    required: false,
    default: "defaultInlineThinkingIndicatorLabels",
    description: "Overrides the indicator's one string.",
  },
} satisfies Record<keyof InlineThinkingIndicatorProps, PropDoc>;

export const toastPropDocs = {
  message: { type: "string", required: true, description: "The text shown and announced." },
  onClose: {
    type: "() => void",
    required: true,
    description: "Called when the countdown ends; the consumer unmounts the Toast.",
  },
  duration: {
    type: "number | null",
    required: false,
    default: "2000",
    description: "Milliseconds until auto-dismiss. null disables it entirely.",
  },
} satisfies Record<keyof ToastProps, PropDoc>;

export const errorBoundaryPropDocs = {
  children: { type: "ReactNode", required: true, description: "The subtree being guarded." },
  fallback: {
    type: "ReactNode",
    required: false,
    description:
      'Replaces the built-in fallback entirely, role="alert" included. Wins over labels.',
  },
  labels: {
    type: "Partial<ErrorBoundaryLabels>",
    required: false,
    default: "defaultErrorBoundaryLabels",
    description: "Overrides the built-in fallback's strings.",
  },
  onError: {
    type: "(error: Error, errorInfo: ErrorInfo) => void",
    required: false,
    description: "The only reporting channel; the boundary never writes to the console.",
  },
} satisfies Record<keyof ErrorBoundaryProps, PropDoc>;

export const conversationListPropDocs = {
  items: {
    type: "ReadonlyArray<ConversationListItem>",
    required: true,
    description: "The rows to render. Empty renders the no-conversations line.",
  },
  activeId: {
    type: "string",
    required: false,
    description: 'Marks one row current, with aria-current="page".',
  },
  onSelect: { type: "(id: string) => void", required: false, description: "Fires on a row press." },
  onDelete: {
    type: "(id: string) => void",
    required: false,
    description: "Fires immediately - confirmation is the consumer's decision. Omitted: no button.",
  },
  renderLink: {
    type: "(item, props: ConversationLinkProps) => ReactNode",
    required: false,
    default: "a plain button",
    description: "The routing seam; the returned element must spread every prop it is handed.",
  },
  isLoading: {
    type: "boolean",
    required: false,
    default: "false",
    description: "Replaces the list with a labelled spinner.",
  },
  reducedMotion: {
    type: "boolean",
    required: false,
    description: "Switches the placeholder-title typewriter off; undefined tracks the OS setting.",
  },
  labels: {
    type: "Partial<ConversationListLabels>",
    required: false,
    default: "defaultConversationListLabels",
    description: "Overrides the list's strings; English defaults apply per key.",
  },
} satisfies Record<keyof ConversationListProps, PropDoc>;

export const appSidebarPropDocs = {
  brand: {
    type: "ReactNode",
    required: false,
    description: "Rendered in the bordered top row; omitted, no row renders at all.",
  },
  navItems: {
    type: "ReadonlyArray<SidebarNavItem>",
    required: false,
    description: "The nav landmark's rows. An empty array renders no landmark.",
  },
  onNavigate: {
    type: "(key: string) => void",
    required: false,
    description: "Fires with the pressed item's key.",
  },
  renderNavLink: {
    type: "(item, props: SidebarNavLinkProps) => ReactNode",
    required: false,
    default: "a plain button",
    description: "The routing seam; the returned element must spread every prop it is handed.",
  },
  children: {
    type: "ReactNode",
    required: false,
    description: "The scrollable middle - typically a ConversationList.",
  },
  footer: {
    type: "ReactNode",
    required: false,
    description: "One bottom slot; omitted, no bordered region renders.",
  },
  labels: {
    type: "Partial<AppSidebarLabels>",
    required: false,
    default: "defaultAppSidebarLabels",
    description: "Names the aside and nav landmarks.",
  },
} satisfies Record<keyof AppSidebarProps, PropDoc>;

export const appShellPropDocs = {
  children: { type: "ReactNode", required: true, description: "The main region's content." },
  renderSidebar: {
    type: "(context: SidebarSlotContext) => ReactNode",
    required: false,
    description: "Called once per position, desktop rail and mobile drawer.",
  },
  brand: {
    type: "ReactNode",
    required: false,
    description: "Rendered in the mobile header row beside the hamburger.",
  },
  mobileSidebarOpen: {
    type: "boolean",
    required: false,
    description: "Controlled open state; a controlling consumer owns closing on navigation.",
  },
  onMobileSidebarOpenChange: {
    type: "(open: boolean) => void",
    required: false,
    description: "Fires on every open and close, controlled or not.",
  },
  mainContentId: {
    type: "string",
    required: false,
    default: '"main-content"',
    description: "The main element's id and the skip link's target.",
  },
  skipLink: {
    type: "boolean",
    required: false,
    default: "true",
    description: "Renders the visually hidden skip-to-content link.",
  },
  reducedMotion: {
    type: "boolean",
    required: false,
    description: "Switches the drawer transitions off; undefined tracks the OS preference.",
  },
  labels: {
    type: "Partial<AppShellLabels>",
    required: false,
    default: "defaultAppShellLabels",
    description: "Names the hamburger, the close button, the skip link and the drawer dialog.",
  },
} satisfies Record<keyof AppShellProps, PropDoc>;

export const iconPropDocs = {
  className: {
    type: "string",
    required: false,
    description: "Sizing and colour; the glyph inherits currentColor.",
  },
  ariaLabel: {
    type: "string",
    required: false,
    description: 'With a name the icon becomes role="img"; without one it is aria-hidden.',
  },
  strokeWidth: {
    type: "number",
    required: false,
    default: "2",
    description: "Stroke width in user units. DatabaseIcon defaults to 1.5.",
  },
} satisfies Record<keyof IconProps, PropDoc>;
