# Definition of Done

> `ChatMessageList` can crash the page on the first message when the browser has translated it. React throws `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`

**Strategy: `direct`** — The component's top-level API can be called with an empty state and then updated with a first message, triggering the translation bug directly.

## Done when these pass

- [ ] **renders the transcript without crashing when Chrome translation mutates the empty state** — validates that wrapping the `greeting` text node in translation tags does not crash React when the component rerenders with entries.
  `tests/ChatMessageList.acceptance.test.tsx`

## Facets

- [ ] Add distinct keys or use different element types for the empty state container and the transcript container in `ChatMessageList`.

## Out of scope

- Testing or addressing text node translation issues in other components like `ChatMessage` or `TextField`.
