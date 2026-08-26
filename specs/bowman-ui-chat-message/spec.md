# bowman-ui chat message

Issue: issue 73 (`023-bowman-ui-chat-message`)

`ChatMessage` renders one turn of a conversation - streaming or finished,
markdown, a tool-status row, a copy button, thumbs, an avatar - as
`src/components/ChatMessage.tsx` (`ChatMessage`, private
`UserMessage`/`AssistantMessage`, `ChatMessageLabels`,
`defaultChatMessageLabels`). `src/components/InlineThinkingIndicator.tsx` is
the streaming placeholder lifted from the source app's
`ThinkingIndicator.tsx:44-64`; it moves here because its only call site is
inside `ChatMessage`
([validated by](../../tests/InlineThinkingIndicator.test.tsx#L5)).
No file in `discovery` changes.

## The public surface

`ChatMessageProps` is exactly the nine fields the issue names - `entry`,
`userInitials`, `assistantAvatar`, `showFeedback` (default `true`),
`arrowKeyFeedback` (default `false`), `footer`, `labels`, `onCopy`,
`onFeedback` - with `showDevInfo`, `conversationId`, `onRetryJudge` and
`scores` gone ([validated by](../../tests/ChatMessage.test.tsx#L543)).
`defaultChatMessageLabels` is a frozen `Readonly<Required<ChatMessageLabels>>`
over the nine keys `userMessage`, `assistantMessage`, `copy`, `copied`,
`copiedNotice`, `feedbackPositive`, `feedbackNegative`, `feedbackNotice`,
`thinking`; a key added without a default fails the build, pinned from outside
by an `@ts-expect-error` fixture
([validated by](../../tests/types/chat-message-type-assertions.tsx#L54),
compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L55)).
**Amended by 076:** `ChatMessageProps` gained a tenth field,
`markdown?: MarkdownPolicy`, and `ChatMessageLabels` a tenth key,
`linkOpensInNewTab`; markdown renders through `createMarkdownComponents`
rather than 019's constant (see
`specs/bowman-ui-markdown-link-policy/spec.md`).

## The four decisions

1. **Two roles only, no silent drop.** `entry` is
   `UserChatEntry | AssistantChatEntry`; a `ThinkingChatEntry` and a
   `ToolChatEntry` each fail to typecheck, so tool arguments cannot reach a
   customer's screen by accident
   ([validated by](../../tests/types/chat-message-type-assertions.tsx#L45),
   compiled by [chat-message-dist](../../tests/chat-message-dist.test.ts#L55)).
2. **Arrow-key feedback is opt-in; `Cmd/Ctrl+C` stays on.** `arrowKeyFeedback`
   defaults to `false`: `ArrowUp` on a focused assistant message calls
   `onFeedback` zero times and does not `preventDefault`
   ([validated by](../../tests/ChatMessage.test.tsx#L191)); enabled, the
   shortcuts work as before
   ([validated by](../../tests/ChatMessage.test.tsx#L201),
   [L226](../../tests/ChatMessage.test.tsx#L226)). Copy stays unconditional
   with its selection guard
   ([validated by](../../tests/ChatMessage.test.tsx#L124),
   [L166](../../tests/ChatMessage.test.tsx#L166)). The default labels follow:
   `assistantMessage` is plain `"Assistant response"`
   ([validated by](../../tests/ChatMessage.test.tsx#L58)) and the thumb labels
   drop their shortcut parentheticals
   ([validated by](../../tests/ChatMessage.test.tsx#L64)).
3. **`showFeedback` gates the keyboard path too.** Arrow handling fires only
   behind `showFeedback && arrowKeyFeedback`; with `showFeedback={false}` and
   `arrowKeyFeedback`, `ArrowUp` calls nothing and no thumb renders - removing
   the `showFeedback` term from the handler fails the test
   ([validated by](../../tests/ChatMessage.test.tsx#L238)).
4. **The render-phase latch stays, keyed per `entry.id`.** Once content or
   tool status has appeared the indicator never returns for that id
   ([validated by](../../tests/ChatMessage.test.tsx#L326)); a rerender with a
   different id, streaming and empty, shows it again - removing the id reset
   fails the test ([validated by](../../tests/ChatMessage.test.tsx#L340)).

## The 015 characterization suite, ported

Every assertion in 015's `ChatMessage` block passes against the extracted
component after label substitution (`tests/ChatMessage.test.tsx`), except the
adaptations below.

| #   | Adaptation                                                                                                                                                                                               | Reason                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| a   | The two arrow-key feedback tests pass `arrowKeyFeedback` and assert the parenthetical-free thumb labels ([L201](../../tests/ChatMessage.test.tsx#L201), [L226](../../tests/ChatMessage.test.tsx#L226))   | Decision 2: the shortcuts are opt-in and the default labels no longer mention them              |
| b   | New default-off test: `ArrowUp` with default props calls `onFeedback` zero times and does not `preventDefault` (asserted via `fireEvent`'s return value) ([L191](../../tests/ChatMessage.test.tsx#L191)) | Decision 2: the library default must not steal a keyboard user's scroll keys                    |
| c   | New test: `arrowKeyFeedback` + `showFeedback={false}` fires nothing and renders no thumbs ([L238](../../tests/ChatMessage.test.tsx#L238))                                                                | Decision 3: in the source, the handler never read `showFeedback`                                |
| d   | The latch test gains a second direction: a new `entry.id`, streaming and empty, shows the indicator again ([L340](../../tests/ChatMessage.test.tsx#L340))                                                | Decision 4: the source's module-lifetime ref masked the bug because the app keys its list by id |
| e   | The streaming no-key-handling test passes `arrowKeyFeedback` ([L270](../../tests/ChatMessage.test.tsx#L335))                                                                                             | It must still exercise the `isStreaming` gate now that arrows are off by default                |

Dropped, with no counterpart here: the three judge/dev-info tests (judge
scores network I/O off and on, `DevInfoCollapsible`/`MessageScores` mount) -
`showDevInfo`, `conversationId`, `useJudgeScoring` and both harness components
stayed in the source app; their slot collapses into `footer`.

One rename inherited from 019 rather than adapted here: the streaming avatar
circle carries `bowman-pulse-subtle`, not the issue text's
`animate-pulse-subtle`
([validated by](../../tests/ChatMessage.test.tsx#L455)), because 019 shipped
every package animation class under the `bowman-` prefix (its spec: names
"cannot collide with a consumer's own `animate-*` utilities")
([validated by](../../tests/ChatMessage.test.tsx#L448)). That is the
same rename the confirmation spans (`bowman-fade-in`,
[validated by](../../tests/ChatMessage.test.tsx#L535)) and the indicator dots
(`bowman-fade-dot`,
[validated by](../../tests/InlineThinkingIndicator.test.tsx#L19)) received.
The tool-status row keeps `animate-spin` unchanged
([validated by](../../tests/ChatMessage.test.tsx#L362)): that is a Tailwind
core utility generated by the consumer's build, not a package keyframe.

## Carried across mechanically

- Markdown renders through 019's `markdownComponents` map with `remarkGfm`;
  no `prose` class anywhere in `src/`
  ([validated by](../../tests/ChatMessage.test.tsx#L83),
  [L96](../../tests/ChatMessage.test.tsx#L96),
  [L570](../../tests/ChatMessage.test.tsx#L570)).
- Raw HTML in `entry.content` stays escaped text; `rehype-raw` appears in no
  `package.json` field and no `rehypePlugins` prop is passed - the one
  security property the extraction must not lose (C-18)
  ([validated by](../../tests/ChatMessage.test.tsx#L110),
  [L554](../../tests/ChatMessage.test.tsx#L554),
  [manifest](../../tests/chat-message-dist.test.ts#L97)).
- The avatar circle takes `assistantAvatar` in place of the hardcoded logo and
  renders empty without it - no bundled mark (018 decision 3)
  ([validated by](../../tests/ChatMessage.test.tsx#L435),
  [L410](../../tests/ChatMessage.test.tsx#L445)).
- `footer` collapses the two dev-harness slots into one `ReactNode` rendered
  last in the message column, streaming or not
  ([validated by](../../tests/ChatMessage.test.tsx#L475),
  [L485](../../tests/ChatMessage.test.tsx#L485),
  [L497](../../tests/ChatMessage.test.tsx#L497)).
- The four icons come from 020's set via relative `.js` imports; no `@clerk`,
  `swr`, `next-intl`, `next/`, `@discovery` or `@/` import survives
  ([validated by](../../tests/ChatMessage.test.tsx#L547)); `"Discovery"`
  appears nowhere in `src/` or `dist/`
  ([validated by](../../tests/ChatMessage.test.tsx#L570)).
- Both files carry `"use client"` as the first statement of their `dist/`
  output, per 018 decision 1's positional check and
  `scripts/check-client-directives.mjs`
  ([validated by](../../tests/chat-message-dist.test.ts#L34)).
- `navigator.clipboard` is optional-chained: an insecure-context browser is a
  supported consumer environment - `Cmd+C` with `navigator.clipboard`
  undefined does not throw and still calls `onCopy`
  ([validated by](../../tests/ChatMessage.test.tsx#L178)). The 2000ms
  `copiedNotice` timeout is pinned under fake timers
  ([validated by](../../tests/ChatMessage.test.tsx#L124)).

## Recorded decisions

- **`InlineThinkingIndicator` takes `labels`, not a bare `label` string.** The
  source component took `label?: string`; here it takes
  `labels?: Partial<InlineThinkingIndicatorLabels>` with
  `defaultInlineThinkingIndicatorLabels` (`{ thinking: "Thinking" }`), so it
  lands in the `labelsProp` partition bucket like every string-carrying
  export (CONTRACT.md § Labels decision 2 - the two `stringPropOnly` shapes
  are grandfathered, not precedent)
  ([validated by](../../tests/InlineThinkingIndicator.test.tsx#L5),
  [partition](../../tests/labelled-exports.test.tsx#L35)). `ChatMessage`
  forwards its resolved `thinking` slice, the flat-union forwarding of
  decision 3 ([validated by](../../tests/InlineThinkingIndicator.test.tsx#L12)).
- **Sentinel harness content.** 022's sentinel test covers both components;
  `ChatMessage`'s harness renders a user, an assistant and a streaming entry
  with `userInitials="LM"` (015's precedent) and the content string
  `"4711 – ok"`, which carries no run of three Latin letters - so the
  Latin-run check needs no extra strip entry for user-shaped text. The
  harness clicks copy and thumbs-up so the interaction-only labels
  (`copied`, `copiedNotice`, `feedbackNotice`) render into the checked DOM
  ([validated by](../../tests/labelled-exports.test.tsx#L243)).
- **GDPR enforcement is a source grep plus a suite-wide console trap.**
  `entry.content` may carry booking identifiers and names
  (`003-support-conversation-data-flow-record`). Neither component references
  `console.`, `localStorage`, `sessionStorage`, `fetch` or `sendBeacon`
  ([validated by](../../tests/ChatMessage.test.tsx#L564)), and
  `tests/setup.ts` wraps `console.error`/`console.warn` in a
  `beforeEach`/`afterEach` pair that records and swallows calls, failing any
  test in the whole suite that triggered one. Plain wrappers, not `vi.spyOn`,
  so a test file's own `vi.restoreAllMocks()` cannot erase the evidence
  before the setup-level `afterEach` (which runs last) asserts zero calls.
  The only egress of `content` is the user-initiated
  `navigator.clipboard.writeText` - the single documented exception
  ([validated by](../../tests/ChatMessage.test.tsx#L593)).
- **`react-markdown` and `remark-gfm` become runtime dependencies** at the
  majors the source app runs (`^10.1.0`, `^4.0.1`), moved out of
  devDependencies; 019's zero-runtime-deps claim carries a supersession note
  in its spec ([validated by](../../tests/chat-message-dist.test.ts#L88)).
