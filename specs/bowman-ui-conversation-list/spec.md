# bowman-ui conversation list

Issue: issue 79 (`029-bowman-ui-conversation-list`)

`ConversationList` is the one reusable quarter of the source app's 435-line
`ChatHistory.tsx` - the presentational list of conversations - extracted as
`src/components/ConversationList.tsx` (`ConversationList`,
`ConversationListProps`, `ConversationListItem`, `ConversationLinkProps`,
`ConversationListLabels`, `defaultConversationListLabels`, and the
module-private `TypewriterTitle`). Fetching, tenant filtering, routing, and
title generation stay with the consumer. No file in `discovery` changes.

## The public surface

`ConversationListItem` is the package's own five-field camelCase shape (`id`,
`title`, `timestamp?`, `badge?`, `isPlaceholderTitle?`), not the nine-field
snake_case API `Conversation`. `timestamp` arrives display-ready - the
component reads no clock and no locale: no `Date` constructor,
`toLocaleDateString` or `Intl` appears in the source, asserted by grep
([validated by](../../tests/ConversationList.test.tsx#L363)) - and `badge` is
a consumer-computed string rendered verbatim or not at all
([validated by](../../tests/ConversationList.test.tsx#L53),
[L62](../../tests/ConversationList.test.tsx#L62)).

`ConversationListLabels` has four defaulted keys - `conversations`,
`noConversations`, `loadingConversations`, and the function-form
`deleteConversation: (title) => string` per CONTRACT.md § Labels decision 4
([validated by](../../tests/ConversationList.test.tsx#L47),
[L168](../../tests/ConversationList.test.tsx#L168)). `ConversationList` sits
in the `labelsProp` partition bucket
([partition](../../tests/labelled-exports.test.tsx#L38)) and passes the
sentinel render across its list, empty and loading states, the function label
included ([harness](../../tests/labelled-exports.test.tsx#L230)).

## The four decisions

1. **`aria-current="page"` marks the active row.** The source marked it with a
   background class only, so nothing was announced. The row whose `id` equals
   `activeId` carries `aria-current="page"` on its interactive element and no
   other row does; `activeId` undefined marks none
   ([validated by](../../tests/ConversationList.test.tsx#L72),
   [L85](../../tests/ConversationList.test.tsx#L85)).
2. **`renderLink(item, props)` is the routing seam; the default is
   `<button type="button" {...props} />`.** A consumer's element must spread
   every prop it is handed - CONTRACT.md § renderLink states it, pinned
   together with the anchor round-trip and the dropped-`onClick` failure mode
   ([validated by](../../tests/ConversationList.test.tsx#L120),
   [L142](../../tests/ConversationList.test.tsx#L142),
   [L159](../../tests/ConversationList.test.tsx#L159)). `onSelect` fires
   through the spread `onClick`
   ([validated by](../../tests/ConversationList.test.tsx#L97),
   [L112](../../tests/ConversationList.test.tsx#L112)).
3. **`isPlaceholderTitle` replaces the three-literal sniffing.** The
   typewriter fires only when the title changed and the previous render's flag
   was `true` ([validated by](../../tests/ConversationList.test.tsx#L222),
   [L264](../../tests/ConversationList.test.tsx#L264)); a conversation
   genuinely titled `"Untitled"` never animates - the case
   `ChatHistory.tsx:35` animates today
   ([validated by](../../tests/ConversationList.test.tsx#L283)). The flag
   asks the producer to send what `lib/services/firestore.ts:88` already
   computes, replacing the five-site `DEFAULT_TITLES` duplication
   (`ChatHistory.tsx:35`, the conversations route, `gemini.ts:1609`,
   `firestore.ts:88`, `test-title-generation.ts:28`) rather than reproducing
   it as a sixth copy. The previous-title record is per component instance
   (rows are keyed by `item.id`), never module-scoped - a second list does
   not animate from the first's titles
   ([validated by](../../tests/ConversationList.test.tsx#L337)).
4. **Reduced motion switches the typewriter off, it does not shorten it.**
   `useReducedMotion(reducedMotion)` from 021 gates the animation; reduced
   motion takes the same one-pass replacement path a non-placeholder change
   takes ([validated by](../../tests/ConversationList.test.tsx#L294)).
   Unmounting mid-animation clears the interval
   ([validated by](../../tests/ConversationList.test.tsx#L315)).

`onDelete` fires immediately - whether deleting needs confirmation is the
consumer's product question; omitting the prop renders no button and no
`TrashIcon` ([validated by](../../tests/ConversationList.test.tsx#L168),
[L191](../../tests/ConversationList.test.tsx#L191)). `isLoading` wins over a
non-empty `items`, rendering a `role="status"` region named by
`loadingConversations`; loading off with no items renders `noConversations`
and no `<ul>` ([validated by](../../tests/ConversationList.test.tsx#L200),
[L213](../../tests/ConversationList.test.tsx#L213)).

## The 015 characterization suite, ported

Every 015 `ChatHistory` assertion with a counterpart on the extracted surface
passes in `tests/ConversationList.test.tsx` after the flips below; the
typewriter's 25ms two-phase stepping and one-pass replacement survive
verbatim, driven by props instead of a mocked SWR hook.

| #   | Flip                                                                                                                                                                                                                                              | Reason                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| a   | `bg-slate-100` on the active row's `div.group` → `aria-current="page"` on the interactive element ([L72](../../tests/ConversationList.test.tsx#L72))                                                                                              | Decision 1: the background class announced nothing                                  |
| b   | Literal-string sniffing (`"Ny samtale"`/`"New conversation"`/`"Untitled"`) → the previous render's `isPlaceholderTitle` ([L222](../../tests/ConversationList.test.tsx#L222))                                                                      | Decision 3: the rule belongs to the title producer, not the UI                      |
| c   | New test 015 never covered: `"Untitled"` → real title with the flag absent animates zero times ([L283](../../tests/ConversationList.test.tsx#L283))                                                                                               | Decision 3: the exact bug the literal list causes                                   |
| d   | The literal `sidebar.noConversations` key and the bare spinner → the resolved `noConversations` label and a named `role="status"` region ([L200](../../tests/ConversationList.test.tsx#L200), [L213](../../tests/ConversationList.test.tsx#L213)) | 022's labels convention; the spinner region was unnamed                             |
| e   | Row `<a href="/chat/${id}">` and `onNavigate` → `renderLink` and the spread `onClick` ([L120](../../tests/ConversationList.test.tsx#L120))                                                                                                        | Routing is the consumer's; `onNavigate` survives as consumer code hung on `onClick` |

Dropped, with no counterpart here: the search tests (300ms debounce, the
client-side filter over `preview`/`org_name` - fields this item type
deliberately lacks), the delete-confirmation-dialog tests (`onDelete` fires
immediately; the dialog is a future `ConfirmDialog` issue), the org-filter
tests including the `discovery:chat-history-org-filter` `localStorage` key
(Clerk state behind a feature flag, GDPR-relevant storage the package must not
touch), the new-conversation-link test (routing), and the org-badge
derivation tests (`orgFilter`/`org_id`/`currentOrgId` collapse into the
consumer-computed `badge` string).

## Carried across mechanically

- `TrashIcon` comes from 020's set; imports are relative with `.js`
  extensions, and no `@clerk`, `swr`, `next-intl`, `next/`, `@discovery`, `@/`
  or `lucide-react` import survives
  ([validated by](../../tests/ConversationList.test.tsx#L373)).
- GDPR: conversation titles carry booking identifiers and names
  (`003-support-conversation-data-flow-record`). The source references no
  `console.`, `localStorage`, `sessionStorage`, `fetch`, `sendBeacon`,
  `analytics` or `indexedDB`
  ([validated by](../../tests/ConversationList.test.tsx#L367)), and the
  suite-wide console trap in `tests/setup.ts` fails any test that triggered a
  console call. Titles live only in React state.
- `dist/components/ConversationList.js` opens with `"use client";` as its
  first statement per 018's positional check
  ([validated by](../../tests/conversation-list-dist.test.ts#L30)), and
  `npm pack` ships exactly the built pair
  ([validated by](../../tests/conversation-list-dist.test.ts#L36)).

## Recorded deviations from the issue text

- **Test locations.** The issue names `tests/components/ConversationList.test.tsx`
  and `src/__tests__/labelled-exports.tsx`; this repository keeps every test
  flat under `tests/`, and the partition file is
  `tests/labelled-exports.test.tsx`. The tests land there
  (`tests/ConversationList.test.tsx`, `tests/conversation-list-dist.test.ts`).
- **Coverage floor.** The issue says "the 100 / 100 / 100 thresholds `014`
  committed"; the committed floor is lines/functions/statements 100 with
  branches 90 (`vitest.config.ts`), and it holds.
