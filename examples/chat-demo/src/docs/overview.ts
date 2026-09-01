// The non-component half of the public API: the five hooks, the markdown
// policy trio, resolveLabels and the entry types. One paragraph and one
// snippet each - these are signatures rather than rendered surfaces, so they
// carry no props table and no live render.

export interface ApiNote {
  id: string;
  name: string;
  summary: string;
  snippet: string;
}

export const hookNotes: ReadonlyArray<ApiNote> = [
  {
    id: "use-debounce",
    name: "useDebounce",
    summary:
      "Defers a value until it has stopped changing for a delay. Reach for it on a search field or any input whose every keystroke would otherwise start work.",
    snippet: `const debouncedQuery = useDebounce(query, 300);`,
  },
  {
    id: "use-focus-trap",
    name: "useFocusTrap",
    summary:
      "Traps focus inside a container while it is open, closes it on Escape and returns focus to the trigger. Modal only: while open, a Tab pressed anywhere outside pulls focus back in, so it is wrong for a popover or a toolbar. AppShell uses it for the mobile drawer.",
    snippet: `const triggerRef = useRef<HTMLButtonElement>(null);
const drawerRef = useFocusTrap(isOpen, close, triggerRef);
return <div ref={drawerRef}>...</div>;`,
  },
  {
    id: "use-focus-groups",
    name: "useFocusGroups",
    summary:
      "F6 and Shift+F6 navigation between the major regions of a screen, the pattern browser dev tools use. Mark each region with data-focus-group and call the hook once; announce lets you translate the move announcement or suppress it.",
    snippet: `useFocusGroups({ announce: (group) => \`Gik til \${group}\` });
// <main data-focus-group="samtale" data-focus-group-order="1">`,
  },
  {
    id: "use-reduced-motion",
    name: "useReducedMotion",
    summary:
      "Reads prefers-reduced-motion, with an override argument so a caller can force the answer. Every component that animates takes a reducedMotion prop and passes it through here, which is why undefined means follow the operating system rather than animate.",
    snippet: `const motionOff = useReducedMotion(props.reducedMotion);`,
  },
  {
    id: "use-sidebar-state",
    name: "useSidebarState",
    summary:
      "Remembers a sidebar's collapsed state in localStorage across visits, degrading to in-memory state when storage throws. storagePrefix is required so two apps on one origin never collide, and isHydrated tells you whether the stored value has been read yet.",
    snippet: `const { isOpen, toggle, open, close, isHydrated } = useSidebarState("chat", {
  storagePrefix: "havkat-",
});`,
  },
];

export const markdownNotes: ReadonlyArray<ApiNote> = [
  {
    id: "default-markdown-policy",
    name: "defaultMarkdownPolicy",
    summary:
      "The frozen default an assistant message is rendered under: https, mailto and tel links only, no relative URLs, links open in a new tab, images off. A consumer overrides it field by field through the markdown prop rather than replacing the whole object.",
    snippet: `{ allowedSchemes: ["https", "mailto", "tel"], allowRelativeUrls: false,
  linkTarget: "_blank", allowImages: false }`,
  },
  {
    id: "create-url-transform",
    name: "createUrlTransform",
    summary:
      "Builds the url transform ReactMarkdown applies to every href and src. It compares schemes without decoding, so a percent-encoded tab cannot smuggle javascript: past the allowlist, and a rejected URL leaves the link as plain text rather than becoming a live one.",
    snippet: `const urlTransform = createUrlTransform({ allowedSchemes: ["https"] });`,
  },
  {
    id: "create-markdown-components",
    name: "createMarkdownComponents",
    summary:
      'Builds the element map ReactMarkdown renders with: the typography, and the link element that adds rel, target and the visually hidden "opens in a new tab" note. Use it with createUrlTransform when you render assistant markdown outside ChatMessage.',
    snippet: `const components = createMarkdownComponents({
  policy,
  labels: { linkOpensInNewTab: "(åbner i en ny fane)" },
});`,
  },
];

export const labelNotes: ReadonlyArray<ApiNote> = [
  {
    id: "resolve-labels",
    name: "resolveLabels",
    summary:
      "The merge behind every labels prop: a shallow merge of a partial override over a complete set of English defaults, in which an explicit undefined counts as missing rather than blanking a default. That is what a consumer's own optional-chained catalogue lookup produces, so a plain spread would be wrong. Neither argument is mutated.",
    snippet: `const resolved = resolveLabels(defaultChatMessageLabels, props.labels);`,
  },
];

export const typeNotes: ReadonlyArray<ApiNote> = [
  {
    id: "chat-entry",
    name: "ChatEntry",
    summary:
      "The view model every chat component renders, discriminated on role across four members: UserChatEntry and ToolChatEntry arrive fully formed, while AssistantChatEntry and ThinkingChatEntry stream through an upsert, delta and commit lifecycle and carry isStreaming. Entries hold an opaque id the consuming adapter assigns; the package says nothing about transport.",
    snippet: `type ChatEntry =
  | UserChatEntry      // { id, role: "user", content }
  | AssistantChatEntry // { id, role: "assistant", content, isStreaming, toolStatus?, persona? }
  | ThinkingChatEntry  // { id, role: "thinking", content, isStreaming }
  | ToolChatEntry;     // { id, role: "tool", toolName, toolInput }`,
  },
  {
    id: "chat-stream-state",
    name: "ChatStreamState and ChatErrorInfo",
    summary:
      "The coarse conversation state a surface renders, and the error detail that goes with it. code stays an open string so a new protocol code renders without a type change here.",
    snippet: `type ChatStreamState = "idle" | "streaming" | "error";
interface ChatErrorInfo { message: string; code?: string }`,
  },
];
