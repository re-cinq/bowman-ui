# bowman-ui theming tokens

| Field  | Value       |
| ------ | ----------- |
| Issue  | issue 210   |
| Status | In Progress |

Theme blue was hard-wired as Tailwind palette utilities at every accent site - the send
button, the streaming avatar circle, the focus rings, the composer's focus glow, the thinking
dots, the pulse keyframe - so a consumer could not re-theme the chat surface without forking
class strings. This feature replaces each of those utilities with a `--bowman-*` custom
property read through a `var()` whose fallback is the palette value the site painted before,
so a consumer overriding nothing sees today's look byte for byte and a consumer setting a
handful of properties re-themes every site at once. The decision record lives in
docs/design-notes.md § Theming; this file pins the thirty-nine names, their fallbacks, every site
that reads them, and the tests.

## The tokens

Thirty-nine tokens - fifteen theme tokens named for a role and a shade, twenty neutral
chrome roles added under docs/design-notes.md § Theming decision 12, and four semantic-colour
roles (the danger pair and its soft surface, issue 108, under decision 6) - each with its default
recorded once in a comment line at the top of `src/styles.css`
([validated by](../../tests/theming-tokens-dist.test.ts#L173)).

The names and their fallbacks are tabled once, in docs/design-notes.md § Theming, and that
table is the contract rather than a copy: the dist test parses it and fails the moment a name,
a fallback or the order departs from the declaration block
([validated by](../../tests/theming-tokens-dist.test.ts#L265)).

- The set of tokens read across `dist/theme/tokens.js` and `dist/styles.css` is exactly the
  thirty-nine the comment block declares - no fortieth name in the code, no orphan in the block
  ([validated by](../../tests/theming-tokens-dist.test.ts#L180)).

## The fallback rule

Every token ships a default, and the default lives only in the `var()` fallback:
`dist/styles.css` declares no `:root` block and still contains no `@theme`
([validated by](../../tests/styles.test.ts#L100), [L55](../../tests/styles.test.ts#L55)).

- Every `--bowman-*` occurrence outside the declaration block is a `var()` read carrying a
  non-empty fallback ([validated by](../../tests/theming-tokens-dist.test.ts#L186)).
- A token falls back to the same palette value at every site that reads it, and that value is
  the one its comment line declares
  ([validated by](../../tests/theming-tokens-dist.test.ts#L200)).
- No bare `blue-` palette utility survives in any built component, the tokens module or the
  stylesheet - the only `blue` left in `dist` sits inside a `var()` fallback
  ([validated by](../../tests/theming-tokens-dist.test.ts#L248)).

## Where the classes live

The class strings live once, in the internal module `src/theme/tokens.ts` - one `export const`
per string, each naming its token and fallback - and the components import the constants: no
built component carries a `--bowman-` literal, and no file in `dist` assigns a `--bowman-*`
value ([validated by](../../tests/theming-tokens-dist.test.ts#L269),
[L280](../../tests/theming-tokens-dist.test.ts#L280)).

- `dist/theme/tokens.js` carries no `"use client"` directive, and `dist/index.js` re-exports
  nothing from it ([validated by](../../tests/theming-tokens-dist.test.ts#L260)).
- The public runtime and type export lists equal the committed snapshot, which carries none of
  the module's names ([validated by](../../tests/public-api.test.ts#L40),
  [L46](../../tests/public-api.test.ts#L46)).

## What is tokenised

- `ChatComposer`'s send button reads `--bowman-accent` for its background and
  `--bowman-accent-hover` on hover, light and dark
  ([validated by](../../tests/ChatComposer.test.tsx#L185)).
- `ChatComposer`'s wrapper keeps `focus-within:ring-2` beside the `--bowman-focus-ring` ring
  at `/50` and the `--bowman-accent-glow` shadow, light and dark
  ([validated by](../../tests/ChatComposer.test.tsx#L203)).
- `ChatMessage`'s streaming avatar circle reads `--bowman-accent-border` and
  `--bowman-accent-soft`, light and dark
  ([validated by](../../tests/ChatMessage.test.tsx#L473)).
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
  ([validated by](../../tests/ChatMessage.test.tsx#L481),
  [L149](../../tests/ConversationList.test.tsx#L149),
  [L137](../../tests/AppSidebar.test.tsx#L137), [L400](../../tests/AppShell.test.tsx#L400)).
- `ErrorBoundary`'s retry button keeps `focus-visible:ring-2` beside the `--bowman-focus-ring`
  colour and gains no dark ring, because it had none
  ([validated by](../../tests/ErrorBoundary.test.tsx#L181)).
- `ConversationList`'s active row alone reads `--bowman-active`, light and dark
  ([validated by](../../tests/ConversationList.test.tsx#L134)).
- `AppSidebar`'s `isActive` item alone reads `--bowman-active`, its label the `--bowman-text-strong`
  role, while an inactive item takes that role's `hover:` variant
  ([validated by](../../tests/AppSidebar.test.tsx#L137)).
- `bowman-pulse-subtle`'s 50 % stop reads `--bowman-accent-glow` and `--bowman-pulse-outline`
  with today's literals as fallbacks, while its zero stop stays literal
  ([validated by](../../tests/styles.test.ts#L71),
  [L217](../../tests/theming-tokens-dist.test.ts#L217)).
- `Button`'s and `IconButton`'s `primary` variant carries the `--bowman-accent` background and
  hover, and every variant of both keeps `focus:ring-2 ring-offset-2` beside the
  `--bowman-focus-ring` colour ([validated by](../../tests/Button.test.tsx#L93),
  [L120](../../tests/Button.test.tsx#L120), [L93](../../tests/IconButton.test.tsx#L93),
  [L109](../../tests/IconButton.test.tsx#L109)).
- A `PromptChips` chip and `SearchField`'s input keep `focus:ring-2 focus:outline-none` beside
  the `--bowman-focus-ring` colour ([validated by](../../tests/PromptChips.test.tsx#L134),
  [L116](../../tests/SearchField.test.tsx#L116)).

## Neutral chrome roles

Ten neutral role pairs join the theme tokens (docs/design-notes.md § Theming decisions 6 and
12): `--bowman-surface`, `--bowman-surface-hover`, `--bowman-control-hover`, `--bowman-border`,
`--bowman-ring-offset` and the text tiers `--bowman-text-strong`, `--bowman-text-body`, `--bowman-text-secondary`,
`--bowman-text-muted` and `--bowman-text-subtle`, each with a `-dark` twin. A site reads a role
only when its light and dark utilities both equal the pair's fallbacks; the dist test pins
which built component imports which role constant, so a site drifting back to a palette
utility fails ([validated by](../../tests/theming-tokens-dist.test.ts#L229)).

- `Button`'s `secondary` variant reads `--bowman-border`, `--bowman-surface`,
  `--bowman-surface-hover` and `--bowman-text-body` beside its `border` class; `ghost` reads
  `--bowman-text-secondary` and `--bowman-surface-hover` with no border token; neither carries
  the `--bowman-accent` background ([validated by](../../tests/Button.test.tsx#L99),
  [L110](../../tests/Button.test.tsx#L110)).
- `IconButton` with `variant` omitted is `secondary` and reads the same three surface, border
  and body-text roles; its `ghost` reads `--bowman-text-secondary` and `--bowman-surface-hover`
  ([validated by](../../tests/IconButton.test.tsx#L83), [L99](../../tests/IconButton.test.tsx#L99)).
- Every `Button`, `IconButton` and `PromptChips` focus ring offsets in `--bowman-ring-offset`,
  light and dark, beside the untouched `ring-offset-2`
  ([validated by](../../tests/Button.test.tsx#L120), [L109](../../tests/IconButton.test.tsx#L109),
  [L134](../../tests/PromptChips.test.tsx#L134)).
- A `PromptChips` chip reads `--bowman-border`, `--bowman-surface`, `--bowman-surface-hover` and
  `--bowman-text-body` beside its pill classes
  ([validated by](../../tests/PromptChips.test.tsx#L109)).
- The `AppShell` mobile header row, drawer close-button row and main region and the `AppSidebar`
  brand row, children scroll region and footer region read `--bowman-text-body`, so a plain string
  the library lays out for consumer content is painted instead of inheriting the page colour
  ([validated by](../../tests/AppShell.test.tsx#L441),
  [L507](../../tests/AppShell.test.tsx#L507),
  [L515](../../tests/AppShell.test.tsx#L515),
  [L268](../../tests/AppSidebar.test.tsx#L268),
  [L277](../../tests/AppSidebar.test.tsx#L277),
  [L286](../../tests/AppSidebar.test.tsx#L286)).
- The `ChatComposer` textarea, `SearchField` input, `ErrorBoundary` heading, active `AppSidebar`
  nav item and `ChatMessage` message body read `--bowman-text-strong`; the nav item and ghost
  `Button` hover and the focused `AppShell` skip link read the same role through its `hover:` and
  `focus:` variants, so a consumer recolours every strong-text site at once - the message body
  joining `--bowman-text-strong` rather than `--bowman-text-body` per decision 6
  ([validated by](../../tests/theming-tokens-dist.test.ts#L229), [L490](../../tests/ChatMessage.test.tsx#L490)).
- The selected thumbs-down chip and text, the `ErrorBoundary` icon circle and glyph, and the
  `ConversationList` delete-button hover read the danger role - `--bowman-danger` /
  `--bowman-danger-soft` and their `-dark` twins - so a consumer recolours every negative-state
  site at once; the delete hover moves from a lone `red-500` to the role's `red-600`, and the two
  dark soft fills (`red-900/30` and `/20`) collapse to one `rgba()` fallback, per decision 6
  ([validated by](../../tests/theming-tokens-dist.test.ts#L228), [L496](../../tests/ChatMessage.test.tsx#L496)).
- The twenty role fallbacks are declared in the stylesheet block and the design-notes table
  in the same order as the code reads them, and every read carries the declared fallback
  ([validated by](../../tests/theming-tokens-dist.test.ts#L173),
  [L265](../../tests/theming-tokens-dist.test.ts#L265)).

## What stays palette-mapped

- The ring width, offset and outline classes - `focus:ring-2`, `ring-offset-2`,
  `focus:outline-none` - stay at every site untouched beside the colour tokens
  ([validated by](../../tests/ChatComposer.test.tsx#L203),
  [L120](../../tests/Button.test.tsx#L120), [L134](../../tests/PromptChips.test.tsx#L134)).
- Every neutral site that matches a role pair on one side only keeps its palette classes on
  both sides, so no site is half-themed: the shell ground and main region, the avatar circles'
  rest state, the user avatar and code chips, the inverse surfaces of `Toast` and
  `ErrorBoundary`'s retry button, the mobile overlay, the disabled send button, the
  `border-slate-300` dividers, `ChatMessage`'s `dark:ring-offset-slate-950`, the
  slate-600 / slate-300 label pair and the icon controls' lone `text-slate-400` - the full
  list is docs/design-notes.md § Theming decision 6.

## Dark mode boundary

See `specs/bowman-ui-stylesheet-entry/spec.md`: the dark-mode strategy stays the consumer's
build decision, exactly as that spec left it. Each `-dark` token rides the `dark:`
variant its site already carried, so the media-query default and a class strategy both resolve
it without the package choosing; the package adds no media query and no selector of its own.
`ErrorBoundary`'s retry button had no dark ring and gains none
([validated by](../../tests/ErrorBoundary.test.tsx#L181)).

## Recorded decisions

1. **The composer's `/50` ring keeps its opacity modifier on the token.** Tailwind emits two
   branches: under `@supports (color: color-mix(in lab, red, red))` the ring is
   `color-mix(in oklab, var(--bowman-focus-ring, var(--color-blue-500)) 50%, transparent)`,
   identical to what `ring-blue-500/50` produced; the legacy branch drops the 50 % because
   Tailwind cannot pre-mix a `var()`. That branch is unreachable on Tailwind v4's own browser
   floor - Safari 16.4, Chrome 111 and Firefox 128 all support `color-mix()` - so the
   byte-for-byte claim holds on every supported engine
   ([validated by](../../tests/ChatComposer.test.tsx#L203)).
2. **Only the active row's backgrounds are tokenised.** `--bowman-active` and
   `--bowman-active-dark` colour the surface; the label colours stay palette-mapped, so a
   consumer must keep `--bowman-active` a light surface in light mode and
   `--bowman-active-dark` a dark one, or the fixed label loses its contrast
   ([validated by](../../tests/AppSidebar.test.tsx#L132)).
3. **The keyframe's zero stop stays the literal `rgba(59, 130, 246, 0)`.** A review finding
   asked for a token there too; rejected because CSS Color 4 interpolates premultiplied, so the
   hue of a fully transparent stop is inert
   ([validated by](../../tests/theming-tokens-dist.test.ts#L217)).
4. **`--bowman-accent` falls back to blue-500 in light mode and blue-600 in dark, with the hover
   pair the other way round.** The issue described the accent as "today blue-600"; the
   components said otherwise, and the byte-for-byte rule forced the table to follow the code.
   The rejected alternative was eight tokens, one name per role with a mode-specific fallback
   on each side: a consumer could then set only one value per role without writing its own dark
   selector ([validated by](../../tests/theming-tokens-dist.test.ts#L200)).

## The demo

The consumer app (`examples/chat-demo`, specified in `specs/bowman-ui-consumer-app/spec.md`)
renders the chat fixture twice over: the Marginalia Books default at `?view=chat`, and at
`?view=chat&theme=copperline` the same fixture as a second, invented company, Copperline Bicycles
(a web search found no such company), named as such in the sidebar
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L193)). The module
`src/themes.tsx` resolves the theme from the query, and `ChatScreen` wraps the whole fragment, `AppShell` and `Toast`
alike, in `<div class="custom-theme">` and passes the theme's chainring mark (an `aria-hidden`
SVG carrying `data-theme-mark="copperline"`) as `ChatMessageList`'s `assistantAvatar`, so the
mark fills the streaming avatar circle
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L146),
[wrapper](../../examples/chat-demo/src/App.tsx#L224),
[avatar](../../examples/chat-demo/src/App.tsx#L193),
[mark](../../examples/chat-demo/src/themes.tsx#L25)). The Overview page
(`?view=docs&component=overview`) gains a Theming section that renders `ChatMessage`,
`ChatComposer` and `ConversationList` twice from one preview component,
`data-theming-preview="default"` beside `data-theming-preview="custom"` (the issue's "shows both
side by side"), so the two columns cannot drift apart
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L201),
[preview](../../examples/chat-demo/src/docs/ThemingSection.tsx#L24)).

The override lives in `examples/chat-demo/src/custom-theme.css`, which sets all thirty-nine tokens
under `.custom-theme` (scoped to the wrapper, not `:root`) and is imported from `main.tsx` after
`./styles.css`, whose three documented lines are untouched; the themed screen takes its colours
from that wrapper alone
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L139),
[stylesheet](../../examples/chat-demo/src/custom-theme.css#L5),
[import](../../examples/chat-demo/src/main.tsx#L5)). The wrapper scope is what lets one document
show the default and the themed look side by side, and it is the fallback rule (decision 1 in
docs/design-notes.md § Theming) doing its job: the package declares nothing, so an override on
any wrapper wins on inheritance alone, with no cascade-order fight against `dist/styles.css`
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L201)). The demo commits touched
nothing under the library's `src/` - the one statement in this section with no executable
anchor: its proof is the diff itself, reviewable but not re-runnable.

The neutral roles ride the same wrapper: the composer's frame resolves to the palette's white
surface and slate-200 border on the default screen and to Copperline's warm surface and border
on the themed one ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L107),
[L165](../../examples/chat-demo/tests/theming.spec.ts#L165)).

An unknown `theme` value falls back to the default: `resolveTheme` reads a `Map`, not a record,
so a prototype name such as `constructor` cannot resolve to a function, and `?theme=constructor`
renders the Marginalia Books sidebar with no theme mark
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L128)). The unthemed
`?view=chat` screen renders no wrapper and no mark, so the existing chat and docs suites drive
markup identical to what they drove before the theme dimension existed
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L94)).

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
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L94)).

- On the default chat screen the enabled send button's background equals the `--color-blue-500`
  probe, the active conversation row's equals the `--color-slate-100` probe, and no
  `[data-theme-mark]` renders
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L94)).
- On the Copperline screen the send button's background is `rgb(183, 65, 14)` -
  `--bowman-accent` - and the active row's is `rgb(253, 235, 220)` - `--bowman-active`
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L139)).
- After a message is sent, the streaming avatar circle's border is `rgb(244, 201, 168)` -
  `--bowman-accent-border` - and the circle contains exactly one chainring SVG
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L146)).
- With the composer focused, its wrapper's `box-shadow` contains `rgba(183, 65, 14, 0.12)` -
  `--bowman-accent-glow`
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L181)).
- The sidebar names Copperline Bicycles
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L193)).
- On the Overview page both previews render exactly once; the default preview's send button
  equals the `--color-blue-500` probe, the custom preview's is `rgb(183, 65, 14)`, the two
  differ, and only the custom preview carries the mark
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L201)).
- The previews' entry streams forever, so their circles need no polling window: the default
  circle's border and background equal the `--color-blue-200` and `--color-blue-50` probes, the
  custom circle's are `rgb(244, 201, 168)` and `rgb(255, 241, 230)` - `--bowman-accent-border`
  and `--bowman-accent-soft`
  ([validated by](../../examples/chat-demo/tests/theming.spec.ts#L222)).

Five tokens are measured in the browser - `--bowman-accent`, `--bowman-active`,
`--bowman-accent-border`, `--bowman-accent-soft` and `--bowman-accent-glow` - while
`--bowman-focus-ring` rides along inside the same `box-shadow` string as the glow, through the
`/50` ring's `oklab` entry, without being asserted
([validated by](../../examples/chat-demo/tests/theming.spec.ts#L139),
[L222](../../examples/chat-demo/tests/theming.spec.ts#L222),
[L181](../../examples/chat-demo/tests/theming.spec.ts#L181)). Not measured in Chromium at all
are `--bowman-accent-hover`, `--bowman-pulse-outline` and the seven `-dark` tokens - Playwright
runs the light scheme only and never hovers - which the jsdom class-string tests above pin alone ([validated by](../../tests/ChatComposer.test.tsx#L185),
[L71](../../tests/styles.test.ts#L71), [L473](../../tests/ChatMessage.test.tsx#L473)).
