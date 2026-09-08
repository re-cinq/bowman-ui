# bowman-ui

Presentational React components for AI chat interfaces.

`@re-cinq/bowman-ui` provides props-driven chat UI building blocks - message rendering, composer, conversation list, app shell - with no authentication, data-fetching, routing, or i18n dependencies. Consumers supply data and labels; the components render them.

The name follows the pairing the org chose: HAL Engine is the engine that thinks, Bowman is the face that talks to you.

<img alt="A full chat application composed from bowman-ui exports: a sidebar with a new chat button and a conversation list beside a transcript where an assistant answers a caching-strategy question with a markdown list, a code block and a table, a thinking indicator, and the composer." src="docs/assets/hero-split.png" />

_One surface, every piece: sidebar, transcript, and composer, rendered through the library's own components._

## Install

```sh
npm install @re-cinq/bowman-ui
```

No version has been published yet; the install line above starts working with the first `v*` release.

## Requirements

- React and React DOM `^19.0.0` as peer dependencies. That range is what the components are tested against (React 19.2) - it is not a claim of React 18 support.
- Node.js `>=22` for development.

## Styles

Add two lines to your app's CSS entry:

```css
@import "@re-cinq/bowman-ui/styles.css";
@source "../node_modules/@re-cinq/bowman-ui/dist";
```

(Adjust the `@source` path so it points at the installed `dist` relative to your CSS file.)

Tailwind CSS v4 is required: the stylesheet ships only what Tailwind cannot generate from a class name - four animation keyframes (`bowman-fade-in`, `bowman-toast-fade-in`, `bowman-fade-dot`, `bowman-pulse-subtle`) with their utility rules, the `bowman-md-*` markdown element styling and the `bowman-sr-only` rule that hides the markdown link notice, `Toast`'s live region, `ConversationList`'s plain title and `useFocusGroups`' announcement region, and an unconditional `prefers-reduced-motion` rule. Everything else on the components - layout, color, `dark:` variants - is plain Tailwind utility class names in the built files, and your own Tailwind v4 build generates their CSS by scanning the installed `dist`. That is what the `@source` line is for: Tailwind v4 does not scan `node_modules` by default, so without it the components render unstyled. How `dark:` resolves (media query or class strategy) stays your build's decision.

`styles.css` itself is plain CSS - no Tailwind at-rules - so a non-Tailwind consumer can import it too, but must then supply the utility styles the components reference by other means.

## Minimal app

Every screen in this package is assembled the same way: the consumer owns the entries and the
busy flag, the components render them and report what the user did. This is the whole surface
for a single conversation - the sidebar, the transcript with its required AI disclosure, and
the composer:

```tsx
import { useState } from "react";
import {
  AppShell,
  AppSidebar,
  ChatComposer,
  ChatMessageList,
  ConversationList,
  type AssistantChatEntry,
  type UserChatEntry,
} from "@re-cinq/bowman-ui";

type Entry = UserChatEntry | AssistantChatEntry;

const labels = {
  aiDisclosure: "You are talking to an artificial intelligence. Answers can contain mistakes.",
};

export function ChatScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    setEntries((current) => [...current, { id: crypto.randomUUID(), role: "user", content: text }]);
    setBusy(true);
    const reply = await askYourEngine(text);

    setEntries((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "assistant", content: reply, isStreaming: false },
    ]);
    setBusy(false);
  };

  return (
    <AppShell
      brand="Your app"
      renderSidebar={({ close }) => (
        <AppSidebar brand="Your app">
          <ConversationList items={[{ id: "1", title: "Today" }]} activeId="1" onSelect={close} />
        </AppSidebar>
      )}
    >
      <div className="flex h-full min-h-0 flex-col">
        <ChatMessageList entries={entries} userInitials="AB" labels={labels} busy={busy} />
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <ChatComposer onSubmit={(text) => void send(text)} busy={busy} />
        </div>
      </div>
    </AppShell>
  );
}
```

`askYourEngine` stands for your adapter - a fetch, a socket, an SDK call. To stream instead of
waiting, append the assistant entry with `isStreaming: true` and empty content as soon as the
reply starts, hand `ChatMessageList` a new array on every delta, and flip the flag to `false`
on commit; `examples/chat-demo` does exactly that over a canned reply.

