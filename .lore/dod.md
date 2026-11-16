# Definition of Done

> Once a `ConversationList` holds more rows than its sidebar can show, the whole page becomes scrollable. A mouse wheel over a part that doesn't scroll itself, or the space bar outside a text field, then shifts the app up: its header is cut off and a blank band appears at the bottom.

**Strategy: `direct`** — A seam exists in the browser test suite where we can observe the document scroll height directly. The red bar is CI's to show; the CI job that runs the tests is `consumer`.

## Done when these pass

- [ ] **ConversationList does not stretch the page when overflowing the sidebar** — With more conversations than fit the sidebar, the document's scrollHeight equals its clientHeight.
  `examples/chat-demo/tests/page-scroll.acceptance.test.ts`
- [ ] **ChatMessageList does not stretch the page when overflowing the viewport** — With a transcript longer than the viewport containing links that open in new tabs, the document's scrollHeight equals its clientHeight.
  `examples/chat-demo/tests/page-scroll.acceptance.test.ts`

## Facets

- [ ] Add `relative` positioning to the scrolling container in `AppSidebar`.
- [ ] Add `relative` positioning to the scrolling container in `ChatMessageList`.

## Out of scope

- Checking or fixing other uses of `bowman-sr-only` outside of scrolling lists (e.g. composer's busy hint, toast's status region, confirm dialog, useFocusGroups), as they do not overflow scroll containers in the same way, and the acceptance criteria specifically targets the conversation list and chat message list.