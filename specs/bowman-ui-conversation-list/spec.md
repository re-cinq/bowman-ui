# bowman-ui conversation list

| Field  | Value                                        |
| ------ | -------------------------------------------- |
| Issue  | issue 79 (`029-bowman-ui-conversation-list`) |
| Status | In Progress                                  |

`ConversationList` is the presentational list of conversations, shipped as
`src/components/ConversationList.tsx` (`ConversationList`,
`ConversationListProps`, `ConversationListItem`, `ConversationLinkProps`,
`ConversationListLabels`, `defaultConversationListLabels`, and the
module-private `TypewriterTitle`). Fetching, tenant filtering, routing, and
title generation stay with the consumer.

## The public surface

`ConversationListItem` is the package's own five-field camelCase shape (`id`,
`title`, `timestamp?`, `badge?`, `isPlaceholderTitle?`), not the nine-field
snake_case API `Conversation`. `timestamp` arrives display-ready - the
component reads no clock and no locale: no `Date` constructor,
`toLocaleDateString` or `Intl` appears in the source, asserted by grep - and
`badge` is a consumer-computed string rendered verbatim or not at all
([validated by](../../tests/ConversationList.test.tsx#L409),
[L81](../../tests/ConversationList.test.tsx#L81),
[L88](../../tests/ConversationList.test.tsx#L88)).

`ConversationListLabels` has four defaulted keys - `conversations`,
`noConversations`, `loadingConversations`, and the function-form
`deleteConversation: (title) => string` per docs/design-notes.md § Labels decision 4.
`ConversationList` sits
in the `labelsProp` partition bucket and passes the
sentinel render across its list, empty and loading states, the function label
included ([partition](../../tests/labelled-exports.test.tsx#L79),
[harness](../../tests/labelled-exports.test.tsx#L467),
[L204](../../tests/ConversationList.test.tsx#L204),
[defaults](../../tests/labelled-exports.test.tsx#L593)).

## The four decisions

1. **`aria-current="page"` marks the active row.** A background class alone
   announces nothing to assistive tech. The row whose `id` equals
   `activeId` carries `aria-current="page"` on its interactive element and no
   other row does; `activeId` undefined marks none
   ([validated by](../../tests/ConversationList.test.tsx#L103),
   [L114](../../tests/ConversationList.test.tsx#L114)).
2. **`renderLink(item, props)` is the routing seam; the default is
   `<button type="button" {...props} />`.** A consumer's element must spread
   every prop it is handed - docs/design-notes.md § renderLink states it, pinned
   together with the anchor round-trip and the dropped-`onClick` failure
   mode. `onSelect` fires through the spread `onClick`
   ([validated by](../../tests/ConversationList.test.tsx#L192),
   [L153](../../tests/ConversationList.test.tsx#L153),
   [L174](../../tests/ConversationList.test.tsx#L174),
   [L129](../../tests/ConversationList.test.tsx#L129)).
3. **`isPlaceholderTitle` replaces placeholder-literal sniffing.** The
   typewriter fires only when the title changed and the previous render's flag
   was `true`; a conversation
   genuinely titled `"Untitled"` never animates - the exact bug a
   literal list causes. The flag
   asks the title producer to send what it already
   computes instead of the UI duplicating a `DEFAULT_TITLES`
   list it cannot keep in sync. The previous-title record is per component instance
   (rows are keyed by `item.id`), never module-scoped - a second list does
   not animate from the first's titles
   ([validated by](../../tests/ConversationList.test.tsx#L260),
   [L301](../../tests/ConversationList.test.tsx#L301),
   [L318](../../tests/ConversationList.test.tsx#L318),
   [L384](../../tests/ConversationList.test.tsx#L384)).
4. **Reduced motion switches the typewriter off, it does not shorten it.**
   `useReducedMotion(reducedMotion)` from 021 gates the animation; reduced
   motion takes the same one-pass replacement path a non-placeholder change
   takes. Unmounting mid-animation clears the interval
   ([validated by](../../tests/ConversationList.test.tsx#L327),
   [L346](../../tests/ConversationList.test.tsx#L346)).

`onDelete` fires immediately - whether deleting needs confirmation is the
consumer's product question; omitting the prop renders no button and no
`TrashIcon`. `isLoading` wins over a
non-empty `items`, rendering a `role="status"` region named by
`loadingConversations`; loading off with no items renders `noConversations`
and no `<ul>` ([validated by](../../tests/ConversationList.test.tsx#L238),
[L251](../../tests/ConversationList.test.tsx#L251),
[L204](../../tests/ConversationList.test.tsx#L204),
[L229](../../tests/ConversationList.test.tsx#L229)).

## The characterization suite

The deliberate decisions below are each pinned in
`tests/ConversationList.test.tsx`; the
typewriter's 25ms two-phase stepping and one-pass replacement are pinned
verbatim, driven by props instead of a data-fetching hook
([validated by](../../tests/ConversationList.test.tsx#L260),
[L301](../../tests/ConversationList.test.tsx#L301)).

| #   | Decision                                                                                                                                                                                                             | Reason                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| a   | The active row carries `aria-current="page"` on its interactive element, never a background class alone ([L103](../../tests/ConversationList.test.tsx#L103))                                                         | Decision 1: a background class announces nothing to assistive tech          |
| b   | The previous render's `isPlaceholderTitle` flag drives the typewriter, never literal-string sniffing (`"New thread"`/`"New conversation"`/`"Untitled"`) ([L260](../../tests/ConversationList.test.tsx#L260))         | Decision 3: the rule belongs to the title producer, not the UI              |
| c   | `"Untitled"` → real title with the flag absent animates zero times ([L318](../../tests/ConversationList.test.tsx#L318))                                                                                              | Decision 3: the exact bug literal-string sniffing causes                    |
| d   | The empty and loading states render the resolved `noConversations` label and a named `role="status"` region ([L238](../../tests/ConversationList.test.tsx#L238), [L251](../../tests/ConversationList.test.tsx#L251)) | 022's labels convention; a spinner region must be named                     |
| e   | `renderLink` and the spread `onClick` carry routing and selection ([L153](../../tests/ConversationList.test.tsx#L153))                                                                                               | Routing is the consumer's; consumer navigation behaviour hangs on `onClick` |

Out of scope by design: search (debouncing and client-side filtering over
`preview`/`org_name` - fields this item type
deliberately lacks), a delete-confirmation dialog (`onDelete` fires
immediately; the dialog is a future `ConfirmDialog` issue), org filtering
and its `localStorage` key
(auth state and GDPR-relevant storage the package must not
touch), the new-conversation link (routing), and org-badge
derivation (org identifiers collapse into the
consumer-computed `badge` string).

## Mechanical invariants

- `TrashIcon` comes from 020's set; imports are relative with `.js`
  extensions, and no `@clerk`, `swr`, `next-intl`, `next/`, `@/`
  or `lucide-react` import survives
  ([validated by](../../tests/ConversationList.test.tsx#L419)).
- GDPR: conversation titles can carry booking identifiers and names.
  The component references no
  `console.`, `localStorage`, `sessionStorage`, `fetch`, `sendBeacon`,
  `analytics` or `indexedDB`, and the
  suite-wide console trap in `tests/setup.ts` fails any test that triggered a
  console call. Titles live only in React state
  ([validated by](../../tests/ConversationList.test.tsx#L415)).
- `dist/components/ConversationList.js` opens with `"use client";` as its
  first statement per 018's positional check, and
  `npm pack` ships exactly the built pair
  ([validated by](../../tests/conversation-list-dist.test.ts#L6),
  [L10](../../tests/conversation-list-dist.test.ts#L10)).

## Recorded deviations from the issue text

- **Test locations.** The issue names `tests/components/ConversationList.test.tsx`
  and `src/__tests__/labelled-exports.tsx`; this repository keeps every test
  flat under `tests/`, and the partition file is
  `tests/labelled-exports.test.tsx`. The tests land there
  (`tests/ConversationList.test.tsx`, `tests/conversation-list-dist.test.ts`).
- **Coverage floor.** The issue says "the 100 / 100 / 100 thresholds `014`
  committed"; the committed floor is lines/functions/statements 100 with
  branches 90 (`vitest.config.ts`), and it holds.
