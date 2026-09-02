# bowman-ui message list entry footer

Issue: re-cinq/Otto#133 (`133-bowman-ui-message-list-entry-footer`)

`ChatMessage` (023) has a `footer?: ReactNode` slot; `ChatMessageList` (078)
renders `ChatMessage` internally and made it unreachable - a consumer holding
the list has no handle on an individual message. `renderEntryFooter` is the
one seam that reopens it: `ChatMessageListProps` gains a single optional
member, forwarded to each rendered `ChatMessage` as its existing `footer`.
No new wrapper element, no change to `src/components/ChatMessage.tsx`, and
no new export from `src/index.ts` - the type is reachable as
`ChatMessageListProps["renderEntryFooter"]`.

## The public surface

`renderEntryFooter?: (entry: UserChatEntry | AssistantChatEntry) => ReactNode`.
The callback receives the entry and nothing else: no index (entry ids are
already opaque and stable, and a second parameter is a non-breaking addition
later) and no `props` object (unlike `renderLink`/`renderNavLink`, a footer
is neither styled nor wired by the component). A returned node lands last in
that message's column, after the action row, carrying whatever identity the
consumer put on it
([validated by](../../tests/ChatMessageList.test.tsx#L318)). Because the
public surface gains no export, `tests/fixtures/public-api.json` is
unchanged.

## The decisions

1. **The parameter type is written out, never derived from `entries`.**
   `UserChatEntry | AssistantChatEntry` is spelled literally in the
   signature, so a later widening of `entries` (tool rows, thinking rows)
   widens the list without silently widening this callback's contract. A
   callback body reading `entry.toolName` is a compile error, pinned from
   outside the package by an `@ts-expect-error` fixture that resolves the
   type through `ChatMessageListProps["renderEntryFooter"]`
   ([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L63),
   compiled against dist by
   [chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L110)).
   The fixture is what enforces this: `npm run typecheck` compiles `src`
   only.
2. **The callback runs for every rendered entry, user rows included.**
   No role filter in the library - 023's rule that the caller decides what
   to pass. It is invoked once per rendered `ChatMessage` per render, in
   `entries` order, and the busy `ThinkingIndicator` is not an entry and
   gets no call ([validated by](../../tests/ChatMessageList.test.tsx#L340)).
   `ChatMessage` renders its `footer` under assistant messages only, so a
   node returned for a user entry is dropped rather than displaced - the
   consequence of forwarding into the existing slot instead of editing
   `ChatMessage` ([validated by](../../tests/ChatMessageList.test.tsx#L358)).
3. **Omitting the prop and returning `undefined` are the same render.**
   The call site is `footer={renderEntryFooter?.(entry)}`, so a list whose
   callback returns `undefined` for every entry produces `container.innerHTML`
   byte-identical to the same list without the prop - no wrapper element, no
   empty node, nothing for a consumer's CSS to catch
   ([validated by](../../tests/ChatMessageList.test.tsx#L373)).
4. **Nothing in a footer is announced, and a growing footer does not
   re-scroll.** The node lands inside the transcript's `role="log"` /
   `aria-live="off"` region, so a screen reader reaches it only by walking
   there; auto-scroll keys on `entries`, not on layout, so a footer that
   expands after render can push its message above the fold. A consumer that
   wants either behaviour owns it - a live region of its own outside the
   list, and the already-exported
   `ChatMessageListHandle.scrollToBottom()`. Both are recorded in
   docs/design-notes.md § renderEntryFooter. No `ResizeObserver` and no auto
   re-scroll ship here.
5. **The labels contract is untouched.** `ChatMessageListLabels` gains no
   key and `defaultChatMessageListLabels` no entry: a footer is consumer
   markup, and every string in it is already the consumer's. The
   `labelledExports` sentinel render for `ChatMessageList` is unchanged.

## Compliance

- **EU AI Act.** No value of `renderEntryFooter` removes, covers or
  reorders the disclosure band: with a footer returned for every entry the
  band is still the root's first element and still outside the `role="log"`
  region ([validated by](../../tests/ChatMessageList.test.tsx#L392)), and
  078's render with every optional prop `false`/`undefined` now carries
  `renderEntryFooter={undefined}` and still resolves the disclosure text
  ([validated by](../../tests/ChatMessageList.test.tsx#L165)).
- **GDPR.** A footer may carry customer-derived content (a score computed
  from a booking, a debug block quoting a question). The list neither stores
  nor forwards it: the source names `renderEntryFooter` three times -
  declaration, destructure, `ChatMessage` call position - and writes it to
  no ref, no state and no serialised value
  ([validated by](../../tests/ChatMessageList.test.tsx#L939)), and a
  rerender without the prop leaves no footer behind
  ([validated by](../../tests/ChatMessageList.test.tsx#L407)). The
  suite-wide `console` and network traps in `tests/setup.ts` hold every one
  of these tests to zero calls.

## Not in scope

The consumption itself (075 renders its own component through this prop
in its own repo); footers under tool or thinking rows; a list-level
header or footer around the whole transcript (the consumer already owns that
position); an index or props argument, and any exported type alias for the
callback; a `ResizeObserver` or auto re-scroll on footer growth; any change
to `ChatMessage`, including making its `footer` slot a function.
