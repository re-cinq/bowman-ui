# bowman-ui thinking trace

Issue: re-cinq/Otto#109 (`087-bowman-ui-thinking-trace`), part of re-cinq/Otto#57.

`ThinkingTrace` renders a `ThinkingChatEntry` - the model's own internal
reasoning - shipped as `src/components/ThinkingTrace.tsx` (`ThinkingTrace`,
`ThinkingTraceProps`, `ThinkingTraceLabels`, `defaultThinkingTraceLabels`) and
exported from `src/index.ts`
([validated by](../../tests/ThinkingTrace.test.tsx#L165)). It is the fourth and
last of HAL's entry roles to get a renderer: `086` widened the message list to
three roles and left a `@ts-expect-error` pinning the fourth as rejected, and
this issue deletes it. HAL produces these entries by parsing literal
`<thinking>` tags out of the model's own output, so whether any appear is
decided by the system prompt rather than the model vendor.

This is not `024`'s `ThinkingIndicator`, which renders no entry at all (an
avatar, "Thinking", three fading dots, mounted while `busy` is true).
`ThinkingTrace` renders a persisted entry's `content`. The two share the
internal `ThinkingDots` component, imported and never re-exported
([validated by](../../tests/ThinkingTrace.test.tsx#L165)).

## The public surface

`ThinkingTraceProps` carries `entry`, `reducedMotion` and `labels` - and
nothing else. `ThinkingTraceLabels` is one key, `thinkingTrace` (the
`<summary>` text, `"Reasoning"`), with `defaultThinkingTraceLabels` frozen over
the single English string
([validated by](../../tests/ThinkingTrace.test.tsx#L122)), resolved per key by
the convention's `resolveLabels`
([validated by](../../tests/ThinkingTrace.test.tsx#L115)).

## The decisions

1. **Collapsed, and it never opens itself.** The content sits behind a native
   `<details>`/`<summary>` closed by default, whose summary is exactly the
   label ([validated by](../../tests/ThinkingTrace.test.tsx#L31)) and carries
   no word of the content as a preview
   ([validated by](../../tests/ThinkingTrace.test.tsx#L40)). Expanding reveals
   the full content string
   ([validated by](../../tests/ThinkingTrace.test.tsx#L52)). No prop and no
   entry state sets `open`: neither `isStreaming` value does
   ([validated by](../../tests/ThinkingTrace.test.tsx#L81),
   [resting](../../tests/ThinkingTrace.test.tsx#L91)), and the source assigns
   the attribute nowhere
   ([validated by](../../tests/ThinkingTrace.test.tsx#L148)).
2. **Plain text, never markdown.** The content renders as `whitespace-pre-wrap`
   text, so `"see [here](javascript:alert(1)) <img src=x onerror=alert(1)>"`
   produces no `<a>` and no `<img>` and leaves both literal strings in the
   document as text
   ([validated by](../../tests/ThinkingTrace.test.tsx#L62)); the source
   references no `dangerouslySetInnerHTML`, `react-markdown` or `remark-`
   ([validated by](../../tests/ThinkingTrace.test.tsx#L131)). HAL's parser
   escapes nothing and nobody reviews the shape of this text the way an
   assistant answer is reviewed, so interpreting it would be the library
   choosing to trust unreviewed model output.
3. **The dots mark streaming, inside the summary.** While `entry.isStreaming`
   is true, `ThinkingDots` renders in the `<summary>` next to the label
   ([validated by](../../tests/ThinkingTrace.test.tsx#L81)); with it false no
   dot is in the document
   ([validated by](../../tests/ThinkingTrace.test.tsx#L91)).
4. **`reducedMotion` goes through `021`'s hook.** The prop is forwarded to
   `useReducedMotion`, never to a `matchMedia` read of the component's own
   ([validated by](../../tests/ThinkingTrace.test.tsx#L135)); true strips the
   `bowman-fade-dot` animation class from the three dots
   ([validated by](../../tests/ThinkingTrace.test.tsx#L100)) and false keeps the
   class with `024`'s staggered delays
   ([validated by](../../tests/ThinkingTrace.test.tsx#L107)). `ThinkingDots`
   gains an optional `reducedMotion` prop for this, defaulting false, so the
   two indicators' markup is unchanged.
5. **It is not a message.** `ThinkingTraceProps` declares none of `onCopy`,
   `onFeedback`, `showFeedback` or `assistantAvatar`
   ([validated by](../../tests/ThinkingTrace.test.tsx#L140)) - internal
   deliberation is not an answer to copy or rate.

## In the message list

`ChatMessageList`'s `entries` widens to `ReadonlyArray<ChatEntry>` - all four
roles - and `086`'s `@ts-expect-error` is replaced by a positive assertion that
a `ThinkingChatEntry` array now compiles
([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L49),
compiled by
[chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L87)).

`showThinking` gates the mount, not the visibility, and defaults `false`: with
the flag absent, `[user, thinking, assistant]` renders no `<details>` and none
of the thinking content
([validated by](../../tests/ChatMessageList.test.tsx#L1108)) while the user and
assistant entries render unchanged
([validated by](../../tests/ChatMessageList.test.tsx#L1118)). With it true the
same array renders exactly one collapsed `ThinkingTrace` between them
([validated by](../../tests/ChatMessageList.test.tsx#L1130)). `reducedMotion`
forwards to the trace
([validated by](../../tests/ChatMessageList.test.tsx#L1161)), as does the
resolved `thinkingTrace` label
([validated by](../../tests/ChatMessageList.test.tsx#L1176)).

`ChatMessageListLabels` gains `thinkingTrace` as a defaulted key, colliding
with no key of `ChatMessageLabels`, `ThinkingIndicatorLabels` (`thinking`,
`thinkingRegion`) or `ToolActivityLabels` (`activity`, `activityDone`,
`details`), so `aiDisclosure` stays its only required key.

## EU AI Act

A reasoning trace is not a disclosure and does not substitute for one: a list
holding a single thinking entry with `showThinking` true still renders the
`aiDisclosure` band
([validated by](../../tests/ChatMessageList.test.tsx#L1148)).

## GDPR

The content is unreviewed model output that routinely restates the customer's
question and any identifier it carried, which is why `showThinking` defaults
`false` and why `003-support-conversation-data-flow-record` is what a consumer
checks before turning it on. The reasoning is recorded in docs/design-notes.md
§ Thinking trace.

Zero retention holds as elsewhere: `ThinkingTrace.tsx` makes no `console` call
and touches no `localStorage`, `sessionStorage` or `IndexedDB`
([validated by](../../tests/ThinkingTrace.test.tsx#L144)), and rendering the
fixture entry expanded leaves `localStorage.length` at `0`
([validated by](../../tests/ThinkingTrace.test.tsx#L154)).

## The suppression-path gap (hal-engine, not fixed here)

`showThinking` defaulting `false` is also a mitigation. Otto#109 records three
measurements of HAL's suppression path (`messageHandler.ts`,
`chunk.type === 'suppress_output'`), quoted here as the issue states them so
the follow-up `hal-engine` task is written from an observation rather than
prose:

1. `suppress_output` blanks assistant entries.
2. It never blanks a thinking entry that had already streamed before
   suppression fired.
3. It never sends that entry's `entry_commit` either, so `isStreaming` sticks
   `true` on the client for the rest of the session.

The commit these are recorded against is
`0fb475caae1dc3c07948911faf4c16510e263f88` - the `hal-engine` revision
`src/types/chat.ts` cites as the one its `docs/websocket-protocol.md` §6 view
model was read at, and therefore the revision this package's understanding of
the protocol is pinned to. The measurements are Otto#109's, not this branch's;
no new measurement was taken here.

Consequence for consumers: a client that mounts thinking entries can show a
permanently streaming trace after a suppressed turn. Fixing the suppression
path is out of scope - it is queued as a `hal-engine` task alongside `086`'s
finding that `processToolUseChunk` ignores suppression outright.

## The labels partition

`ThinkingTrace` sits in the `labelsProp` bucket
([validated by](../../tests/labelled-exports.test.tsx#L72)) with its own
sentinel harness
([validated by](../../tests/labelled-exports.test.tsx#L384)), and its sentinel
labels cover every `defaultThinkingTraceLabels` key
([validated by](../../tests/labelled-exports.test.tsx#L526)).

## Out of scope

Fixing HAL's suppression path; whether the support agent's system prompt emits
`<thinking>` tags at all (`051` owns the prompt); replacing the support agent's
existing role filter with `showThinking={false}`; `024`'s `ThinkingIndicator`
and the `busy` tail it mounts; exporting `ThinkingDots` from the barrel.
