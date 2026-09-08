# bowman-ui describeTool pending

| Field  | Value                                                                             |
| ------ | --------------------------------------------------------------------------------- |
| Issue  | re-cinq/Otto#190 (`190-bowman-ui-describe-tool-pending`), part of re-cinq/Otto#57 |
| Status | In Progress                                                                       |

`describeTool` arrived with `108-bowman-ui-tool-activity` as
`(entry: ToolChatEntry) => ReactNode`, while `ToolActivity` kept a `pending`
flag of its own to pick between the `activity` and `activityDone` labels. A
supplied `describeTool` replaces those labels wholesale, so a consumer
authoring tensed sentences - what a Danish-first product must do - had no way
to tell a finished lookup from a running one, and the first consumer
re-derived the identical expression in its own screen. This issue hands the
flag to the callback where the derivation already lives.

## The widened signature

`ToolActivityProps.describeTool` is
`(entry: ToolChatEntry, pending: boolean) => ReactNode`, called with the
component's own resolved `pending` prop rather than a second derivation. With
`pending` set the callback's present-tense string renders; without it the
past-tense one
([validated by](../../tests/ToolActivity.test.tsx#L99)). The published
declarations carry the two-parameter form, reached from the barrel's
`export type { ... ToolActivityProps } from "./components/ToolActivity.js"`
([validated by](../../tests/ToolActivity.test.tsx#L227)) - `dist/index.d.ts`
is re-export statements only, so the signature is emitted in the module it
re-exports.

## The decisions

1. **The parameter is additive, not a break.** TypeScript's contravariance on
   parameter counts keeps a one-parameter callback assignable, so no consumer
   is forced to change: `const describe = (entry: ToolChatEntry) => entry.toolName`
   still satisfies the prop and still renders when `pending` is true, and
   `tests/types/tool-activity-type-assertions.tsx` compiles against the built
   package suppressing no error. The same
   one-parameter shape stays pinned through `ChatMessageList`'s own assertions
   ([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L73),
   [L114](../../tests/ToolActivity.test.tsx#L114),
   [L240](../../tests/ToolActivity.test.tsx#L240),
   compiled by
   [chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L27)).
2. **One source of truth for the flag.** The value passed is the prop
   `ToolActivity` already resolved (default `false`), so a caller using the
   component directly and one going through `ChatMessageList` see identical
   semantics. `ChatMessageList` needs no logic change: it already derives
   `busy === true && index === entries.length - 1` per entry and forwards
   `describeTool` unchanged, so with `busy` true and `[user, tool, tool]` the
   first tool entry renders the callback's past-tense string and the trailing
   one its present-tense string, and with `busy` false both read past tense.
   Its prop type
   restates the signature inline and is kept identical to `ToolActivity`'s
   ([validated by](../../tests/ChatMessageList.test.tsx#L690)).
3. **Replacement semantics are untouched.** A supplied `describeTool` still
   replaces the tensed labels entirely and suppresses nothing else - with
   `showToolName` also set, the fixture's tool name is still in the document.
   This issue changes
   what the callback knows, not what it controls
   ([validated by](../../tests/ToolActivity.test.tsx#L79)).
4. **The component stays off the client-directive trigger list.**
   `ToolActivity.tsx` gains no state: its source still holds no `useState`,
   `useEffect` or `useId`
   ([validated by](../../tests/ToolActivity.test.tsx#L196)).

## Out of scope

The consumer that worked around this by duplicating the expression is not
migrated here - a one-parameter callback stays valid, so nothing forces the
cleanup. The derivation expression, its trailing-entry rule and
`ToolActivity`'s `pending` default all stay exactly as
`108-bowman-ui-tool-activity` defined them, and no `pending` field is added to
`ToolChatEntry`: the wire protocol emits no completion frame, so the type
cannot carry what the protocol does not send.

## The published surface

No export is added or removed - only the signature of an existing one changes -
so `tests/fixtures/public-api.json`, which records names, is unchanged
([validated by](../../tests/public-api.test.ts#L43)).
