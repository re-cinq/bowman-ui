# Definition of Done

> A consumer that draws more than one kind of card through `describeCard` has no way to tell them apart for a screen-reader user.

**Strategy: `direct`** — The `ChatCard` and `ChatMessageList` components already exist and provide a seam where we can add the optional `describeCardName` callback and assert on the `article`'s accessible name.

## Done when these pass

- [ ] **carries the name from describeCardName when provided** — a card carries the name from the callback
  `tests/chat-card-name.acceptance.test.tsx`
- [ ] **keeps labels.card when describeCardName is absent or returns undefined** — falls back to default labels
  `tests/chat-card-name.acceptance.test.tsx`
- [ ] **assigns different names to different cards in a ChatMessageList** — different cards carry different names
  `tests/chat-card-name.acceptance.test.tsx`
- [ ] **falls back to labels.card for ChatMessageList when describeCardName returns undefined** — falls back properly within a list
  `tests/chat-card-name.acceptance.test.tsx`

## Facets

- [ ] Add `describeCardName` to `ChatCardProps` and use it for the article name
- [ ] Add `describeCardName` to `ChatMessageListProps` and pass it to `ChatCard`
- [ ] Document `describeCardName` in the README

## Out of scope

- Passing the card data automatically to aria-label without the consumer explicitly returning a string
