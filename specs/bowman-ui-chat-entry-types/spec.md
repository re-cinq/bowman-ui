# bowman-ui chat entry types

Issue: re-cinq/Otto#67 (`017-bowman-ui-chat-entry-types`)

`src/types/chat.ts` gives every conversation-rendering bowman-ui component one
message type: the `ChatEntry` discriminated union (`role: "user" | "assistant"
| "thinking" | "tool"`), plus `ChatStreamState` and `ChatErrorInfo`
([validated by](../../tests/types/chat.test.ts#L124)). It is a
view model, not the wire protocol - designed against `hal-engine`
`docs/websocket-protocol.md` §6, read at commit
`0fb475caae1dc3c07948911faf4c16510e263f88`, without importing the engine.
Entries carry an opaque `id`, never a protocol `index`; the §5.5 skipped-index
arithmetic belongs to the consuming app's adapter
([validated by](../../tests/types/chat.test.ts#L100)). The exported names are
disjoint from `hal-engine/src/types/index.ts`'s exports so `support-agent` can
import both packages in one adapter file
([validated by](../../tests/types/chat.test.ts#L155)).

## Exported surface

Exactly `ChatEntry`, `ChatEntryRole`, `UserChatEntry`, `AssistantChatEntry`,
`ThinkingChatEntry`, `ToolChatEntry`, `ChatStreamState`, `ChatErrorInfo`
([validated by](../../tests/types/chat.test.ts#L124)). A fifth role does not
typecheck, and an `AssistantChatEntry` without `isStreaming` does not compile
([validated by](../../tests/types/chat.test.ts#L75)). No exported type declares
`index`, `devMetadata`, `correlationId`, `traceId`, `timings`, `reflection`,
`scores`, `tenantId`, `organizationId`, `timestamp` or an index signature
([validated by](../../tests/types/chat.test.ts#L100),
[L120](../../tests/types/chat.test.ts#L120)).
`AssistantChatEntry.toolStatus?: string` is caller-supplied and has no HAL
protocol counterpart. The module ships types only: `dist/types/chat.js` is a
bare `export {};`, so nothing in it can log, serialize or persist the customer
data the types describe - the GDPR zero-retention constraint from
`003-support-conversation-data-flow-record`
([validated by](../../tests/types/chat.test.ts#L243)).

## Representability

The four §6.1-6.4 examples map onto `ChatEntry` with `timestamp` as the only
deliberately dropped field; the mapping function lives in the test file and is
not part of the published surface
([validated by](../../tests/types/chat.test.ts#L189),
[L200](../../tests/types/chat.test.ts#L200),
[L212](../../tests/types/chat.test.ts#L212),
[L224](../../tests/types/chat.test.ts#L224),
[L237](../../tests/types/chat.test.ts#L237)).

## OutgoingMessage mapping

How each of the eight `hal-engine/src/types/messages.ts` `OutgoingMessage`
variants relates to this view model. "Adapter" is the consuming app's
protocol adapter (`support-agent`), which owns index-to-id bookkeeping.

| Variant        | Effect on the view model                                                                      |
| -------------- | --------------------------------------------------------------------------------------------- |
| `connected`    | Invisible - adapter bookkeeping (session id, example prompts stay outside `ChatEntry`)        |
| `entry_upsert` | Changes a `ChatEntry` field - the adapter creates or replaces the entry the index resolves to |
| `entry_delta`  | Changes a `ChatEntry` field - `content` grows by concatenation                                |
| `entry_commit` | Changes a `ChatEntry` field - `isStreaming` flips to `false`                                  |
| `entry_skip`   | Invisible - adapter bookkeeping (skipped-index arithmetic, §5.5; no entry is rendered)        |
| `error`        | Changes `ChatStreamState` to `"error"`; `code`/`message` populate a `ChatErrorInfo`           |
| `pong`         | Invisible - adapter bookkeeping (heartbeat echo)                                              |
| `stream_end`   | Changes `ChatStreamState` - `"streaming"` returns to `"idle"`                                 |

## Recorded decisions

- **Fixture wrapper**: `tests/fixtures/hal-session-entries.json` keeps the four
  §6.1-6.4 example objects byte-for-byte verbatim under an `entries` key, with
  provenance (doc section and `hal-engine` commit) in a sibling `_meta` object.
  The wrapper resolves the tension between "copied verbatim" and "the file
  header names the doc and commit": JSON has no comments, so the header lives
  in `_meta` and the examples themselves stay untouched
  ([validated by](../../tests/types/chat.test.ts#L161)).
- **Coverage**: `src/types/**` is excluded from coverage in `vitest.config.ts`
  because a types-only module emits no statements - v8 has nothing to count,
  and including it would divide by zero against `014`'s 100/100/100 floor,
  which remains enforced on real component code.
- **Type-level assertions**: `npm run typecheck` only covers `src/`, so the
  `@ts-expect-error` proofs live in `tests/types/chat-type-assertions.ts` and a
  test compiles that file with `tsc --noEmit`; an assertion that stops failing
  surfaces as an unused directive and fails the suite
  ([validated by](../../tests/types/chat.test.ts#L75)).
