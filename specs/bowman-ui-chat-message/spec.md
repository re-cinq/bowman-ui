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
([validated by](../../tests/ChatMessage.test.tsx#L717)).

`defaultChatMessageLabels` is a frozen `Readonly<Required<ChatMessageLabels>>`
that began over the nine keys `userMessage`, `assistantMessage`, `copy`,
`copied`, `copiedNotice`, `feedbackPositive`, `feedbackNegative`,
`feedbackNotice`, `thinking`; a key added without a default fails the build,
pinned from outside by an `@ts-expect-error` fixture
([validated by](../../tests/types/chat-message-type-assertions.tsx#L60),
compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L22)).

**Amended by 076:** `ChatMessageProps` gained a tenth field,
`markdown?: MarkdownPolicy`, and `ChatMessageLabels` a tenth key,
`linkOpensInNewTab`; markdown renders through `createMarkdownComponents`
rather than 019's constant (see
`specs/bowman-ui-markdown-link-policy/spec.md`)
([validated by](../../tests/ChatMessage.test.tsx#L787),
[L812](../../tests/ChatMessage.test.tsx#L812),
compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L22)).

**Amended by 121:** `ChatMessageProps` gained an eleventh field,
`assistantName?: string`, and `ChatMessageLabels` an eleventh key, the
function-form `assistantMessageFrom: (name: string) => string`, which names
the article once `assistantName` is set - eleven fields and eleven keys
today (see `specs/bowman-ui-entry-attribution/spec.md`)
([validated by](../../tests/ChatMessage.test.tsx#L547),
[L584](../../tests/ChatMessage.test.tsx#L584)).

## The four decisions

1. **Two roles only, no silent drop.** `entry` is
   `UserChatEntry | AssistantChatEntry`; a `ThinkingChatEntry` and a
   `ToolChatEntry` each fail to typecheck, so tool arguments cannot reach a
   customer's screen by accident
   ([validated by](../../tests/types/chat-message-type-assertions.tsx#L51),
   compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L22)).
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
   ([validated by](../../tests/ChatMessage.test.tsx#L257),
   [L268](../../tests/ChatMessage.test.tsx#L268),
   [L278](../../tests/ChatMessage.test.tsx#L278),
   [L287](../../tests/ChatMessage.test.tsx#L287),
   [L160](../../tests/ChatMessage.test.tsx#L160),
   [L202](../../tests/ChatMessage.test.tsx#L202),
   [L92](../../tests/ChatMessage.test.tsx#L92),
   [L98](../../tests/ChatMessage.test.tsx#L98)).
3. **`showFeedback` gates the keyboard path too.** Arrow handling fires only
   behind `showFeedback && arrowKeyFeedback`; with `showFeedback={false}` and
   `arrowKeyFeedback`, `ArrowUp` calls nothing and no thumb renders - removing
   the `showFeedback` term from the handler fails the test
   ([validated by](../../tests/ChatMessage.test.tsx#L297)).
4. **The render-phase latch stays, keyed per `entry.id`.** Once content or
   tool status has appeared the indicator never returns for that id; a
   rerender with a different id, streaming and empty, shows it again -
   removing the id reset fails the test
   ([validated by](../../tests/ChatMessage.test.tsx#L357),
   [L378](../../tests/ChatMessage.test.tsx#L378)).

## The characterization suite

The `ChatMessage` block in `tests/ChatMessage.test.tsx` pins the
component's behaviour; every string arrives through the labels convention,
and the deliberate decisions below each carry their own test.

| #   | Decision                                                                                                                                                                                                 | Reason                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| a   | The two arrow-key feedback tests pass `arrowKeyFeedback` and assert the parenthetical-free thumb labels ([L268](../../tests/ChatMessage.test.tsx#L268), [L287](../../tests/ChatMessage.test.tsx#L287))   | Decision 2: the shortcuts are opt-in and the default labels no longer mention them              |
| b   | New default-off test: `ArrowUp` with default props calls `onFeedback` zero times and does not `preventDefault` (asserted via `fireEvent`'s return value) ([L257](../../tests/ChatMessage.test.tsx#L257)) | Decision 2: the library default must not steal a keyboard user's scroll keys                    |
| c   | `arrowKeyFeedback` + `showFeedback={false}` fires nothing and renders no thumbs ([L297](../../tests/ChatMessage.test.tsx#L297))                                                                          | Decision 3: the keyboard handler must respect `showFeedback` like the visible thumbs do         |
| d   | The latch test runs both directions: a new `entry.id`, streaming and empty, shows the indicator again ([L378](../../tests/ChatMessage.test.tsx#L378))                                                    | Decision 4: a module-lifetime latch would mask the bug in any consumer that keys its list by id |
| e   | The streaming no-key-handling test passes `arrowKeyFeedback` ([L327](../../tests/ChatMessage.test.tsx#L327))                                                                                             | It must still exercise the `isStreaming` gate now that arrows are off by default                |

Out of scope by design: no judge-score or dev-info surface ships -
`showDevInfo`, `conversationId`, judge-scoring hooks and their harness
components belong to a consumer; their slot collapses into `footer`.

One naming rule from 019: the streaming avatar
circle carries `bowman-pulse-subtle`, never a bare
`animate-pulse-subtle`, because 019 shipped
every package animation class under the `bowman-` prefix (its spec: names
"cannot collide with a consumer's own `animate-*` utilities")
([validated by](../../tests/ChatMessage.test.tsx#L465),
[keyframes](../../tests/styles.test.ts#L31)). That is the
same rename the confirmation spans (`bowman-fade-in`) and the indicator dots
(`bowman-fade-dot`) received
([validated by](../../tests/ChatMessage.test.tsx#L659),
[dots](../../tests/InlineThinkingIndicator.test.tsx#L19)).
The tool-status row keeps `animate-spin` unchanged: that is a Tailwind
core utility generated by the consumer's build, not a package keyframe
([validated by](../../tests/ChatMessage.test.tsx#L344)).

## Mechanical invariants

- Markdown renders through 076's `createMarkdownComponents` map with
  `remarkGfm`; no `prose` class anywhere in `src/`
  ([validated by](../../tests/ChatMessage.test.tsx#L117),
  [L131](../../tests/ChatMessage.test.tsx#L131),
  [L739](../../tests/ChatMessage.test.tsx#L739)).
- Raw HTML in `entry.content` stays escaped text; `rehype-raw` appears in no
  `package.json` field and no `rehypePlugins` prop is passed - the one
  security property this component must never lose (C-18)
  ([validated by](../../tests/ChatMessage.test.tsx#L146),
  [L727](../../tests/ChatMessage.test.tsx#L727),
  [manifest](../../tests/chat-message-dist.test.ts#L65)).
- The avatar circle takes `assistantAvatar` in place of the hardcoded logo and
  renders empty without it - no bundled mark (018 decision 3)
  ([validated by](../../tests/ChatMessage.test.tsx#L444),
  [L456](../../tests/ChatMessage.test.tsx#L456)).
- The action row under a committed assistant entry is `opacity-0` until the pointer
  hovers the article or focus enters it (`group-hover` / `group-focus-within`), and no
  jsdom test can see that: measured in Chromium, the row's computed opacity is `0` at
  rest and `1` on hover or when the copy button takes focus (issue 151)
  ([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L489)).
- The selected thumbs-down reads the danger role - `--bowman-danger` text on the
  `--bowman-danger-soft` surface - rather than the `red-*` palette classes, so the
  negative-feedback state re-themes with the consumer's danger colour (§ Theming decision 6)
  ([validated by](../../tests/ChatMessage.test.tsx#L501)).
- Long unbroken strings wrap: the user bubble and the assistant prose
  container both carry `break-words` (`overflow-wrap: break-word`), so a
  pasted 300-character token stays inside the user bubble and inside the
  assistant column instead of escaping horizontally; the browser test sends
  such a token through the demo composer and measures the user article
  (issue 132)
  ([validated by](../../tests/ChatMessage.test.tsx#L839),
  [L845](../../tests/ChatMessage.test.tsx#L845),
  [browser](../../examples/chat-demo/tests/chat-demo.spec.ts#L369)).
- `footer` collapses the two dev-harness slots into one `ReactNode` rendered
  last in the message column, streaming or not
  ([validated by](../../tests/ChatMessage.test.tsx#L625),
  [L636](../../tests/ChatMessage.test.tsx#L636),
  [L648](../../tests/ChatMessage.test.tsx#L648)).
- The four icons come from 020's set via relative `.js` imports; no `@clerk`,
  `swr`, `next-intl`, `next/` or `@/` import survives
  ([validated by](../../tests/ChatMessage.test.tsx#L721)).
- Both files carry `"use client"` as the first statement of their `dist/`
  output, per 018 decision 1's positional check and
  `scripts/check-client-directives.mjs`
  ([validated by](../../tests/chat-message-dist.test.ts#L12)).
- The copy chord is `Cmd/Ctrl+C` alone: Shift and Alt are excluded so the
  browser's inspect-element chord `Cmd+Shift+C` copies nothing, and the key
  is compared lowercased so `Cmd+C` under Caps Lock still copies
  ([validated by](../../tests/ChatMessage.test.tsx#L193),
  [L184](../../tests/ChatMessage.test.tsx#L184)).
- `navigator.clipboard` is optional-chained: an insecure-context browser is a
  supported consumer environment - `Cmd+C` with `navigator.clipboard`
  undefined does not throw and still calls `onCopy`, and a rejecting
  `writeText` (a permission denial) is swallowed while `onCopy` still fires
  ([validated by](../../tests/ChatMessage.test.tsx#L214),
  [L694](../../tests/ChatMessage.test.tsx#L694)).
- The 2000ms `copiedNotice` timeout is pinned under fake timers, and a rapid
  second copy replaces the pending timer so the notice lasts a full 2000ms
  from the second press
  ([validated by](../../tests/ChatMessage.test.tsx#L160),
  [L672](../../tests/ChatMessage.test.tsx#L672)).

## Recorded decisions

- **`InlineThinkingIndicator` takes `labels`, not a bare `label` string.** The
  source component took `label?: string`; here it takes
  `labels?: Partial<InlineThinkingIndicatorLabels>` with
  `defaultInlineThinkingIndicatorLabels` (`{ thinking: "Thinking" }`), so it
  lands in the `labelsProp` partition bucket like every string-carrying
  export (docs/design-notes.md § Labels decision 2 - the two `stringPropOnly` shapes
  are grandfathered, not precedent). `ChatMessage`
  forwards its resolved `thinking` slice, the flat-union forwarding of
  decision 3 ([validated by](../../tests/InlineThinkingIndicator.test.tsx#L25),
  [partition](../../tests/labelled-exports.test.tsx#L76),
  [L12](../../tests/InlineThinkingIndicator.test.tsx#L12)).
- **Sentinel harness content.** 022's sentinel test covers both components;
  `ChatMessage`'s harness renders a user, an assistant and a streaming entry
  with `userInitials="LM"` (015's precedent) and the content string
  `"4711 – ok"`, which carries no run of three Latin letters - so the
  Latin-run check needs no extra strip entry for user-shaped text. The
  harness clicks copy and thumbs-up so the interaction-only labels
  (`copied`, `copiedNotice`, `feedbackNotice`) render into the checked DOM
  ([validated by](../../tests/labelled-exports.test.tsx#L555),
  [harness](../../tests/labelled-exports.test.tsx#L324)).
- **The copied check and selected thumbs-up read the success theming role.**
  The check mark and the selected thumbs-up's text read `--bowman-success`, and the
  thumbs-up's fill reads `--bowman-success-soft` (docs/design-notes.md § Theming decision 6),
  so a consumer recolours both at once; adopting the role moves the check off its lone
  `green-500` onto the `green-600` / `green-400` the thumbs-up already used
  ([validated by](../../tests/ChatMessage.test.tsx#L529)).
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
  ([validated by](../../tests/ChatMessage.test.tsx#L733)).
- **`react-markdown` and `remark-gfm` are runtime dependencies** at
  `^10.1.0` and `^4.0.1`,
  not devDependencies; 019's zero-runtime-deps claim carries a supersession note
  in its spec ([validated by](../../tests/chat-message-dist.test.ts#L56)).