Two behaviours the components own so the adapter does not have to: `ChatComposer` submits on
Enter and inserts a newline on Shift+Enter (a press during IME composition is ignored), and the
copy button on each message writes to the clipboard itself, then shows a two-second
confirmation. `onCopy` is a notification, fired whether or not the write succeeded - an insecure
context has no clipboard - so use it for a toast, not for copying.

The list has no "new conversation" control and no `onNew` prop: that control is yours, which is
why the minimal app above has none. Put your own control above `ConversationList` inside
`AppSidebar`'s children, and call the `close` that `renderSidebar` receives so the mobile drawer
shuts, the same way `onSelect={close}` already does; add `PlusIcon` to the import list:

```tsx
renderSidebar={({ close }) => (
  <AppSidebar brand="Your app">
    <button
      type="button"
      onClick={() => {
        startConversation();
        close();
      }}
    >
      <PlusIcon className="h-4 w-4" />
      New chat
    </button>
    <ConversationList items={[{ id: "1", title: "Today" }]} activeId="1" onSelect={close} />
  </AppSidebar>
)}
```

`startConversation` is yours as well. `PlusIcon` comes from the package and is decorative beside
the visible text; styling the control is the consumer's job, as
`examples/chat-demo/src/docs/HeroPreview.tsx` shows.

## Worked consumer

`examples/chat-demo` is the worked consumer: a standalone Vite app that installs this package from a freshly packed tarball (never the source tree, never the registry) and composes `AppShell`, `AppSidebar`, `ConversationList`, `ChatMessageList`, `ChatComposer` and `Toast` into a full chat screen, verified by a real-Chromium Playwright suite. One command builds the package, packs it, installs the tarball into a temp copy outside the repo tree and runs the whole proof:

```sh
npm run consumer
```

Pass `-- --keep` to retain the temp directory and tarball for debugging.

## App Router consumer

`examples/rsc-fixture` is the App Router consumer: a standalone Next.js 16 app (Turbopack, default config) that installs this package from a freshly packed tarball and compiles it with `next build`, importing icons from a server component and rendering `ChatMessage` - a `"use client"` component - as its child. The check asserts that a plain HTTP response from `next start` already carries the rendered `<svg>`, before any hydration. One command runs the whole proof:

```sh
npm run rsc
```

Pass `-- --keep` to retain the temp directory and tarball, and `-- --expect-failure` to prove the guard goes red when a `dist/` file loses its directive.

