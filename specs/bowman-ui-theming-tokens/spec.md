# bowman-ui theming tokens

| Field  | Value            |
| ------ | ---------------- |
| Issue  | re-cinq/Otto#210 |
| Status | In Progress      |

Brand blue was hard-wired as Tailwind palette utilities at every accent site - the send
button, the streaming avatar circle, the focus rings, the composer's focus glow, the thinking
dots, the pulse keyframe - so a consumer could not re-brand the chat surface without forking
class strings. This feature replaces each of those utilities with a `--bowman-*` custom
property read through a `var()` whose fallback is the palette value the site painted before,
so a consumer overriding nothing sees today's look byte for byte and a consumer setting a
handful of properties re-brands every site at once. The decision record lives in
docs/design-notes.md § Theming; this file pins the fifteen names, their fallbacks, every site
that reads them, and the tests.

## The tokens

Fifteen tokens, each named for a role and a shade, each with its default recorded once in a
comment line at the top of `src/styles.css`
([validated by](../../tests/theming-tokens-dist.test.ts#L106)).

The names and their fallbacks are tabled once, in docs/design-notes.md § Theming, and that
table is the contract rather than a copy: the dist test parses it and fails the moment a name,
a fallback or the order departs from the declaration block
([validated by](../../tests/theming-tokens-dist.test.ts#L179)).

- The set of tokens read across `dist/theme/tokens.js` and `dist/styles.css` is exactly the
  fifteen the comment block declares - no sixteenth name in the code, no orphan in the block
  ([validated by](../../tests/theming-tokens-dist.test.ts#L113)).

## The fallback rule

Every token ships a default, and the default lives only in the `var()` fallback:
`dist/styles.css` declares no `:root` block and still contains no `@theme`
([validated by](../../tests/styles.test.ts#L100), [L55](../../tests/styles.test.ts#L55)).

- Every `--bowman-*` occurrence outside the declaration block is a `var()` read carrying a
  non-empty fallback ([validated by](../../tests/theming-tokens-dist.test.ts#L119)).
- A token falls back to the same palette value at every site that reads it, and that value is
  the one its comment line declares
  ([validated by](../../tests/theming-tokens-dist.test.ts#L133)).
- No bare `blue-` palette utility survives in any built component, the tokens module or the
  stylesheet - the only `blue` left in `dist` sits inside a `var()` fallback
  ([validated by](../../tests/theming-tokens-dist.test.ts#L162)).

## Where the classes live

The class strings live once, in the internal module `src/theme/tokens.ts` - one `export const`
per string, each naming its token and fallback - and the components import the constants: no
built component carries a `--bowman-` literal, and no file in `dist` assigns a `--bowman-*`
value ([validated by](../../tests/theming-tokens-dist.test.ts#L183),
[L194](../../tests/theming-tokens-dist.test.ts#L194)).

- `dist/theme/tokens.js` carries no `"use client"` directive, and `dist/index.js` re-exports
  nothing from it ([validated by](../../tests/theming-tokens-dist.test.ts#L174)).
- The public runtime and type export lists equal the committed snapshot, which carries none of
  the module's names ([validated by](../../tests/public-api.test.ts#L40),
  [L46](../../tests/public-api.test.ts#L46)).

## What is tokenised

- `ChatComposer`'s send button reads `--bowman-accent` for its background and
  `--bowman-accent-hover` on hover, light and dark
  ([validated by](../../tests/ChatComposer.test.tsx#L184)).
- `ChatComposer`'s wrapper keeps `focus-within:ring-2` beside the `--bowman-focus-ring` ring
  at `/50` and the `--bowman-accent-glow` shadow, light and dark
  ([validated by](../../tests/ChatComposer.test.tsx#L196)).
- `ChatMessage`'s streaming avatar circle reads `--bowman-accent-border` and
  `--bowman-accent-soft`, light and dark
  ([validated by](../../tests/ChatMessage.test.tsx#L467)).
- `ThinkingIndicator`'s circle reads the same two tokens
  ([validated by](../../tests/ThinkingIndicator.test.tsx#L76)).
- `ThinkingDots` read `--bowman-accent` for every dot, in both modes, and keep doing so under
  `reducedMotion` in `ThinkingTrace` and `ChatMessageList`
  ([validated by](../../tests/ThinkingTrace.test.tsx#L101),
  [L1125](../../tests/ChatMessageList.test.tsx#L1125)).
- Every focus ring keeps its `focus:ring-2` width class beside the `--bowman-focus-ring`
  colour, light and dark: `ChatMessage`'s article, copy button and thumb buttons,
  `ConversationList`'s row link and delete button, every `AppSidebar` item, and `AppShell`'s
  skip link, hamburger and close button
  ([validated by](../../tests/ChatMessage.test.tsx#L475),
  [L145](../../tests/ConversationList.test.tsx#L145),
  [L132](../../tests/AppSidebar.test.tsx#L132), [L400](../../tests/AppShell.test.tsx#L400)).
- `ErrorBoundary`'s retry button keeps `focus-visible:ring-2` beside the `--bowman-focus-ring`
  colour and gains no dark ring, because it had none
  ([validated by](../../tests/ErrorBoundary.test.tsx#L156)).
- `ConversationList`'s active row alone reads `--bowman-active`, light and dark
  ([validated by](../../tests/ConversationList.test.tsx#L130)).
- `AppSidebar`'s `isActive` item alone reads `--bowman-active` while its text stays slate
  ([validated by](../../tests/AppSidebar.test.tsx#L132)).
- `bowman-pulse-subtle`'s 50 % stop reads `--bowman-accent-glow` and `--bowman-pulse-outline`
  with today's literals as fallbacks, while its zero stop stays literal
  ([validated by](../../tests/styles.test.ts#L71),
  [L150](../../tests/theming-tokens-dist.test.ts#L150)).
- `Button`'s and `IconButton`'s `primary` variant carries the `--bowman-accent` background and
  hover, and every variant of both keeps `focus:ring-2 ring-offset-2` beside the
  `--bowman-focus-ring` colour ([validated by](../../tests/Button.test.tsx#L83),
  [L110](../../tests/Button.test.tsx#L110), [L81](../../tests/IconButton.test.tsx#L81),
  [L96](../../tests/IconButton.test.tsx#L96)).
- A `PromptChips` chip and `SearchField`'s input keep `focus:ring-2 focus:outline-none` beside
  the `--bowman-focus-ring` colour ([validated by](../../tests/PromptChips.test.tsx#L125),
  [L116](../../tests/SearchField.test.tsx#L116)).

## What stays palette-mapped

- The ring width, offset and outline classes - `focus:ring-2`, `ring-offset-2`,
  `focus:ring-offset-white`, `dark:ring-offset-slate-900`, `focus:outline-none` - stay at every
  site untouched beside the colour token
  ([validated by](../../tests/ChatComposer.test.tsx#L196),
  [L110](../../tests/Button.test.tsx#L110), [L125](../../tests/PromptChips.test.tsx#L125)).
- `Button`'s `secondary` and `ghost` variants carry their slate borders, surfaces and text and
  no `--bowman-accent` background; `IconButton` with `variant` omitted is `secondary`
  ([validated by](../../tests/Button.test.tsx#L89), [L102](../../tests/Button.test.tsx#L102),
  [L74](../../tests/IconButton.test.tsx#L74)).
- The active sidebar item's label colours stay `text-slate-900` and `dark:text-white`; only its
  background is a token ([validated by](../../tests/AppSidebar.test.tsx#L132)).

## Dark mode boundary

See `specs/bowman-ui-stylesheet-entry/spec.md`: the dark-mode strategy stays the consumer's
build decision, exactly as that spec left it. Each `-dark` token rides the `dark:`
variant its site already carried, so the media-query default and a class strategy both resolve
it without the package choosing; the package adds no media query and no selector of its own.
`ErrorBoundary`'s retry button had no dark ring and gains none
([validated by](../../tests/ErrorBoundary.test.tsx#L156)).

## Recorded decisions

1. **The composer's `/50` ring keeps its opacity modifier on the token.** Tailwind emits two
   branches: under `@supports (color: color-mix(in lab, red, red))` the ring is
   `color-mix(in oklab, var(--bowman-focus-ring, var(--color-blue-500)) 50%, transparent)`,
   identical to what `ring-blue-500/50` produced; the legacy branch drops the 50 % because
   Tailwind cannot pre-mix a `var()`. That branch is unreachable on Tailwind v4's own browser
   floor - Safari 16.4, Chrome 111 and Firefox 128 all support `color-mix()` - so the
   byte-for-byte claim holds on every supported engine
   ([validated by](../../tests/ChatComposer.test.tsx#L196)).
2. **Only the active row's backgrounds are tokenised.** `--bowman-active` and
   `--bowman-active-dark` colour the surface; the label colours stay palette-mapped, so a
   consumer must keep `--bowman-active` a light surface in light mode and
   `--bowman-active-dark` a dark one, or the fixed label loses its contrast
   ([validated by](../../tests/AppSidebar.test.tsx#L132)).
3. **The keyframe's zero stop stays the literal `rgba(59, 130, 246, 0)`.** A review finding
   asked for a token there too; rejected because CSS Color 4 interpolates premultiplied, so the
   hue of a fully transparent stop is inert
   ([validated by](../../tests/theming-tokens-dist.test.ts#L150)).
4. **`--bowman-accent` falls back to blue-500 in light mode and blue-600 in dark, with the hover
   pair the other way round.** The issue described the accent as "today blue-600"; the
   components said otherwise, and the byte-for-byte rule forced the table to follow the code.
   The rejected alternative was eight tokens, one name per role with a mode-specific fallback
   on each side: a consumer could then set only one value per role without writing its own dark
   selector ([validated by](../../tests/theming-tokens-dist.test.ts#L133)).

## The demo

The consumer app (`examples/chat-demo`, specified in `specs/bowman-ui-consumer-app/spec.md`)
renders the chat fixture twice over: the Marginalia Books default at `?view=chat`, and at
`?view=chat&brand=copperline` the same fixture as a second, invented client, Copperline Bicycles
(a web search found no such brand), named as such in the sidebar
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L150)). The module
`src/brands.tsx` resolves the brand from the query, and `ChatScreen` wraps the whole fragment, `AppShell` and `Toast`
alike, in `<div class="client-brand">` and passes the brand's chainring mark (an `aria-hidden`
SVG carrying `data-brand-mark="copperline"`) as `ChatMessageList`'s `assistantAvatar`, so the
mark fills the streaming avatar circle
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L119),
[wrapper](../../examples/chat-demo/src/App.tsx#L224),
[avatar](../../examples/chat-demo/src/App.tsx#L193),
[mark](../../examples/chat-demo/src/brands.tsx#L25)). The Overview page
(`?view=docs&component=overview`) gains a Theming section that renders `ChatMessage`,
`ChatComposer` and `ConversationList` twice from one preview component,
`data-theming-preview="default"` beside `data-theming-preview="client"` (the issue's "shows both
side by side"), so the two columns cannot drift apart
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L158),
[preview](../../examples/chat-demo/src/docs/ThemingSection.tsx#L22)).

The override lives in `examples/chat-demo/src/client-brand.css`, which sets all fifteen tokens
under `.client-brand` (scoped to the wrapper, not `:root`) and is imported from `main.tsx` after
`./styles.css`, whose three documented lines are untouched; the branded screen takes its colours
from that wrapper alone
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L112),
[stylesheet](../../examples/chat-demo/src/client-brand.css#L5),
[import](../../examples/chat-demo/src/main.tsx#L5)). The wrapper scope is what lets one document
show the default and the branded look side by side, and it is the fallback rule (decision 1 in
docs/design-notes.md § Theming) doing its job: the package declares nothing, so an override on
any wrapper wins on inheritance alone, with no cascade-order fight against `dist/styles.css`
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L158)). The demo commits touched
nothing under the library's `src/` - the one statement in this section with no executable
anchor: its proof is the diff itself, reviewable but not re-runnable.

An unknown `brand` value falls back to the default: `resolveBrand` reads a `Map`, not a record,
so a prototype name such as `constructor` cannot resolve to a function, and `?brand=constructor`
renders the Marginalia Books sidebar with no brand mark
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L101)). The unbranded
`?view=chat` screen renders no wrapper and no mark, so the existing chat and docs suites drive
markup identical to what they drove before the brand dimension existed
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L88)).

### The Chromium proof

`examples/chat-demo/tests/theming.spec.ts` executed green on 2026-09-08 against the packed
tarball via `npm run consumer` (30 passed across the chat, docs and theming suites, exit 0); the
link target is the whole file
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L1)). Every colour is read through
`getComputedStyle`, and the default screen is never compared to a pinned oklch string: the suite
paints a probe element with the palette variable itself (`var(--color-blue-500)`,
`var(--color-slate-100)`, ...), guards the probe against resolving transparent, and asserts the
token site serialises identically - so a Tailwind release that changes how Chromium serialises a
palette colour cannot fail the suite, and a consumer build that stops emitting the variable into
`:root` cannot pass it vacuously
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L88)).

- On the default chat screen the enabled send button's background equals the `--color-blue-500`
  probe, the active conversation row's equals the `--color-slate-100` probe, and no
  `[data-brand-mark]` renders
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L88)).
- On the Copperline screen the send button's background is `rgb(183, 65, 14)` -
  `--bowman-accent` - and the active row's is `rgb(253, 235, 220)` - `--bowman-active`
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L112)).
- After a message is sent, the streaming avatar circle's border is `rgb(244, 201, 168)` -
  `--bowman-accent-border` - and the circle contains exactly one chainring SVG
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L119)).
- With the composer focused, its wrapper's `box-shadow` contains `rgba(183, 65, 14, 0.12)` -
  `--bowman-accent-glow`
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L138)).
- The sidebar names Copperline Bicycles
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L150)).
- On the Overview page both previews render exactly once; the default preview's send button
  equals the `--color-blue-500` probe, the client preview's is `rgb(183, 65, 14)`, the two
  differ, and only the client preview carries the mark
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L158)).
- The previews' entry streams forever, so their circles need no polling window: the default
  circle's border and background equal the `--color-blue-200` and `--color-blue-50` probes, the
  client circle's are `rgb(244, 201, 168)` and `rgb(255, 241, 230)` - `--bowman-accent-border`
  and `--bowman-accent-soft`
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L179)).

Five tokens are measured in the browser - `--bowman-accent`, `--bowman-active`,
`--bowman-accent-border`, `--bowman-accent-soft` and `--bowman-accent-glow` - while
`--bowman-focus-ring` rides along inside the same `box-shadow` string as the glow, through the
`/50` ring's `oklab` entry, without being asserted
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L112),
[L179](../../examples/chat-demo/tests/theming.spec.ts#L179),
[L138](../../examples/chat-demo/tests/theming.spec.ts#L138)). Not measured in Chromium at all
are `--bowman-accent-hover`, `--bowman-pulse-outline` and the seven `-dark` tokens - Playwright
runs the light scheme only and never hovers - which the jsdom class-string tests above pin alone ([validated by](../../tests/ChatComposer.test.tsx#L184),
[L71](../../tests/styles.test.ts#L71), [L467](../../tests/ChatMessage.test.tsx#L467)).
