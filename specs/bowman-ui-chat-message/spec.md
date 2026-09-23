# bowman-ui chat message

| Field  | Value                                   |
| ------ | --------------------------------------- |
| Issue  | issue 73 (`023-bowman-ui-chat-message`) |
| Status | In Progress                             |

`ChatMessage` renders one turn of a conversation - streaming or finished,
markdown, a tool-status row, a copy button, thumbs, an avatar - as
`src/components/ChatMessage.tsx` (`ChatMessage`, private
`UserMessage`/`AssistantMessage`, `ChatMessageLabels`,
`defaultChatMessageLabels`). `src/components/InlineThinkingIndicator.tsx` is
the streaming placeholder; it lives here, private, because its only call
site is
inside `ChatMessage`
([validated by](../../tests/InlineThinkingIndicator.test.tsx#L5)).

## The public surface

`ChatMessageProps` began as the nine fields the issue names - `entry`,
`userInitials`, `assistantAvatar`, `showFeedback` (default `true`),
`arrowKeyFeedback` (default `false`), `footer`, `labels`, `onCopy`,
`onFeedback` - with `showDevInfo`, `conversationId`, `onRetryJudge` and
`scores` gone
([validated by a rejecting clipboard write is swallowed and onCopy still fires](../../tests/ChatMessage.test.tsx#L717)).

`defaultChatMessageLabels` is a frozen `Readonly<Required<ChatMessageLabels>>`
that began over the nine keys `userMessage`, `assistantMessage`, `copy`,
`copied`, `copiedNotice`, `feedbackPositive`, `feedbackNegative`,
`feedbackNotice`, `thinking`; a key added without a default fails the build,
pinned from outside by an `@ts-expect-error` fixture
([validated by](../../tests/types/chat-message-type-assertions.tsx#L60),
compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L25)).

**Amended by 076:** `ChatMessageProps` gained a tenth field,
`markdown?: MarkdownPolicy`, and `ChatMessageLabels` a tenth key,
`linkOpensInNewTab`; markdown renders through `createMarkdownComponents`
rather than 019's constant (see
`specs/bowman-ui-markdown-link-policy/spec.md`)
([validated by an https link renders an anchor with target, the rel pair and the hidden notice](../../tests/ChatMessage.test.tsx#L787),
[validated by the markdown prop merges over defaultMarkdownPolicy, so an http opt-in renders the anchor](../../tests/ChatMessage.test.tsx#L812),
compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L25)).

**Amended by 121:** `ChatMessageProps` gained an eleventh field,
`assistantName?: string`, and `ChatMessageLabels` an eleventh key, the
function-form `assistantMessageFrom: (name: string) => string`, which names
the article once `assistantName` is set - eleven fields and eleven keys
today (see `specs/bowman-ui-entry-attribution/spec.md`)
([validated by the copied check and the selected thumbs-up read the success role, retiring the green literals](../../tests/ChatMessage.test.tsx#L547),
[validated by defaultChatMessageLabels.assistantMessageFrom is a function of one string](../../tests/ChatMessage.test.tsx#L600)).

## The four decisions

1. **Two roles only, no silent drop.** `entry` is
   `UserChatEntry | AssistantChatEntry`; a `ThinkingChatEntry` and a
   `ToolChatEntry` each fail to typecheck, so tool arguments cannot reach a
   customer's screen by accident
   ([validated by](../../tests/types/chat-message-type-assertions.tsx#L51),
   compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L25)).
2. **Arrow-key feedback is opt-in; `Cmd/Ctrl+C` stays on.** `arrowKeyFeedback`
   defaults to `false`: `ArrowUp` on a focused assistant message calls
   `onFeedback` zero times and does not `preventDefault`; enabled, the
   shortcuts work as before, and a modified arrow - any of Meta, Ctrl, Shift
   or Alt, Alt+ArrowUp pinned - calls `onFeedback` zero times; both thumbs
   carry `aria-pressed`, `true` on the selected one and `false` on the other,
   whichever path set it. Copy stays unconditional with its selection guard.
   The default labels follow:
   `assistantMessage` is plain `"Assistant response"` and the thumb labels
   drop their shortcut parentheticals
   ([validated by](../../tests/ChatMessage.test.tsx#L273),
   [L284](../../tests/ChatMessage.test.tsx#L284),
   [L278](../../tests/ChatMessage.test.tsx#L278),
   [L287](../../tests/ChatMessage.test.tsx#L287),
   [L160](../../tests/ChatMessage.test.tsx#L160),
   [validated by Cmd+C under Caps Lock - the key reports "C" - still copies](../../tests/ChatMessage.test.tsx#L202),
   [validated by an assistant entry's article aria-label is exactly "Assistant response" with no labels prop](../../tests/ChatMessage.test.tsx#L92),
   [validated by button aria-labels are "Copy message", "Good response" and "Bad response" without shortcut parentheticals](../../tests/ChatMessage.test.tsx#L98)).
3. **`showFeedback` gates the keyboard path too.** Arrow handling fires only
   behind `showFeedback && arrowKeyFeedback`; with `showFeedback={false}` and
   `arrowKeyFeedback`, `ArrowUp` calls nothing and no thumb renders - removing
   the `showFeedback` term from the handler fails the test
   ([validated by](../../tests/ChatMessage.test.tsx#L313)).
4. **The render-phase latch stays, keyed per `entry.id`.** Once content or
   tool status has appeared the indicator never returns for that id; a
   rerender with a different id, streaming and empty, shows it again -
   removing the id reset fails the test
   ([validated by streaming with empty content shows the inline thinking indicator; content removes it; emptying content again does not bring it back](../../tests/ChatMessage.test.tsx#L373),
   [L394](../../tests/ChatMessage.test.tsx#L394)).

## The characterization suite

The `ChatMessage` block in `tests/ChatMessage.test.tsx` pins the
component's behaviour; every string arrives through the labels convention,
and the deliberate decisions below each carry their own test.

| #   | Decision                                                                                                                                                                                                 | Reason                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| a   | The two arrow-key feedback tests pass `arrowKeyFeedback` and assert the parenthetical-free thumb labels ([L284](../../tests/ChatMessage.test.tsx#L284), [L303](../../tests/ChatMessage.test.tsx#L303))   | Decision 2: the shortcuts are opt-in and the default labels no longer mention them              |
| b   | New default-off test: `ArrowUp` with default props calls `onFeedback` zero times and does not `preventDefault` (asserted via `fireEvent`'s return value) ([L273](../../tests/ChatMessage.test.tsx#L273)) | Decision 2: the library default must not steal a keyboard user's scroll keys                    |
| c   | `arrowKeyFeedback` + `showFeedback={false}` fires nothing and renders no thumbs ([L313](../../tests/ChatMessage.test.tsx#L313))                                                                          | Decision 3: the keyboard handler must respect `showFeedback` like the visible thumbs do         |
| d   | The latch test runs both directions: a new `entry.id`, streaming and empty, shows the indicator again ([L394](../../tests/ChatMessage.test.tsx#L394))                                                    | Decision 4: a module-lifetime latch would mask the bug in any consumer that keys its list by id |
| e   | The streaming no-key-handling test passes `arrowKeyFeedback` ([L343](../../tests/ChatMessage.test.tsx#L343))                                                                                             | It must still exercise the `isStreaming` gate now that arrows are off by default                |

Out of scope by design: no judge-score or dev-info surface ships -
`showDevInfo`, `conversationId`, judge-scoring hooks and their harness
components belong to a consumer; their slot collapses into `footer`.

One naming rule from 019: the streaming avatar
circle carries `bowman-pulse-subtle`, never a bare
`animate-pulse-subtle`, because 019 shipped
every package animation class under the `bowman-` prefix (its spec: names
"cannot collide with a consumer's own `animate-*` utilities")
([validated by while isStreaming the circle carries bowman-pulse-subtle; not streaming it does not](../../tests/ChatMessage.test.tsx#L481),
[keyframes](../../tests/styles.test.ts#L32)). That is the
same rename the confirmation spans (`bowman-fade-in`) and the indicator dots
(`bowman-fade-dot`) received
([validated by the copy and feedback confirmation spans carry the bowman-fade-in class](../../tests/ChatMessage.test.tsx#L675),
[dots](../../tests/InlineThinkingIndicator.test.tsx#L19)).
The tool-status row keeps `animate-spin` unchanged: that is a Tailwind
core utility generated by the consumer's build, not a package keyframe
([validated by toolStatus "Henter booking" renders that text next to the animate-spin row](../../tests/ChatMessage.test.tsx#L360)).

## Mechanical invariants

- Markdown renders through 076's `createMarkdownComponents` map with
  `remarkGfm`; no `prose` class anywhere in `src/`
  ([validated by `**confirmado** renders a <strong> element carrying the bowman-md-strong class`](../../tests/ChatMessage.test.tsx#L117),
  [validated by `a GFM pipe table renders a <table> element carrying the bowman-md-table class`](../../tests/ChatMessage.test.tsx#L131),
  [L755](../../tests/ChatMessage.test.tsx#L755)).
- Raw HTML in `entry.content` stays escaped text; `rehype-raw` appears in no
  `package.json` field and no `rehypePlugins` prop is passed - the one
  security property this component must never lose (C-18)
  ([validated by](../../tests/ChatMessage.test.tsx#L146),
  [validated by neither file mentions rehype and no rehypePlugins prop is passed](../../tests/ChatMessage.test.tsx#L743),
  [manifest](../../tests/chat-message-dist.test.ts#L47)).
- A user entry's content never passes through ReactMarkdown: the bubble
  renders it as literal `whitespace-pre-wrap` text, so
  `"**Ver** pedido\n[4711](https://example.test)"` produces no `<strong>` and
  no `<a>` and keeps its newline - routing user content through markdown is a
  deliberate change, never drift
  ([validated by](../../tests/ChatMessage.test.tsx#L160)).
- The avatar circle takes `assistantAvatar` in place of the hardcoded logo and
  renders empty without it - no bundled mark (018 decision 3)
  ([validated by assistantAvatar renders inside the circle](../../tests/ChatMessage.test.tsx#L460),
  [validated by with no assistantAvatar the circle renders empty and no bundled mark appears](../../tests/ChatMessage.test.tsx#L472)).
- The action row under a committed assistant entry is `opacity-0` until the pointer
  hovers the article or focus enters it (`group-hover` / `group-focus-within`), and no
  jsdom test can see that: measured in Chromium and WebKit, the row's computed opacity is `0` at
  rest and `1` on hover or when the copy button takes focus (issue 151)
  ([validated by an assistant entry's action row is invisible at rest and revealed by hover or by focus](../../examples/chat-demo/tests/chat-demo.spec.ts#L538)).
- The selected thumbs-down reads the danger role - `--bowman-danger` text on the
  `--bowman-danger-soft` surface - rather than the `red-*` palette classes, so the
  negative-feedback state re-themes with the consumer's danger colour (§ Theming decision 6)
  ([validated by a selected thumbs-down reads the danger role's soft surface and text, not the red palette classes](../../tests/ChatMessage.test.tsx#L517)).
- Long unbroken strings wrap: the user bubble and the assistant prose
  container both carry `break-words` (`overflow-wrap: break-word`), so a
  pasted 300-character token stays inside the user bubble and inside the
  assistant column instead of escaping horizontally; the browser test sends
  such a token through the demo composer and measures the user article
  (issue 132)
  ([validated by the user bubble keeps whitespace-pre-wrap and carries break-words](../../tests/ChatMessage.test.tsx#L855),
  [validated by the assistant prose container keeps overflow-x-auto and carries break-words](../../tests/ChatMessage.test.tsx#L861),
  [browser](../../examples/chat-demo/tests/chat-demo.spec.ts#L403)).
- `footer` collapses the two dev-harness slots into one `ReactNode` rendered
  last in the message column, streaming or not
  ([validated by footer renders as the last child of the message column, after the action row, when not streaming](../../tests/ChatMessage.test.tsx#L641),
  [validated by footer renders as the last child of the message column while streaming](../../tests/ChatMessage.test.tsx#L652),
  [validated by with no footer, nothing renders after the action row](../../tests/ChatMessage.test.tsx#L664)).
- The four icons come from 020's set via relative `.js` imports; no `@clerk`,
  `swr`, `next-intl`, `next/` or `@/` import survives
  ([validated by neither file imports @clerk, swr, next-intl, next/, @/ or lucide-react and every relative import ends in .js](../../tests/ChatMessage.test.tsx#L737)).
- Both files carry `"use client"` as the first statement of their `dist/`
  output, per 018 decision 1's positional check and
  `scripts/check-client-directives.mjs`
  ([validated by each built chat message component opens with "use client"; as its first statement](../../tests/chat-message-dist.test.ts#L15)).
- The copy chord is `Cmd/Ctrl+C` alone: Shift and Alt are excluded so the
  browser's inspect-element chord `Cmd+Shift+C` copies nothing, and the key
  is compared lowercased so `Cmd+C` under Caps Lock still copies
  ([validated by Ctrl+C also copies the entry content](../../tests/ChatMessage.test.tsx#L193),
  [validated by Cmd+C under Caps Lock - the key reports "C" - still copies](../../tests/ChatMessage.test.tsx#L200)).
- `navigator.clipboard` is optional-chained: an insecure-context browser is a
  supported consumer environment - `Cmd+C` with `navigator.clipboard`
  undefined does not throw and still calls `onCopy`, and a rejecting
  `writeText` (a permission denial) is swallowed while `onCopy` still fires
  ([validated by Cmd+C with navigator.clipboard undefined does not throw and still calls onCopy](../../tests/ChatMessage.test.tsx#L230),
  [validated by a rapid second copy keeps the notice for a full 2000ms from the second press](../../tests/ChatMessage.test.tsx#L694)).
- The 2000ms `copiedNotice` timeout is pinned under fake timers, and a rapid
  second copy replaces the pending timer so the notice lasts a full 2000ms
  from the second press
  ([validated by](../../tests/ChatMessage.test.tsx#L160),
  [validated by a rapid second copy keeps the notice for a full 2000ms from the second press](../../tests/ChatMessage.test.tsx#L688)).

## Recorded decisions

- **`InlineThinkingIndicator` takes `labels`, not a bare `label` string.** The
  source component took `label?: string`; here it takes
  `labels?: Partial<InlineThinkingIndicatorLabels>` with
  `defaultInlineThinkingIndicatorLabels` (`{ thinking: "Thinking" }`), so it
  lands in the `labelsProp` partition bucket like every string-carrying
  export (docs/design-notes.md § Labels decision 2 - the three `stringPropOnly` shapes
  are grandfathered, not precedent). `ChatMessage`
  forwards its resolved `thinking` slice, the flat-union forwarding of
  decision 3 ([validated by defaultInlineThinkingIndicatorLabels is frozen and holds exactly { thinking: "Thinking" }](../../tests/InlineThinkingIndicator.test.tsx#L25),
  [partition](../../tests/labelled-exports.test.tsx#L76),
  [validated by labels.thinking overrides the default](../../tests/InlineThinkingIndicator.test.tsx#L12)).
- **Sentinel harness content.** 022's sentinel test covers both components;
  `ChatMessage`'s harness renders a user, an assistant and a streaming entry
  with `userInitials="LM"` (015's precedent) and the content string
  `"4711 – ok"`, which carries no run of three Latin letters - so the
  Latin-run check needs no extra strip entry for user-shaped text. The
  harness clicks copy and thumbs-up so the interaction-only labels
  (`copied`, `copiedNotice`, `feedbackNotice`) render into the checked DOM
  ([validated by ChatMessage's sentinel labels cover every defaultChatMessageLabels key](../../tests/labelled-exports.test.tsx#L556),
  [harness](../../tests/labelled-exports.test.tsx#L325)).
- **The copied check and selected thumbs-up read the success theming role.**
  The check mark and the selected thumbs-up's text read `--bowman-success`, and the
  thumbs-up's fill reads `--bowman-success-soft` (docs/design-notes.md § Theming decision 6),
  so a consumer recolours both at once; adopting the role moves the check off its lone
  `green-500` onto the `green-600` / `green-400` the thumbs-up already used
  ([validated by the copied check and the selected thumbs-up read the success role, retiring the green literals](../../tests/ChatMessage.test.tsx#L545)).
- **GDPR enforcement is a source grep plus a suite-wide console trap.**
  `entry.content` may carry booking identifiers and names
  (`003-support-conversation-data-flow-record`). Neither component references
  `console.`, `localStorage`, `sessionStorage`, `fetch` or `sendBeacon`, and
  `tests/setup.ts` wraps `console.error`/`console.warn` in a
  `beforeEach`/`afterEach` pair that records and swallows calls, failing any
  test in the whole suite that triggered one. Plain wrappers, not `vi.spyOn`,
  so a test file's own `vi.restoreAllMocks()` cannot erase the evidence
  before the setup-level `afterEach` (which runs last) asserts zero calls.
  The only egress of `content` is the user-initiated
  `navigator.clipboard.writeText` - the single documented exception
  ([validated by `GDPR: neither file calls console.*, localStorage, sessionStorage, fetch or sendBeacon`](../../tests/ChatMessage.test.tsx#L749)).
- **`react-markdown` and `remark-gfm` are runtime dependencies** at
  `^10.1.0` and `^4.0.1`,
  not devDependencies; 019's zero-runtime-deps claim carries a supersession note
  in its spec ([validated by react-markdown 10 and remark-gfm 4 are runtime dependencies and no longer devDependencies](../../tests/chat-message-dist.test.ts#L38)).