A React server component cannot pass a function across the client boundary - `AppShell` (`renderSidebar`, `onMobileSidebarOpenChange`), `AppSidebar` (`renderNavLink`, `onNavigate`, a `SidebarNavItem`'s `icon`), `Button` and `IconButton` (`onClick`, and the `icon` component), `ChatComposer` (`onSubmit`), `ChatMessage` and `ChatMessageList` (`onCopy`, `onFeedback`, the `assistantMessageFrom` label), `ConversationList` (`renderLink`, `onSelect`, `onDelete`, the `deleteConversation` label), `ErrorBoundary` (`onError`), `PromptChips` (`onPick`), `SearchField` (`onChange`) and `Toast` (`onClose`) accept function-valued props, so an App Router consumer supplies those props from a `"use client"` file (measured on Next 16.3.3; the verbatim build error is recorded in docs/design-notes.md § RSC fixture). An object literal crosses fine - `ChatMessageList`'s `attribution` map, element-valued avatars included - which is why per-entry attribution is a lookup table and not a render prop.
`ConversationList` has no `onNew`; the new-conversation control is the consumer's, as shown under
[Minimal app](#minimal-app).

## Rendering entries

`ChatMessage` accepts only user and assistant entries - passing a `ThinkingChatEntry` or `ToolChatEntry` is a compile error, never a silent null render. A `ChatEntry[]` therefore needs a type guard before mapping:

```tsx
import {
  ChatMessage,
  type AssistantChatEntry,
  type ChatEntry,
  type UserChatEntry,
} from "@re-cinq/bowman-ui";

const isRenderable = (entry: ChatEntry): entry is UserChatEntry | AssistantChatEntry =>
  entry.role === "user" || entry.role === "assistant";

entries
  .filter(isRenderable)
  .map((entry) => <ChatMessage key={entry.id} entry={entry} userInitials="AB" />);
```

The components own no scroll position: keeping the transcript pinned to the newest message while a reply streams is the consumer's job.

## Links in model output

The library treats assistant content as untrusted: the model that writes it has tool results from a third-party system in its context, so which URLs become clickable is the library's decision, not the model's. `ChatMessage` therefore renders markdown through its own URL policy instead of react-markdown's default filter. The default:

| Field               | Default                      | Effect                                                                                                                       |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `allowedSchemes`    | `["https", "mailto", "tel"]` | Any other scheme (`http`, `javascript:`, `data:`, ...) renders as plain text, never an anchor                                |
| `allowRelativeUrls` | `false`                      | `[text](/api/logout)` renders as text; protocol-relative `//host` and authority-less `https:/api/logout` are always rejected |
| `linkTarget`        | `"_blank"`                   | Anchors open in a new tab, with a visually-hidden `linkOpensInNewTab` notice for screen readers                              |
| `allowImages`       | `false`                      | `![alt](url)` renders the alt text; no image request leaves the reader's browser                                             |

A rejected URL renders its link text in a `<span>` - never an empty anchor, which would reload the page when clicked. Every rendered anchor carries `rel="noopener noreferrer"`, even with `linkTarget: "_self"`, so the chat URL never leaks in a `Referer` header. remark-gfm autolink literals (a bare `https://...` or `support@...` in prose) pass through the same policy; note that a bare `www.example.com` autolinks as `http://`, so it stays text unless `http` is allowed.

Override fields per `ChatMessage` through the `markdown` prop, merged over `defaultMarkdownPolicy`:

```tsx
<ChatMessage entry={entry} userInitials="AB" markdown={{ allowedSchemes: ["https", "http"] }} />
```

Setting `allowImages: true` renders `<img>` for scheme-allowed sources - and costs a network request at render time (React preloads image sources), so opt in only when the image host is trusted. Rendering markdown outside `ChatMessage` uses the same pair the component uses internally:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createMarkdownComponents, createUrlTransform } from "@re-cinq/bowman-ui";

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={createMarkdownComponents({ policy })}
  urlTransform={createUrlTransform(policy)}
>
  {content}
</ReactMarkdown>;
```

## How it fits together

Every piece on screen is one export:

![Annotated screenshot labeling AppShell's renderSidebar slot, ConversationList, ChatMessage with createMarkdownComponents, InlineThinkingIndicator, and ChatComposer on a rendered chat surface.](docs/assets/anatomy.png)

Data flows one way in and one way out - the package never talks to a backend, it only renders what it is handed and reports what the user did:

```text
an engine that thinks  --(protocol events)-->  your adapter  --(ChatEntry[])-->  bowman-ui, the face that talks
an engine that thinks  <--(messages)--------  your adapter  <--(onSubmit, onCopy, onFeedback, onDelete)--  bowman-ui
```

On a phone the sidebar becomes a focus-trapped drawer behind the hamburger. It opens on request - every time, without argument:

<img src="docs/assets/mobile-drawer.png" alt="The mobile drawer open over the chat surface: conversation list and new-chat button over a dimmed backdrop." width="300" />

## Labels and translations

Each labelled component takes `labels?: Partial<XLabels>`, shallow-merged per key over complete English defaults (`defaultChatComposerLabels`, `defaultConversationListLabels`, ...); three deliberate exceptions carry their strings as plain props instead (`Toast`'s `message`, the icons' `ariaLabel`, `useFocusGroups`' `announce` - [the design notes](./docs/design-notes.md) § Labels). A label that interpolates a value is a function - `deleteConversation: (title: string) => string` - never a template string with placeholders, so word order and plural rules stay with whoever writes the string.

Translating the package to another language therefore means supplying your reviewed catalogue through those props. bowman-ui ships no locale files and no i18n runtime on purpose (see [the design notes](./docs/design-notes.md) § Labels): the consumer app is the only place the copy can be reviewed. A full catalogue is a typed object handed over as slices - the label types are exported, so a missing key is a compile error. The Spanish wording below is illustrative, not a reviewed translation (the demo app itself ships English-only; a real catalogue belongs to the consumer app that can review it):

```tsx
import {
  ChatComposer,
  ConversationList,
  type ChatComposerLabels,
  type ConversationListLabels,
} from "@re-cinq/bowman-ui";

const catalogue: { composer: ChatComposerLabels; conversationList: ConversationListLabels } = {
  composer: {
    composerInput: "Tu mensaje",
    composerPlaceholder: "Responder...",
    send: "Enviar mensaje",
  },
  conversationList: {
    conversations: "Conversaciones",
    noConversations: "Aún no hay conversaciones",
    loadingConversations: "Cargando conversaciones",
    deleteConversation: (title) => `Eliminar la conversación: ${title}`,
  },
};

<ChatComposer onSubmit={handleSubmit} labels={catalogue.composer} />;
<ConversationList items={items} labels={catalogue.conversationList} />;
```

An i18n library plugs into the same seam - with next-intl's `useTranslations` (or any lookup of your own):

```tsx
const t = useTranslations("chat");

<ChatComposer
  onSubmit={handleSubmit}
  labels={{ send: t("send"), composerPlaceholder: t("placeholder") }}
/>;
```

A lookup that produces `undefined` is safe: the merge helper treats an explicit `undefined` override the same as a missing key, so the English default fills in rather than `undefined` reaching the DOM.

## Icons

23 SVG icon components (`SearchIcon`, `ChatIcon`, `LoadingIcon`, ...) are exported from the package root, each typed with the public `IconProps` (`{className?, ariaLabel?, strokeWidth?}`). Omit `ariaLabel` for a decorative icon (`aria-hidden="true"`); pass it for a meaningful one (`role="img"` plus `aria-label`). `strokeWidth` defaults to `2` (`DatabaseIcon` to `1.5`). `LoadingIcon` spins via Tailwind's core `animate-spin` utility - your Tailwind build generates it when scanning the installed `dist` (see [Styles](#styles)); it needs nothing from `styles.css`. Its default `ariaLabel` of `"Loading"` is the icon set's only user-visible string, overridable per call site.

There is no brand mark in the set. A consumer who wants one supplies it through the `assistantAvatar` slot described in [the design notes](./docs/design-notes.md) (decision 3) - the library does not ship a fallback logo.

## Hooks

Five hooks ship beside the components, each pure (no console, no network, no storage except `useSidebarState`):

```tsx
useFocusGroups(); // F6 / Shift+F6 cycles focus through [data-focus-group] sections, by data-focus-group-order then DOM order
<header data-focus-group="header" data-focus-group-order="0">...</header>
<main data-focus-group="main" data-focus-group-order="1">...</main>

const triggerRef = useRef<HTMLButtonElement>(null);
const containerRef = useFocusTrap(isOpen, onClose, triggerRef); // modal surfaces only: Tab is trapped, Escape closes and refocuses the trigger
<div ref={containerRef}>...</div>

const prefersReducedMotion = useReducedMotion(); // pass a boolean to override the OS preference
const animationDuration = prefersReducedMotion ? 0 : 300;

const debouncedQuery = useDebounce(query, 300);

const { isOpen, toggle, open, close, isHydrated } = useSidebarState("chat", { storagePrefix: "olt-" }); // stored under `${storagePrefix}${key}`
```

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Two TypeScript installs exist on purpose: `typescript` (~6.x) feeds the lint stack, because `typescript-eslint` caps its peer range below TypeScript 7, while the `typescript7` alias (`npm:typescript@~7.0.2`) is the actual compiler that `build` and `typecheck` invoke. Do not "clean up" the alias, and do not enable type-aware linting (`recommendedTypeChecked`) without revisiting this split — the linter would type-check with a different compiler major than the build.

## Security

The library renders model-authored markdown into a customer-facing chat, so the reports that matter are XSS, sanitizer bypass, and markdown-pipeline dependency advisories - measured against the scheme allowlist and `rel="noopener noreferrer"` policy described in [Links in model output](#links-in-model-output). Do not open a public issue for a vulnerability. Report it privately to **security@re-cinq.com**; we acknowledge within 48 hours. Full intake, scope, and supported-versions detail is in [SECURITY.md](./SECURITY.md).

## Credits

The SVG icon artwork in this package is adapted from two open-source icon sets,
not drawn from scratch:

- [Lucide](https://lucide.dev) - ISC (with a Feather-derived subset under MIT)
- [Heroicons](https://heroicons.com) - MIT, (c) Tailwind Labs, Inc.

The glyphs are modified derivatives, and there is no runtime or import dependency
on either project - only the path data was adapted. The upstream copyright and
license notices are reproduced in [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md),
which ships in the published package.

## License

Apache-2.0
