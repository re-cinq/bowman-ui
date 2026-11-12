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
docs/design-notes.md § Theming; this file pins the fifty-three names, their fallbacks, every site
that reads them, and the tests.

## The tokens

Fifty-three tokens - fifteen theme tokens named for a role and a shade, twenty-one neutral
chrome roles added under docs/design-notes.md § Theming decision 12, and seventeen semantic-colour
roles (the danger and success pairs with their soft surfaces, issues 108 and 107, and the
danger-fill, info and warning roles, issue 415, under decision 6) - each with its default recorded once in a comment line at the top of
`src/styles.css` ([validated by dist/styles.css opens with one comment line per token, each stating its default @87f73091](../../tests/theming-tokens-dist.test.ts#L325)).

The names and their fallbacks are tabled once, in docs/design-notes.md § Theming, and that
table is the contract rather than a copy: the dist test parses it and fails the moment a name,
a fallback or the order departs from the declaration block
([validated by the token table in docs/design-notes.md § Theming lists the same names and fallbacks, in the declared order @da70dd1c](../../tests/theming-tokens-dist.test.ts#L417)).

- The set of tokens read across `dist/theme/tokens.js` and `dist/styles.css` is exactly the
  fifty-three the comment block declares - no extra name in the code, no orphan in the block
  ([validated by the tokens read in dist/theme/tokens.js and dist/styles.css are exactly the declared ones @f288d8f2](../../tests/theming-tokens-dist.test.ts#L332)).
- CLAUDE.md invariant 13 quotes the count as a literal, and the same dist test reads that digit
  and fails when it lags the block
  ([validated by CLAUDE.md invariant 13 states the same token count as the stylesheet's declaration block @2d9f9be0](../../tests/theming-tokens-dist.test.ts#L483)).
- The count the prose spells - this file's four sentences, three in docs/design-notes.md
  § Theming, the Styling row of .specify/spec.md, three in README.md and five across the demo's
  README, stylesheet and sources - is read by the same test against the word the block's size
  spells, so a sentence left at the old number reds a token PR
  ([validated by the spelled token counts in docs/design-notes.md § Theming, .specify/spec.md, the theming spec, README.md and the demo sources equal the declaration block @2a3da4c8](../../tests/theming-tokens-dist.test.ts#L491)).
- The breakdown by group that this file's opening sentence and docs/design-notes.md § Theming
  spell - theme tokens, neutral chrome roles, semantic-colour roles - is summed by the same test
  against the block, so a token PR that bumps the total and forgets a group reds too
  ([validated by the group breakdown spelled in docs/design-notes.md § Theming and the theming spec sums to the declaration block @cc9d504c](../../tests/theming-tokens-dist.test.ts#L512)).
- The demo stylesheet `examples/chat-demo/src/custom-theme.css` sets exactly the declared names,
  so the "sets all" sentences above stay true after a token PR only when the demo file moved too
  ([validated by examples/chat-demo/src/custom-theme.css sets exactly the declared tokens @b80f4a7d](../../tests/theming-tokens-dist.test.ts#L525)).

## The fallback rule

Every token ships a default, and the default lives only in the `var()` fallback:
`dist/styles.css` declares no `:root` block and still contains no `@theme`
([validated by @862280c0](../../tests/styles.test.ts#L101), [validated by contains no @theme block, no @import "tailwindcss" and no @plugin line @fac28268](../../tests/styles.test.ts#L56)).

- Every `--bowman-*` occurrence outside the declaration block is a `var()` read carrying a
  non-empty fallback ([validated by @42fafdc1](../../tests/theming-tokens-dist.test.ts#L339)).
- A token falls back to the same palette value at every site that reads it, and that value is
  the one its comment line declares
  ([validated by each token falls back to the same palette value at every site, matching the declared default @41c178c8](../../tests/theming-tokens-dist.test.ts#L353)).
- No bare `blue-` palette utility survives in any built component, the tokens module or the
  stylesheet - the only `blue` left in `dist` sits inside a `var()` fallback
  ([validated by no bare blue- palette utility survives in any built component, the tokens module or the stylesheet @19240a86](../../tests/theming-tokens-dist.test.ts#L401)).

## Where the classes live

The class strings live once, in the internal module `src/theme/tokens.ts` - one `export const`
per string, each naming its token and fallback - and the components import the constants: no
built component carries a `--bowman-` literal, and no file in `dist` assigns a `--bowman-*`
value ([validated by no built component carries a --bowman- literal; the class strings live only in dist/theme/tokens.js @19240a86](../../tests/theming-tokens-dist.test.ts#L401),
[validated by `no dist file assigns a --bowman-* value: every occurrence outside the stylesheet's comment block is a read` @f4ee3837](../../tests/theming-tokens-dist.test.ts#L433)).

- `dist/theme/tokens.js` carries no `"use client"` directive, and `dist/index.js` re-exports
  nothing from it ([validated by dist/theme/tokens.js carries no "use client" directive and dist/index.js re-exports nothing from it @96a312e0](../../tests/theming-tokens-dist.test.ts#L413)).
- The public runtime and type export lists equal the committed snapshot, which carries none of
  the module's names ([validated by @3c9682f2](../../tests/public-api.test.ts#L40),
  [L46@1a95e338](../../tests/public-api.test.ts#L46)).

## What is tokenised

- `ChatComposer`'s send button reads `--bowman-accent` for its background and
  `--bowman-accent-hover` on hover, light and dark
  ([validated by the send button reads --bowman-accent for its background and --bowman-accent-hover on hover, light and dark @53977322](../../tests/ChatComposer.test.tsx#L322)).
- `ChatComposer`'s send button and the primary `Button`/`IconButton` variant paint their text
  with `--bowman-text-on-accent`, one `white` value in both modes, so a consumer with a pale
  accent can darken it ([validated by the send button reads --bowman-text-on-accent for its text, one value in both modes @3d970d64](../../tests/ChatComposer.test.tsx#L340),
  [primary@98b3781e](../../tests/Button.test.tsx#L97), [icon@98b3781e](../../tests/IconButton.test.tsx#L96)).
- `ChatComposer`'s disabled send button reads `--bowman-text-subtle` for its text and
  `--bowman-active` for its background under a `disabled:` prefix, light and dark - two existing
  roles, no role of its own (docs/design-notes.md decision 6, issue 106)
  ([validated by the disabled send button reads --bowman-text-subtle for its text and --bowman-active for its background, light and dark @35235d74](../../tests/ChatComposer.test.tsx#L358)).
- `ChatComposer`'s wrapper keeps `focus-within:ring-2` beside the `--bowman-focus-ring` ring
  at `/50` and the `--bowman-accent-glow` shadow, light and dark
  ([validated by the wrapper keeps focus-within:ring-2 beside the --bowman-focus-ring /50 ring and the --bowman-accent-glow shadow @2f544532](../../tests/ChatComposer.test.tsx#L346)).
- `ChatMessage`'s streaming avatar circle reads `--bowman-accent-border` and
  `--bowman-accent-soft`, light and dark
  ([validated by while isStreaming the circle reads --bowman-accent-border and --bowman-accent-soft, light and dark @dc69918d](../../tests/ChatMessage.test.tsx#L494)).
- `ThinkingIndicator`'s circle reads the same two tokens
  ([validated by the circle reads --bowman-accent-border and --bowman-accent-soft, light and dark @59d55d9d](../../tests/ThinkingIndicator.test.tsx#L76)).
- `ThinkingDots` read `--bowman-accent` for every dot, in both modes, and keep doing so under
  `reducedMotion` in `ThinkingTrace` and `ChatMessageList`
  ([validated by true keeps the three dots but strips the bowman-fade-dot animation class @d5bb9fd3](../../tests/ThinkingTrace.test.tsx#L114),
  [validated by forwards reducedMotion, stripping the streaming dots' animation class @16eddd32](../../tests/ChatMessageList.test.tsx#L1255)).
- Every focus ring keeps its `focus:ring-2` width class beside the `--bowman-focus-ring`
  colour, light and dark: `ChatMessage`'s article, copy button and thumb buttons,
  `ConversationList`'s row link and delete button, every `AppSidebar` item, and `AppShell`'s
  skip link, hamburger and close button
  ([validated by the article, the copy button and both thumb buttons keep focus:ring-2 beside the --bowman-focus-ring colour @76d2ed76](../../tests/ChatMessage.test.tsx#L502),
  [validated by the row link and the delete button keep focus:ring-2 beside the --bowman-focus-ring colour @785a719f](../../tests/ConversationList.test.tsx#L152),
  [validated by the isActive item reads --bowman-active with the strong text token, an inactive item takes the strong hover token, and every item keeps focus:ring-2 beside the --bowman-focus-ring colour @7228460a](../../tests/AppSidebar.test.tsx#L137), [validated by the skip link, the hamburger and the close button keep focus:ring-2 beside the --bowman-focus-ring colour @e47419d4](../../tests/AppShell.test.tsx#L424)).
- `ErrorBoundary`'s retry button keeps `focus-visible:ring-2` beside the `--bowman-focus-ring`
  colour and gains no dark ring, because it had none
  ([validated by the retry button keeps focus-visible:ring-2 beside the --bowman-focus-ring colour, with no dark ring @44ebe505](../../tests/ErrorBoundary.test.tsx#L188)).
- `ConversationList`'s active row alone reads `--bowman-active`, light and dark
  ([validated by `the active row's <li> alone reads --bowman-active, light and dark` @a7fffebb](../../tests/ConversationList.test.tsx#L137)).
- `AppSidebar`'s `isActive` item alone reads `--bowman-active`, its label the `--bowman-text-strong`
  role, while an inactive item takes that role's `hover:` variant
  ([validated by the isActive item reads --bowman-active with the strong text token, an inactive item takes the strong hover token, and every item keeps focus:ring-2 beside the --bowman-focus-ring colour @7228460a](../../tests/AppSidebar.test.tsx#L137)).
- `bowman-pulse-subtle`'s 50 % stop reads `--bowman-accent-glow` and `--bowman-pulse-outline`
  with today's literals as fallbacks, while its zero stop stays literal
  ([validated by @4b32990f](../../tests/styles.test.ts#L72),
  [validated by the keyframe's 50% stop reads --bowman-accent-glow and --bowman-pulse-outline while its zero stop stays literal @c262fb68](../../tests/theming-tokens-dist.test.ts#L370)).
- `Button`'s and `IconButton`'s `primary` variant carries the `--bowman-accent` background and
  hover, and every variant of both keeps `focus:ring-2 ring-offset-2` beside the
  `--bowman-focus-ring` colour ([validated by variant="primary" carries the --bowman-accent background and hover, --bowman-text-on-accent text and no border-slate-200 @98b3781e](../../tests/Button.test.tsx#L97),
  [validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @512e1f83](../../tests/Button.test.tsx#L121), [validated by variant="primary" carries the --bowman-accent background and hover, --bowman-text-on-accent text and no border-slate-200 @98b3781e](../../tests/IconButton.test.tsx#L96),
  [validated by focus:ring-2 ring-offset-2 stay beside the --bowman-focus-ring and --bowman-ring-offset colours and the disabled pair is present @07cb5d34](../../tests/IconButton.test.tsx#L109)).
- A `PromptChips` chip and `SearchField`'s input keep `focus:ring-2 focus:outline-none` beside
  the `--bowman-focus-ring` colour ([validated by a chip keeps focus:ring-2 ring-offset-2 focus:outline-none beside the --bowman-focus-ring and --bowman-ring-offset colours @ca657257](../../tests/PromptChips.test.tsx#L134),
  [validated by the input keeps focus:ring-2 focus:outline-none beside the --bowman-focus-ring colour @326bb75b](../../tests/SearchField.test.tsx#L210)).

## Neutral chrome roles

Ten neutral role pairs join the theme tokens (docs/design-notes.md § Theming decisions 6 and
12): `--bowman-surface`, `--bowman-surface-hover`, `--bowman-control-hover`, `--bowman-border`,
`--bowman-ring-offset` and the text tiers `--bowman-text-strong`, `--bowman-text-body`, `--bowman-text-secondary`,
`--bowman-text-muted` and `--bowman-text-subtle`, each with a `-dark` twin. A site reads a role
only when its light and dark utilities both equal the pair's fallbacks; the dist test pins
which built component imports which role constant, so a site drifting back to a palette
utility fails ([validated by each neutral role constant is imported by exactly the built components recorded for it @ed5736b9](../../tests/theming-tokens-dist.test.ts#L382)).

- `Button`'s `secondary` variant reads `--bowman-border`, `--bowman-surface`,
  `--bowman-surface-hover` and `--bowman-text-body` beside its `border` class; `ghost` reads
  `--bowman-text-secondary` and `--bowman-surface-hover` with no border token; neither carries
  the `--bowman-accent` background ([validated by variant="secondary" carries border beside the --bowman-border, --bowman-surface, --bowman-surface-hover and --bowman-text-body tokens and no --bowman-accent background @fb977789](../../tests/Button.test.tsx#L100),
  [validated by variant="ghost" reads --bowman-text-secondary, its hover reads --bowman-text-strong, beside --bowman-surface-hover with neither a border token nor the --bowman-accent background @3ff5ea71](../../tests/Button.test.tsx#L111)).
- `IconButton` with `variant` omitted is `secondary` and reads the same three surface, border
  and body-text roles; its `ghost` reads `--bowman-text-secondary` and `--bowman-surface-hover`
  ([validated by with variant omitted the button is secondary: border beside --bowman-border, --bowman-surface and --bowman-text-body, no --bowman-accent background @7bdffa81](../../tests/IconButton.test.tsx#L83), [validated by variant="ghost" reads --bowman-text-secondary and --bowman-surface-hover and no border class at all @36d993c6](../../tests/IconButton.test.tsx#L99)).
- Every `Button`, `IconButton` and `PromptChips` focus ring offsets in `--bowman-ring-offset`,
  light and dark, beside the untouched `ring-offset-2`
  ([validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @512e1f83](../../tests/Button.test.tsx#L121), [validated by focus:ring-2 ring-offset-2 stay beside the --bowman-focus-ring and --bowman-ring-offset colours and the disabled pair is present @07cb5d34](../../tests/IconButton.test.tsx#L109),
  [validated by a chip keeps focus:ring-2 ring-offset-2 focus:outline-none beside the --bowman-focus-ring and --bowman-ring-offset colours @ca657257](../../tests/PromptChips.test.tsx#L134)).
- A `PromptChips` chip reads `--bowman-border`, `--bowman-surface`, `--bowman-surface-hover` and
  `--bowman-text-body` beside its pill classes
  ([validated by a chip carries the rounded-full pill classes beside the --bowman-border, --bowman-surface, --bowman-surface-hover and --bowman-text-body tokens @eff6fe0c](../../tests/PromptChips.test.tsx#L109)).
- The `AppShell` mobile header row, drawer close-button row, main region and the desktop rail and
  mobile drawer wrappers around `renderSidebar` output, and the `AppSidebar` brand row, children
  scroll region and footer region read `--bowman-text-body`, so a plain string the library lays
  out for consumer content is painted instead of inheriting the page colour
  ([validated by the mobile header row carries the body text token, so a plain-string brand reads on the dark surface @0636ee1e](../../tests/AppShell.test.tsx#L465),
  [validated by the drawer close-button row carries the body text token, so plain-string drawer content reads on the dark surface @67513c61](../../tests/AppShell.test.tsx#L531),
  [validated by the main region carries the body text token, so plain-string content reads on the dark surface @6f7072e6](../../tests/AppShell.test.tsx#L539),
  [validated by the desktop rail and the mobile drawer wrappers carry the body text token, so plain-string renderSidebar content reads on the dark surface @107087e4](../../tests/AppShell.test.tsx#L548),
  [validated by the brand row carries the body text token, so a plain-string brand reads on the dark surface @f8556e9e](../../tests/AppSidebar.test.tsx#L268),
  [validated by the children scroll region carries the body text token, so plain-string children read on the dark surface @b45219a8](../../tests/AppSidebar.test.tsx#L277),
  [validated by the footer region carries the body text token, so a plain-string footer reads on the dark surface @b0f9ec6f](../../tests/AppSidebar.test.tsx#L286)).
- The `ChatComposer` textarea, `SearchField` input, `ErrorBoundary` heading, active `AppSidebar`
  nav item and `ChatMessage` message body read `--bowman-text-strong`; the nav item and ghost
  `Button` hover and the focused `AppShell` skip link read the same role through its `hover:` and
  `focus:` variants, so a consumer recolours every strong-text site at once - the message body
  joining `--bowman-text-strong` rather than `--bowman-text-body` per decision 6
  ([validated by each neutral role constant is imported by exactly the built components recorded for it @ed5736b9](../../tests/theming-tokens-dist.test.ts#L382), [validated by the message body reads the strong text token, joining text-strong rather than text-body per decision 6 @816ae9fd](../../tests/ChatMessage.test.tsx#L511)).
- `ChatMessage`'s assistant name, the `ThinkingTrace` trace content and the `ToolActivity` tool
  name read `--bowman-text-secondary`, folding the slate-600 / slate-300 label pair into the
  existing role per decision 6, the dark side dimming one step to `slate-400`
  ([validated by each neutral role constant is imported by exactly the built components recorded for it @ed5736b9](../../tests/theming-tokens-dist.test.ts#L382),
  [validated by the assistant name reads the secondary text token, folding the label pair per decision 6 @cc8fffd2](../../tests/ChatMessage.test.tsx#L528),
  [validated by reads the secondary text token, folding the label pair per decision 6 @ba7d6fc1](../../tests/ThinkingTrace.test.tsx#L70),
  [validated by true reads the tool name in the secondary text token, folding the label pair per decision 6 @ccb9a0b9](../../tests/ToolActivity.test.tsx#L43)).
- `ChatMessage`'s copy and thumb buttons read `--bowman-text-subtle` at rest and
  `--bowman-text-secondary` on hover through its `hover:` variant, the semantic promotion of
  decision 6, while `ConversationList`'s delete button reads `--bowman-text-subtle` at rest with
  its danger hover left to the danger role; dark rest dims one step to slate-500 and dark hover to
  slate-400 ([validated by each neutral role constant is imported by exactly the built components recorded for it @ed5736b9](../../tests/theming-tokens-dist.test.ts#L382),
  [validated by copy and both thumb buttons read text-subtle at rest and promote to text-secondary on hover @23bb4023](../../tests/ChatMessage.test.tsx#L534),
  [validated by the delete button reads text-subtle at rest, its danger hover left to the danger role @25b878a6](../../tests/ConversationList.test.tsx#L165)).
- The selected thumbs-down chip and text, the `ErrorBoundary` icon circle and glyph, and the
  `ConversationList` delete-button hover read the danger role - `--bowman-danger` /
  `--bowman-danger-soft` and their `-dark` twins - so a consumer recolours every negative-state
  site at once; the delete hover moves from a lone `red-500` to the role's `red-600`, and the two
  dark soft fills (`red-900/30` and `/20`) collapse to one `rgba()` fallback, per decision 6
  ([validated by each neutral role constant is imported by exactly the built components recorded for it @bc8f1dea](../../tests/theming-tokens-dist.test.ts#L381),
  [validated by a selected thumbs-down reads the danger role's soft surface and text, not the red palette classes @b2fbe30f](../../tests/ChatMessage.test.tsx#L517),
  [validated by the delete button's hover reads the danger role, not the lone red-500 @1e08f14f](../../tests/ConversationList.test.tsx#L159),
  [validated by the error icon circle and glyph read the danger role, not the red palette classes @8de62178](../../tests/ErrorBoundary.test.tsx#L91)).
- The twenty-one role fallbacks are declared in the stylesheet block and the design-notes table
  in the same order as the code reads them, and every read carries the declared fallback
  ([validated by dist/styles.css opens with one comment line per token, each stating its default @87f73091](../../tests/theming-tokens-dist.test.ts#L325),
  [validated by the token table in docs/design-notes.md § Theming lists the same names and fallbacks, in the declared order @da70dd1c](../../tests/theming-tokens-dist.test.ts#L417)).

## Semantic colour roles

Beside the danger role, two success roles carry a status meaning rather than neutral chrome (docs/design-notes.md
§ Theming decision 6): `--bowman-success` and `--bowman-success-soft`, each with a `-dark` twin.
Their fallbacks equal today's green palette, and the soft fill's dark fallback is a literal `rgba()`
because a `/30` alpha modifier cannot ride a token.

- The copied check mark and the selected thumbs-up read `--bowman-success` for their text, and the
  selected thumbs-up reads `--bowman-success-soft` for its fill; `ChatMessage` is the only component
  the dist test pins as importing either, and adopting the role retires the check's lone `green-500`
  for `green-600` (`green-400` in dark) per decision 6
  ([validated by each neutral role constant is imported by exactly the built components recorded for it @ed5736b9](../../tests/theming-tokens-dist.test.ts#L382), [validated by the copied check and the selected thumbs-up read the success role, retiring the green literals @871ae697](../../tests/ChatMessage.test.tsx#L545)).

## What stays palette-mapped

- The ring width, offset and outline classes - `focus:ring-2`, `ring-offset-2`,
  `focus:outline-none` - render at every site untouched beside the colour tokens; at the offset-ring
  sites the outline and width ride in `FOCUS_RING` (`src/theme/focusRing.ts`, issue 155) with
  `ring-offset-2` left in place ([validated by the wrapper keeps focus-within:ring-2 beside the --bowman-focus-ring /50 ring and the --bowman-accent-glow shadow @2f544532](../../tests/ChatComposer.test.tsx#L346),
  [validated by every variant keeps focus:ring-2 ring-offset-2 beside the --bowman-focus-ring and --bowman-ring-offset colours and carries the disabled pair @512e1f83](../../tests/Button.test.tsx#L121), [validated by a chip keeps focus:ring-2 ring-offset-2 focus:outline-none beside the --bowman-focus-ring and --bowman-ring-offset colours @ca657257](../../tests/PromptChips.test.tsx#L134),
  [validated by `dist/theme/focusRing.js composes FOCUS_RING and FOCUS_VISIBLE_RING from the tokens module's ring colour and offset, exactly the six offset-ring components import FOCUS_RING, and ModalPanel alone imports FOCUS_VISIBLE_RING` @6a7f5e79](../../tests/theming-tokens-dist.test.ts#L447)).
- Every neutral site that matches a role pair on one side only keeps its palette classes on
  both sides, so no site is half-themed: the shell ground and main region, the avatar circles'
  rest state, the user avatar and code chips, the inverse surfaces of `Toast` and
  `ErrorBoundary`'s retry button, the mobile overlay, the
  `border-slate-300` dividers, `ChatMessage`'s `dark:ring-offset-slate-950` and the
  `ConversationList` badge and user-avatar label text that keep slate-600 / slate-300 on their
  own slate chips - the full
  list is docs/design-notes.md § Theming decision 6.

## Dark mode boundary

See `specs/bowman-ui-stylesheet-entry/spec.md`: the dark-mode strategy stays the consumer's
build decision, exactly as that spec left it. Each `-dark` token rides the `dark:`
variant its site already carried, so the media-query default and a class strategy both resolve
it without the package choosing; the package adds no media query and no selector of its own.
The one exception in shape is the ring offset, per docs/design-notes.md § Theming decision 13.

- The dark offset is `dark:focus:ring-offset-(...)` rather than `dark:` alone, because a `dark:`
  utility rides a media query at `(0,1,0)` and loses to the `(0,2,0)` `focus:` light read at every
  focused site, so `--bowman-ring-offset-dark` never painted; the stacked variant matches that
  specificity and follows it in the cascade, and the focused conversation row's offset shadow
  under the dark scheme resolves to the `--color-slate-900` probe, shown to differ from the white
  light offset, and inside the Copperline wrapper to its `--bowman-ring-offset-dark`
  ([validated by @7651fef3](../../examples/chat-demo/tests/theming.spec.ts#L240)).

`ErrorBoundary`'s retry button had no dark ring and gains none
([validated by the retry button keeps focus-visible:ring-2 beside the --bowman-focus-ring colour, with no dark ring @44ebe505](../../tests/ErrorBoundary.test.tsx#L188)).

## Recorded decisions

1. **The composer's `/50` ring keeps its opacity modifier on the token.** Tailwind emits two
   branches: under `@supports (color: color-mix(in lab, red, red))` the ring is
   `color-mix(in oklab, var(--bowman-focus-ring, var(--color-blue-500)) 50%, transparent)`,
   identical to what `ring-blue-500/50` produced; the legacy branch drops the 50 % because
   Tailwind cannot pre-mix a `var()`. That branch is unreachable on Tailwind v4's own browser
   floor - Safari 16.4, Chrome 111 and Firefox 128 all support `color-mix()` - so the
   byte-for-byte claim holds on every supported engine
   ([validated by the wrapper keeps focus-within:ring-2 beside the --bowman-focus-ring /50 ring and the --bowman-accent-glow shadow @2f544532](../../tests/ChatComposer.test.tsx#L346)).
2. **The active row's backgrounds have their own pair; its label rides the strong text
   role.** `--bowman-active` and `--bowman-active-dark` colour the surface. As first recorded
   the label colours stayed palette-mapped. **Amended by 146:** issue 102 moved the sidebar
   item's label onto `--bowman-text-strong` and its `-dark` twin (docs/design-notes.md §
   Theming decision 6), so the contrast constraint now binds two tokens the consumer sets
   together: `--bowman-active` must contrast with `--bowman-text-strong` in light mode and
   `--bowman-active-dark` with `--bowman-text-strong-dark` in dark mode, or the active label
   loses its contrast
   ([validated by the isActive item reads --bowman-active with the strong text token, an inactive item takes the strong hover token, and every item keeps focus:ring-2 beside the --bowman-focus-ring colour @7228460a](../../tests/AppSidebar.test.tsx#L137)).
3. **The keyframe's zero stop stays the literal `rgba(59, 130, 246, 0)`.** A review finding
   asked for a token there too; rejected because CSS Color 4 interpolates premultiplied, so the
   hue of a fully transparent stop is inert
   ([validated by the keyframe's 50% stop reads --bowman-accent-glow and --bowman-pulse-outline while its zero stop stays literal @c262fb68](../../tests/theming-tokens-dist.test.ts#L370)).
4. **`--bowman-accent` falls back to blue-500 in light mode and blue-600 in dark, with the hover
   pair the other way round.** The issue described the accent as "today blue-600"; the
   components said otherwise, and the byte-for-byte rule forced the table to follow the code.
   The rejected alternative was eight tokens, one name per role with a mode-specific fallback
   on each side: a consumer could then set only one value per role without writing its own dark
   selector ([validated by each token falls back to the same palette value at every site, matching the declared default @41c178c8](../../tests/theming-tokens-dist.test.ts#L353)).

## The demo

The consumer app (`examples/chat-demo`, specified in `specs/bowman-ui-consumer-app/spec.md`)
renders the chat fixture twice over: the Marginalia Books default at `?view=chat`, and at
`?view=chat&theme=copperline` the same fixture as a second, invented company, Copperline Bicycles
(a web search found no such company), named as such in the sidebar
([validated by the sidebar names the theme and the chainring mark fills every assistant circle inside the wrapper alone @c2c3ffc6](../../examples/chat-demo/tests/theming.spec.ts#L422)). The module
`src/themes.tsx` resolves the theme from the query, and `ChatScreen` wraps the whole fragment, `AppShell` and `Toast`
alike, in `<div class="custom-theme">` and passes the theme's chainring mark (an `aria-hidden`
SVG carrying `data-theme-mark="copperline"`) as `ChatMessageList`'s `assistantAvatar`, so the
mark fills every assistant avatar circle
([validated by the sidebar names the theme and the chainring mark fills every assistant circle inside the wrapper alone @c2c3ffc6](../../examples/chat-demo/tests/theming.spec.ts#L422),
[wrapper@4b44133d](../../examples/chat-demo/src/App.tsx#L241),
[avatar@2e840c2c](../../examples/chat-demo/src/App.tsx#L210),
[mark@39bde1a8](../../examples/chat-demo/src/themes.tsx#L25)). The Overview page
(`?view=docs&component=overview`) gains a Theming section that renders `ChatMessage`,
`ChatComposer` and `ConversationList` twice from one preview component,
`data-theming-preview="default"` beside `data-theming-preview="custom"` (the issue's "shows both
side by side"), so the two columns cannot drift apart
([validated by the two previews render the same send button in different colours @188283df](../../examples/chat-demo/tests/theming.spec.ts#L447),
[preview@367ab118](../../examples/chat-demo/src/docs/ThemingSection.tsx#L24)).

The override lives in `examples/chat-demo/src/custom-theme.css`, which sets all fifty-three tokens
under `.custom-theme` (scoped to the wrapper, not `:root`) and is imported from `main.tsx` after
`./styles.css`, whose three documented lines are untouched; the themed screen takes its colours
from that wrapper alone
([validated by @e80fded2](../../examples/chat-demo/tests/theming.spec.ts#L366),
[stylesheet@c6f34e6b](../../examples/chat-demo/src/custom-theme.css#L5),
[import@f79ecfa2](../../examples/chat-demo/src/main.tsx#L5)). The wrapper scope is what lets one document
show the default and the themed look side by side, and it is the fallback rule (decision 1 in
docs/design-notes.md § Theming) doing its job: the package declares nothing, so an override on
any wrapper wins on inheritance alone, with no cascade-order fight against `dist/styles.css`
([validated by the two previews render the same send button in different colours @188283df](../../examples/chat-demo/tests/theming.spec.ts#L447)). The demo commits touched
nothing under the library's `src/` - the one statement in this section with no executable
anchor: its proof is the diff itself, reviewable but not re-runnable.

The neutral roles ride the same wrapper: the composer's frame resolves to the palette's white
surface and slate-200 border on the default screen and to Copperline's warm surface and border
on the themed one ([validated by @21e6982a](../../examples/chat-demo/tests/theming.spec.ts#L119),
[runs@e80fded2](../../examples/chat-demo/tests/theming.spec.ts#L366)).

An unknown `theme` value falls back to the default: `resolveTheme` reads a `Map`, not a record,
so a prototype name such as `constructor` cannot resolve to a function, and `?theme=constructor`
renders the Marginalia Books sidebar with no theme mark
([validated by a prototype name as the theme value still resolves to the default theme @433d7408](../../examples/chat-demo/tests/theming.spec.ts#L436)). The unthemed
`?view=chat` screen renders no wrapper and no mark, so the existing chat and docs suites drive
markup identical to what they drove before the theme dimension existed
([validated by the sidebar names the theme and the chainring mark fills every assistant circle inside the wrapper alone @c2c3ffc6](../../examples/chat-demo/tests/theming.spec.ts#L422)).

### The browser proof

`examples/chat-demo/tests/theming.spec.ts` executed green on 2026-09-23 against the packed
tarball via `npm run consumer`, in Chromium and WebKit alike since issue 200 (214 passed across
the chat, docs and theming suites in both projects, exit 0); the link target is the whole file
([validated by @5f5d5193](../../examples/chat-demo/tests/theming.spec.ts#L1)). Every colour is read through
`getComputedStyle` and never compared to a pinned oklch string: `tests/helpers/colors.ts` paints
a probe element with the expected value - the palette variable a default falls back to
(`var(--color-blue-500)`, ...) or the wrapper's own value - guards a variable probe against
resolving transparent, and the token site must serialise identically, so a Tailwind release that
changes how an engine serialises a palette colour cannot fail the suite, and a consumer build
that stops emitting the variable into `:root` cannot pass it vacuously
([validated by @8f62a2ad](../../examples/chat-demo/tests/helpers/colors.ts#L35)). Every read polls: the
interaction-gated sites carry `transition-colors`, and a one-shot read after a hover or a click
catches the mid-fade colour ([validated by @5e54a9e6](../../examples/chat-demo/tests/helpers/tokens.ts#L88)).

The suite is a matrix, not a list of hand-picked sites. `tests/helpers/tokens.ts` reads the
expected values from the stylesheets themselves - the declaration block of the installed
`dist/styles.css` for the defaults, `src/custom-theme.css` for the wrapper - so neither can drift
from the test ([validated by @f8440f2d](../../examples/chat-demo/tests/helpers/tokens.ts#L31),
[wrapper@dcb2ac0b](../../examples/chat-demo/tests/helpers/tokens.ts#L36)), and
`theming.spec.ts` runs six site groups on the chat screen under four runs: the default theme and
the Copperline wrapper, each under the light and the dark colour scheme
([validated by @e80fded2](../../examples/chat-demo/tests/theming.spec.ts#L366)). Under the dark scheme a
site's expected value is the `-dark` twin where one is declared, and the twin is also asserted
to differ from the light shade, so a `dark:` variant that silently stopped applying cannot pass
([validated by @36cbf364](../../examples/chat-demo/tests/helpers/tokens.ts#L98)).

- At rest: the active row's `--bowman-active`, the composer frame's `--bowman-surface` and
  `--bowman-border`, the composer text's `--bowman-text-strong`, the sidebar brand row's
  `--bowman-text-body`, the inactive nav item's `--bowman-text-secondary`, the disclosure band's
  `--bowman-text-muted` and the copy button's `--bowman-text-subtle`
  ([validated by @21e6982a](../../examples/chat-demo/tests/theming.spec.ts#L119)).
- The send button: `--bowman-active` and `--bowman-text-subtle` while disabled, `--bowman-accent`
  and `--bowman-text-on-accent` once a draft enables it, `--bowman-accent-hover` under the pointer
  ([validated by @53e0e44d](../../examples/chat-demo/tests/theming.spec.ts#L170)).
- Hovered: the inactive row's `--bowman-surface-hover`, the copy button's `--bowman-control-hover`
  and its promotion to `--bowman-text-secondary`, the delete button's `--bowman-danger`
  ([validated by @78d75ca6](../../examples/chat-demo/tests/theming.spec.ts#L207)).
- Focused: the row link's ring carries `--bowman-focus-ring` and its offset `--bowman-ring-offset`
  in the `box-shadow` list, and the composer frame's `--bowman-accent-glow`
  ([validated by @7651fef3](../../examples/chat-demo/tests/theming.spec.ts#L240)).
- Streaming: after a send, the avatar circle's `--bowman-accent-border` and `--bowman-accent-soft`,
  then the `bowman-pulse-subtle` keyframe paused at its 50% stop through the Web Animations API,
  where its outline is `--bowman-pulse-outline` and its shadow `--bowman-accent-glow`
  ([validated by @183b3f91](../../examples/chat-demo/tests/theming.spec.ts#L263)).
- Selected: the thumbs-up's `--bowman-success` and `--bowman-success-soft`, the thumbs-down's
  `--bowman-danger` and `--bowman-danger-soft`, the copied check mark's `--bowman-success`
  ([validated by @0c317e8a](../../examples/chat-demo/tests/theming.spec.ts#L295)).
- The sidebar names the theme, and the chainring mark fills one avatar circle per assistant entry
  inside the wrapper and none outside it
  ([validated by the sidebar names the theme and the chainring mark fills every assistant circle inside the wrapper alone @c2c3ffc6](../../examples/chat-demo/tests/theming.spec.ts#L422)).
- On the Overview page both previews render exactly once; the default preview's send button
  equals the `--color-blue-500` probe, the custom preview's is the wrapper's `--bowman-accent`,
  the two differ, and only the custom preview carries the mark
  ([validated by the two previews render the same send button in different colours @188283df](../../examples/chat-demo/tests/theming.spec.ts#L447)).
- The previews' entry streams forever, so their circles need no polling window: the default
  circle's border and background equal the `--color-blue-200` and `--color-blue-50` probes, the
  custom circle's the wrapper's `--bowman-accent-border` and `--bowman-accent-soft`
  ([validated by the two previews' streaming circles take their border and surface from the tokens @faf02c4a](../../examples/chat-demo/tests/theming.spec.ts#L475)).

A guard test sums the tokens the six groups reach - each light token and the `-dark` twin the
dark runs measure - and asserts the set equals the installed declaration block, and that the wrapper sets exactly
the declared names: every declared token is measured in a browser, on both themes and under
both schemes, and the docs suite adds the danger family on
the error boundary's icon, the thinking dots, the search field and every text tier at a
documentation site the chat has none of
([validated by the chat matrix reaches every token the installed stylesheet declares, and the wrapper sets the same set @f1493a6e](../../examples/chat-demo/tests/theming.spec.ts#L401),
[docs@0d7fff9a](../../examples/chat-demo/tests/docs.spec.ts#L268)).
