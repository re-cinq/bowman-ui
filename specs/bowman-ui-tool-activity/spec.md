# bowman-ui tool activity

| Field  | Value                                                       |
| ------ | ----------------------------------------------------------- |
| Issue  | issue 108 (`108-bowman-ui-tool-activity`), part of issue 57 |
| Status | Shipped                                                     |

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
`icon` and `labels`. `ToolActivityLabels` is four keys - `activity`
(`"Looking something up"`), `activityDone` (`"Looked something up"`),
`details` (the disclosure's `<summary>`, `"Details"`) and
`toolInputUnavailable` (the `<pre>`'s text when the arguments cannot be
serialised, `"Arguments could not be shown"`, decision 6) - with
`defaultToolActivityLabels` frozen over the four English strings, resolved per
key by the convention's `resolveLabels`
([validated by resolves overrides over the English defaults per key](../../tests/ToolActivity.test.tsx#L211),
[validated by defaultToolActivityLabels is frozen with the four English strings](../../tests/ToolActivity.test.tsx#L225)).

## The decisions

1. **The default is the safe answer, not a faithful dump.** With no prop but
   `entry`, the render is one sentence (`activityDone`) and nothing else -
   neither the tool name nor the arguments reach the DOM, because
   `entry.toolName` is an English machine identifier in a Danish-first product
   and `entry.toolInput` is model-authored data that may hold a booking
   reference or a customer identifier. `showToolName` opts the name in and
   `showToolInput` opts the arguments in; both default off. Whether a consumer
   may flip either is `003-support-conversation-data-flow-record`'s call,
   recorded in docs/design-notes.md § Tool activity
   ([validated by shows the activityDone sentence and none of the tool name or arguments](../../tests/ToolActivity.test.tsx#L20),
   [validated by true puts the tool name in the document](../../tests/ToolActivity.test.tsx#L37),
   [validated by true renders a pre containing the JSON arguments](../../tests/ToolActivity.test.tsx#L57)).
2. **`describeTool` is the caller's sentence.** When present it replaces the
   `activity`/`activityDone` line with caller-authored copy and does not
   suppress `showToolName`; the Danish `describeTool` map itself belongs to the
   support agent, not the library
   ([validated by replaces the default sentence and does not suppress showToolName](../../tests/ToolActivity.test.tsx#L132)).
3. **`pending` is caller-derived.** `pending` true renders `activity`, absent
   renders `activityDone` - there is no protocol "done" signal, so
   `ChatMessageList` derives it as
   `busy === true && index === entries.length - 1`
   ([validated by true renders the activity label](../../tests/ToolActivity.test.tsx#L177),
   [done](../../tests/ToolActivity.test.tsx#L184)).
4. **Arguments are inert JSON behind a native disclosure.** When shown they
   render as `JSON.stringify(entry.toolInput, null, 2)` inside a `<pre>`
   (decision 6 records the unserialisable case), behind a
   `<details>`/`<summary>` closed by default - never markdown or
   HTML, so a `<img onerror>` payload renders as literal text with no element
   created. The source references no `dangerouslySetInnerHTML`,
   `react-markdown` or `remark-` and holds no `useState`, `useEffect` or
   `useId`. Clicking the summary opens the disclosure and a second click
   closes it again (jsdom activates a summary on click, not on Enter or
   Space, so the keyboard path is a browser's job)
   ([validated by holds no useState, useEffect or useId](../../tests/ToolActivity.test.tsx#L256),
   [validated by is a details/summary closed by default with the details label as its summary](../../tests/ToolActivity.test.tsx#L193),
   [validated by renders the arguments as inert text, never HTML](../../tests/ToolActivity.test.tsx#L72),
   [validated by references no dangerouslySetInnerHTML, react-markdown or remark-](../../tests/ToolActivity.test.tsx#L252),
   [toggle](../../tests/ToolActivity.test.tsx#L203)).
5. **It is not a message.** No avatar, copy or feedback affordance, and
   `ToolActivityProps` declares none of `assistantAvatar`, `onCopy`,
   `onFeedback` or `showFeedback`. No `renderEntry` escape hatch exists -
   `dist/index.d.ts` carries none - so the data-boundary default cannot be
   moved out of the library
   ([validated by declares none of assistantAvatar, onCopy, onFeedback or showFeedback](../../tests/ToolActivity.test.tsx#L264),
   [validated by dist/index.d.ts declares no renderEntry escape hatch](../../tests/ToolActivity.test.tsx#L279)).
6. **Unserialisable arguments degrade to a label, never a throw.** The
   arguments are stringified through a pure helper that returns `null` when
   `JSON.stringify` throws (a BigInt, a cycle, a throwing `toJSON`) or yields
   `undefined`; the `<pre>` then shows the `toolInputUnavailable` label
   instead, the disclosure still closed, so one malformed entry never unmounts
   the list. The label resolves per key like the other three and
   `ChatMessageList` forwards it with them
   ([validated by](../../tests/ToolActivity.test.tsx#L89),
   [override](../../tests/ToolActivity.test.tsx#L112),
   [forwarded](../../tests/ChatMessageList.test.tsx#L1019)).

## In the message list

`ChatMessageList`'s `entries` widened to
`ReadonlyArray<UserChatEntry | AssistantChatEntry | ToolChatEntry>` here;
`087-bowman-ui-thinking-trace` has since widened it to the full `ChatEntry`
union and replaced this issue's `@ts-expect-error` with a positive assertion
over the same thinking-entry array
([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L49),
compiled by
[chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L84)). The
map dispatches on `role`: a tool entry renders `ToolActivity`, everything else
`ChatMessage`, array order preserved. `busy` makes only a trailing tool entry
pending; a non-trailing one stays done. `describeTool`, `showToolName`,
`showToolInput` and `toolIcon` forward unchanged, and a list of a single tool
entry still shows the `aiDisclosure` band. `ChatMessageListLabels` gains
`activity`, `activityDone` and `details` (and, since issue 130,
`toolInputUnavailable`) as defaulted keys, so `aiDisclosure` stays its only
required key
([validated by](../../tests/ChatMessageList.test.tsx#L943),
[validated by busy true makes a trailing tool entry pending and busy false makes it done](../../tests/ChatMessageList.test.tsx#L965),
[validated by a non-trailing tool entry stays done even while busy](../../tests/ChatMessageList.test.tsx#L978),
[validated by forwards describeTool, showToolName, showToolInput and toolIcon to the activity](../../tests/ChatMessageList.test.tsx#L1000),
[validated by a list holding a single tool entry still renders the aiDisclosure band](../../tests/ChatMessageList.test.tsx#L992)).

## GDPR zero retention

`ToolActivity.tsx` makes no `console` call and touches no `localStorage`,
`sessionStorage` or `IndexedDB`; rendering with `showToolInput` leaves
`localStorage.length` at `0`
([validated by writes nothing to localStorage when rendering with showToolInput](../../tests/ToolActivity.test.tsx#L270),
[validated by makes no console call and touches no client storage](../../tests/ToolActivity.test.tsx#L260)).

## The labels partition

`ToolActivity` sits in the `labelsProp` bucket with its own sentinel harness,
and its sentinel labels cover every `defaultToolActivityLabels` key
([validated by ToolActivity's sentinel labels cover every defaultToolActivityLabels key](../../tests/labelled-exports.test.tsx#L586)).
