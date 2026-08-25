# bowman-ui

Presentational React components for AI chat interfaces.

`@re-cinq/bowman-ui` provides props-driven chat UI building blocks - message rendering, composer, conversation list, app shell - with no authentication, data-fetching, routing, or i18n dependencies. Consumers supply data and labels; the components render them.

The name follows the pairing the org chose: HAL Engine is the engine that thinks, Bowman is the face that talks to you.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/hero-dark.png" />
  <img alt="A chat surface composed from bowman-ui exports: sidebar with a conversation list, an assistant reply rendering a markdown list, code block and table, a thinking indicator, and the composer." src="docs/assets/hero-light.png" />
</picture>

_The picture follows your color scheme; the components follow your data._

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

Tailwind CSS v4 is required: the stylesheet ships only what Tailwind cannot generate from a class name - four animation keyframes (`bowman-fade-in`, `bowman-toast-fade-in`, `bowman-fade-dot`, `bowman-pulse-subtle`) with their utility rules, the `bowman-md-*` markdown element styling used by `markdownComponents`, and an unconditional `prefers-reduced-motion` rule. Everything else on the components - layout, color, `dark:` variants - is plain Tailwind utility class names in the built files, and your own Tailwind v4 build generates their CSS by scanning the installed `dist`. That is what the `@source` line is for: Tailwind v4 does not scan `node_modules` by default, so without it the components render unstyled. How `dark:` resolves (media query or class strategy) stays your build's decision.

`styles.css` itself is plain CSS - no Tailwind at-rules - so a non-Tailwind consumer can import it too, but must then supply the utility styles the components reference by other means.

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

## How it fits together

Every piece on screen is one export:

![Annotated screenshot labeling AppShell's renderSidebar slot, ConversationList, ChatMessage with markdownComponents, InlineThinkingIndicator, and ChatComposer on a rendered chat surface.](docs/assets/anatomy.png)

Data flows one way in and one way out - the package never talks to a backend, it only renders what it is handed and reports what the user did:

```mermaid
flowchart LR
  E["an engine that thinks"] -->|protocol events| A["your adapter"]
  A -->|"ChatEntry[]"| B["bowman-ui: the face that talks"]
  B -->|"onSubmit, onCopy, onFeedback, onDelete"| A
  A -->|messages| E
```

On a phone the sidebar becomes a focus-trapped drawer behind the hamburger. It opens on request - every time, without argument:

<img src="docs/assets/mobile-drawer.png" alt="The mobile drawer open over the chat surface: conversation list and new-chat button over a dimmed backdrop." width="300" />

## Labels and translations

Each labelled component takes `labels?: Partial<XLabels>`, shallow-merged per key over complete English defaults (`defaultChatComposerLabels`, `defaultConversationListLabels`, ...); three deliberate exceptions carry their strings as plain props instead (`Toast`'s `message`, the icons' `ariaLabel`, `useFocusGroups`' `announce` - [CONTRACT.md](./CONTRACT.md) § Labels). A label that interpolates a value is a function - `deleteConversation: (title: string) => string` - never a template string with placeholders, so word order and plural rules stay with whoever writes the string.

Translating the package to another language therefore means supplying your reviewed catalogue through those props. bowman-ui ships no locale files and no i18n runtime on purpose (see [CONTRACT.md](./CONTRACT.md) § Labels): the consumer app is the only place the copy can be reviewed. A full catalogue is a typed object handed over as slices - the label types are exported, so a missing key is a compile error, and the wording below is illustrative, not reviewed Danish:

```tsx
import {
  ChatComposer,
  ConversationList,
  type ChatComposerLabels,
  type ConversationListLabels,
} from "@re-cinq/bowman-ui";

const catalogue: { composer: ChatComposerLabels; conversationList: ConversationListLabels } = {
  composer: {
    composerInput: "Din besked",
    composerPlaceholder: "Svar...",
    send: "Send besked",
  },
  conversationList: {
    conversations: "Samtaler",
    noConversations: "Ingen samtaler endnu",
    loadingConversations: "Indlæser samtaler",
    deleteConversation: (title) => `Slet samtale: ${title}`,
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

There is no brand mark in the set. A consumer who wants one supplies it through the `assistantAvatar` slot described in [CONTRACT.md](./CONTRACT.md) (decision 3) - the library does not ship a fallback logo.

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Two TypeScript installs exist on purpose: `typescript` (~6.x) feeds the lint stack, because `typescript-eslint` caps its peer range below TypeScript 7, while the `typescript7` alias (`npm:typescript@~7.0.2`) is the actual compiler that `build` and `typecheck` invoke. Do not "clean up" the alias, and do not enable type-aware linting (`recommendedTypeChecked`) without revisiting this split — the linter would type-check with a different compiler major than the build.

## License

Apache-2.0
