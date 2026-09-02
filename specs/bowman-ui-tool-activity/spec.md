# bowman-ui tool activity

Issue: issue 108 (`108-bowman-ui-tool-activity`), part of issue 57.

`ToolActivity` renders a `ToolChatEntry` - a tool call the model requested on
the customer's behalf - shipped as `src/components/ToolActivity.tsx`
(`ToolActivity`, `ToolActivityProps`, `ToolActivityLabels`,
`defaultToolActivityLabels`) and exported from `src/index.ts`. HAL emits the
entry the moment the model requests the call (`processToolUseChunk`, a single
`entry_upsert` with no follow-up frame), so nothing in the protocol marks it
done; `ChatMessageList` filtered it out until this issue.

## The public surface

`ToolActivityProps` carries `entry`, `describeTool`, `pending` (default
`false`), `showToolName` (default `false`), `showToolInput` (default `false`),
`icon` and `labels`. `ToolActivityLabels` is three keys - `activity`
(`"Looking something up"`), `activityDone` (`"Looked something up"`) and
`details` (the disclosure's `<summary>`, `"Details"`) - with
`defaultToolActivityLabels` frozen over the three English strings
([validated by](../../tests/ToolActivity.test.tsx#L162)), resolved per key by
the convention's `resolveLabels`
([validated by](../../tests/ToolActivity.test.tsx#L148)).

## The decisions

1. **The default is the safe answer, not a faithful dump.** With no prop but
   `entry`, the render is one sentence (`activityDone`) and nothing else -
   neither the tool name nor the arguments reach the DOM
   ([validated by](../../tests/ToolActivity.test.tsx#L18)), because
   `entry.toolName` is an English machine identifier in a Danish-first product
   and `entry.toolInput` is model-authored data that may hold a booking
   reference or a customer identifier. `showToolName` opts the name in
   ([validated by](../../tests/ToolActivity.test.tsx#L35)) and `showToolInput`
   opts the arguments in
   ([validated by](../../tests/ToolActivity.test.tsx#L49)); both default off.
   Whether a consumer may flip either is
   `003-support-conversation-data-flow-record`'s call, recorded in
   CONTRACT.md § Tool activity.
2. **`describeTool` is the caller's sentence.** When present it replaces the
   `activity`/`activityDone` line with caller-authored copy and does not
   suppress `showToolName`
   ([validated by](../../tests/ToolActivity.test.tsx#L78)); the Danish
   `describeTool` map itself belongs to the support agent, not the library.
3. **`pending` is caller-derived.** `pending` true renders `activity`, absent
   renders `activityDone`
   ([validated by](../../tests/ToolActivity.test.tsx#L121),
   [done](../../tests/ToolActivity.test.tsx#L128)) - there is no protocol
   "done" signal, so `ChatMessageList` derives it as
   `busy === true && index === entries.length - 1`.
4. **Arguments are inert JSON behind a native disclosure.** When shown they
   render as `JSON.stringify(entry.toolInput, null, 2)` inside a `<pre>`,
   behind a `<details>`/`<summary>` closed by default
   ([validated by](../../tests/ToolActivity.test.tsx#L137)) - never markdown
   or HTML, so a `<img onerror>` payload renders as literal text with no
   element created
   ([validated by](../../tests/ToolActivity.test.tsx#L63)). The source
   references no `dangerouslySetInnerHTML`, `react-markdown` or `remark-`
   ([validated by](../../tests/ToolActivity.test.tsx#L187)) and holds no
   `useState`, `useEffect` or `useId`
   ([validated by](../../tests/ToolActivity.test.tsx#L191)).
5. **It is not a message.** No avatar, copy or feedback affordance, and
   `ToolActivityProps` declares none of `assistantAvatar`, `onCopy`,
   `onFeedback` or `showFeedback`
   ([validated by](../../tests/ToolActivity.test.tsx#L199)). No `renderEntry`
   escape hatch exists - `dist/index.d.ts` carries none
   ([validated by](../../tests/ToolActivity.test.tsx#L214)) - so the
   data-boundary default cannot be moved out of the library.

## In the message list

`ChatMessageList`'s `entries` widened to
`ReadonlyArray<UserChatEntry | AssistantChatEntry | ToolChatEntry>` here;
`087-bowman-ui-thinking-trace` has since widened it to the full `ChatEntry`
union and replaced this issue's `@ts-expect-error` with a positive assertion
over the same thinking-entry array
([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L28),
compiled by
[chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L110)). The
map dispatches on `role`: a tool entry renders `ToolActivity`, everything else
`ChatMessage`, array order preserved
([validated by](../../tests/ChatMessageList.test.tsx#L947)). `busy` makes only
a trailing tool entry pending
([validated by](../../tests/ChatMessageList.test.tsx#L968)); a non-trailing
one stays done
([validated by](../../tests/ChatMessageList.test.tsx#L980)). `describeTool`,
`showToolName`, `showToolInput` and `toolIcon` forward unchanged
([validated by](../../tests/ChatMessageList.test.tsx#L1002)), and a list of a
single tool entry still shows the `aiDisclosure` band
([validated by](../../tests/ChatMessageList.test.tsx#L994)).
`ChatMessageListLabels` gains `activity`, `activityDone` and `details` as
defaulted keys, so `aiDisclosure` stays its only required key.

## GDPR zero retention

`ToolActivity.tsx` makes no `console` call and touches no `localStorage`,
`sessionStorage` or `IndexedDB`
([validated by](../../tests/ToolActivity.test.tsx#L195)); rendering with
`showToolInput` leaves `localStorage.length` at `0`
([validated by](../../tests/ToolActivity.test.tsx#L205)).

## The labels partition

`ToolActivity` sits in the `labelsProp` bucket with its own sentinel harness,
and its sentinel labels cover every `defaultToolActivityLabels` key
([validated by](../../tests/labelled-exports.test.tsx#L523)).
