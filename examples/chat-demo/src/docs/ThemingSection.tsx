// The Overview page's Theming section: the same three components rendered
// twice, once with the library's defaults and once inside the wrapper class
// that overrides the thirty-three --bowman-* tokens (src/custom-theme.css). One
// preview component renders both, so the two columns cannot drift apart.

import { ChatComposer, ChatMessage, ConversationList } from "@re-cinq/bowman-ui";
import { customTheme, defaultTheme, type DemoTheme } from "../themes";
import { CodeBlock, DocSection, Stage } from "./DocsUi";
import { docsConversationItems, docsStreamingEntry, docsUserInitials } from "./fixtures";

const previewItems = docsConversationItems.slice(0, 2);

const customThemeSnippet = `.custom-theme {
  --bowman-accent: #b7410e;
  --bowman-accent-hover: #9a3412;
  --bowman-accent-soft: #fff1e6;
  --bowman-active: #fdebdc;
  --bowman-surface: #fffaf5;
  --bowman-border: #eadbcd;
}`;

const ignoreSubmit = () => {};

function ThemingPreview({ id, theme, note }: { id: string; theme: DemoTheme; note: string }) {
  return (
    <div data-theming-preview={id} className={theme.className}>
      <Stage>
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{note}</p>
          <ChatMessage
            entry={docsStreamingEntry}
            userInitials={docsUserInitials}
            assistantAvatar={theme.assistantAvatar}
          />
          <ChatComposer onSubmit={ignoreSubmit} />
          <ConversationList items={previewItems} activeId={previewItems[0].id} />
        </div>
      </Stage>
    </div>
  );
}

export function ThemingSection() {
  return (
    <DocSection title="Theming">
      <div className="grid gap-4 md:grid-cols-2">
        <ThemingPreview
          id="default"
          theme={defaultTheme}
          note="The defaults: every token falls back to the palette colour the library shipped with."
        />
        <ThemingPreview
          id="client"
          theme={customTheme}
          note="Inside a wrapper that sets the tokens: the same components, the client's colours."
        />
      </div>
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
        The library reads thirty-three <code>--bowman-*</code> custom properties through{" "}
        <code>var()</code> fallbacks and declares none of them, so a consumer sets any subset in its
        own CSS - at <code>:root</code>, or scoped to a wrapper as the right-hand preview is - and
        inheritance does the rest. The fallbacks name the exact palette variables the components
        used before, so setting nothing changes nothing. The dark-mode values are separate{" "}
        <code>-dark</code> tokens, read by the components&apos; existing <code>dark:</code>{" "}
        variants.
      </p>
      <CodeBlock code={customThemeSnippet} />
    </DocSection>
  );
}
