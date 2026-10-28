# bowman-ui chat card

| Field  | Value                 |
| ------ | --------------------- |
| Issue  | re-cinq/bowman-ui#280 |
| Status | Shipped               |

`ChatCard` renders a `CardChatEntry`: a consumer's card, such as Otto's
delivery card, which its adapter builds from an entry a tool sent and the
engine forwards as-is. It ships as `src/components/ChatCard.tsx` (`ChatCard`,
`ChatCardProps`, `ChatCardLabels`, `defaultChatCardLabels`), exported from
`src/index.ts`, and `ChatMessageList` renders one per card entry. The library
owns the frame, the accessible name and the thumbs; the consumer draws only
the body, from its own reading of the card's data (docs/design-notes.md
§ Card entries).

## The public surface

`CardChatEntry` is `{id, role: "card", kind, data}`: `kind` names the card
type for the consumer and is never rendered, and `data` is
`Readonly<Record<string, unknown>>`, opaque to the library
([validated by exports exactly the nine chat type names](../../tests/types/chat.test.ts#L106)). A card without
`kind` does not compile, and a card accepts no `persona`
([validated by tsc accepts chat-type-assertions.ts, proving a sixth role, a card without kind and a streamless assistant entry fail to typecheck](../../tests/types/chat.test.ts#L76)).

`ChatCardProps` carries `entry`, `describeCard`, `showFeedback` (default
`true`, as on `ChatMessage`), `labels` and `onFeedback`. `ChatCardLabels` is
`card` (the article's accessible name, default `"Card"`), `cardUnavailable`
(default `"This card could not be shown"`) and the three feedback keys, which
default to `ChatMessage`'s. `ChatMessageList` gains `describeCard` and nothing
else, and its labels gain `card` and `cardUnavailable`
([validated by ChatCard's sentinel labels cover every defaultChatCardLabels key](../../tests/labelled-exports.test.tsx#L637),
[validated by ChatMessageListProps gains attribution and describeCard and nothing else](../../tests/chat-message-list-dist.test.ts#L42)).

## Behaviour

- **The body is the consumer's, the frame the library's.** `describeCard`'s
  return renders inside an article named by the `card` label
  ([validated by draws describeCard's body for SHP-2026-000123 inside an article named Card](../../tests/ChatCard.test.tsx#L17)).
- **Nothing from `data` reaches the DOM on its own.** Without `describeCard`,
  or when it returns `null` or `undefined` for a kind the consumer does not
  draw, the card shows the `cardUnavailable` label and none of `data`, not
  even `kind`, so a consumer that forgets the callback leaks nothing
  ([validated by shows the cardUnavailable label and nothing from data when no describeCard is given](../../tests/ChatCard.test.tsx#L25),
  [validated by shows the cardUnavailable label when describeCard returns null for a kind it does not draw](../../tests/ChatCard.test.tsx#L56)).
- **Each card is rated alone.** The thumbs are `ChatMessage`'s, from one
  shared internal module: a click reports the card's own id through
  `onFeedback`, presses that thumb and shows the notice; the rating is keyed
  by `entry.id`, so a card handed another entry starts unrated; and
  `showFeedback={false}` renders no thumbs
  ([validated by starts unrated when handed card c2 after card c1 was rated up](../../tests/ChatCard.test.tsx#L66),
  [validated by rates card c1 up through onFeedback, presses that thumb and shows the notice](../../tests/ChatCard.test.tsx#L36),
  [validated by rates card c2 alone through onFeedback with its own id](../../tests/ChatMessageList.test.tsx#L1141),
  [validated by renders no thumbs when showFeedback is false](../../tests/ChatCard.test.tsx#L78)).
- **Strings come from the labels.** The article's name and the fallback
  follow the `labels` given to `ChatCard` or to `ChatMessageList`
  ([validated by names the article and the fallback from the labels it is given](../../tests/ChatCard.test.tsx#L84),
  [validated by names each card and its fallback from the list's labels and shows no thumbs with showFeedback false](../../tests/ChatMessageList.test.tsx#L1161)).
- **Cards sit in transcript order.** `ChatMessageList` renders each card
  entry where it falls, after the tool row that produced it
  ([validated by renders a question, a tool row and two cards, each drawing its describeCard body, in transcript order](../../tests/ChatMessageList.test.tsx#L1116)).
