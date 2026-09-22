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
([validated by reads no clock and no locale: no Date constructor, no toLocaleDateString, no Intl](../../tests/ConversationList.test.tsx#L497),
[validated by timestamp "Ayer" and badge "Marginalia Books Ltd" render verbatim in the row](../../tests/ConversationList.test.tsx#L89),
[validated by timestamp "Ayer" and badge "Marginalia Books Ltd" render verbatim in the row](../../tests/ConversationList.test.tsx#L96)).

`ConversationListLabels` has four defaulted keys - `conversations`,
`noConversations`, `loadingConversations`, and the function-form
`deleteConversation: (title) => string` per docs/design-notes.md § Labels decision 4.
`ConversationList` sits
in the `labelsProp` partition bucket and passes the
sentinel render across its list, empty and loading states, the function label
included ([partition](../../tests/labelled-exports.test.tsx#L85),
[harness](../../tests/labelled-exports.test.tsx#L505),
[validated by onDelete renders one button per row named "Delete conversation: Booking 4711"; clicking it calls onDelete with the id and onSelect zero times](../../tests/ConversationList.test.tsx#L248),
[defaults](../../tests/labelled-exports.test.tsx#L597)).

## The four decisions

1. **`aria-current="page"` marks the active row.** A background class alone
   announces nothing to assistive tech. The row whose `id` equals
   `activeId` carries `aria-current="page"` on its interactive element and no
   other row does; `activeId` undefined marks none
   ([validated by only the row whose id equals activeId carries aria-current="page" on its interactive element](../../tests/ConversationList.test.tsx#L111),
   [validated by only the row whose id equals activeId carries aria-current="page" on its interactive element](../../tests/ConversationList.test.tsx#L122),
   [validated by with activeId undefined no row carries aria-current](../../tests/ConversationList.test.tsx#L125)).
2. **`renderLink(item, props)` is the routing seam; the default is
   `<button type="button" {...props} />`.** A consumer's element must spread
   every prop it is handed - docs/design-notes.md § renderLink states it, pinned
   together with the anchor round-trip and the dropped-`onClick` failure
   mode. `onSelect` fires through the spread `onClick`
   ([validated by a renderLink that spreads everything except onClick calls onSelect zero times](../../tests/ConversationList.test.tsx#L236),
   [validated by anchors carry the component's className and aria-current, and clicking one calls onSelect with that id](../../tests/ConversationList.test.tsx#L197),
   [validated by anchors carry the component's className and aria-current, and clicking one calls onSelect with that id](../../tests/ConversationList.test.tsx#L218),
   [validated by clicking a row calls onSelect once with "conv-2"](../../tests/ConversationList.test.tsx#L173)).
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
   ([validated by a rerender from a placeholder "New thread" to "Booking 4711" steps character by character at 25ms intervals](../../tests/ConversationList.test.tsx#L304),
   [validated by a rerender from "Booking 4711" to "Booking 4712", neither a placeholder, replaces the text in one pass with zero timer ticks](../../tests/ConversationList.test.tsx#L345),
   [validated by a rerender from "Untitled" to "Booking 4711" with isPlaceholderTitle absent on both animates zero times - the case literal-title sniffing would animate](../../tests/ConversationList.test.tsx#L362),
   [validated by a second list does not animate from the first list's titles - the previous-title record is component-scoped, not module-scoped](../../tests/ConversationList.test.tsx#L428)).
4. **Reduced motion switches the typewriter off, it does not shorten it.**
   `useReducedMotion(reducedMotion)` from 021 gates the animation; reduced
   motion takes the same one-pass replacement path a non-placeholder change
   takes. Unmounting mid-animation clears the interval
   ([validated by reducedMotion={true} makes the placeholder-to-real transition a one-pass replacement with zero timer ticks](../../tests/ConversationList.test.tsx#L371),
   [validated by unmounting mid-animation clears the interval - advancing past the full run afterwards produces no state update and no act warning](../../tests/ConversationList.test.tsx#L390)).

`onDelete` fires immediately - whether deleting needs confirmation is the
consumer's product question; omitting the prop renders no button and no
`TrashIcon`. `isLoading` wins over a
non-empty `items`, rendering a `role="status"` region named by
`loadingConversations`; loading off with no items renders `noConversations`
and no `<ul>` ([validated by isLoading renders a role="status" element named "Loading conversations" and zero rows, even with two items](../../tests/ConversationList.test.tsx#L282),
[L295](../../tests/ConversationList.test.tsx#L295),
[validated by onDelete renders one button per row named "Delete conversation: Booking 4711"; clicking it calls onDelete with the id and onSelect zero times](../../tests/ConversationList.test.tsx#L248),
[validated by onDelete omitted renders no TrashIcon and no delete button](../../tests/ConversationList.test.tsx#L273)).

The delete button is `opacity-0` until its row is hovered or focused within;
measured in Chromium and WebKit, its computed opacity is `0` at rest and `1` on focus,
and `Enter` then removes the row from the demo's list (issue 151)
([validated by the current conversation's delete button is invisible at rest, revealed on focus, and Enter removes the row and moves the current mark](../../examples/chat-demo/tests/chat-demo.spec.ts#L520)).

## The characterization suite

The deliberate decisions below are each pinned in
`tests/ConversationList.test.tsx`; the
typewriter's 25ms two-phase stepping and one-pass replacement are pinned
verbatim, driven by props instead of a data-fetching hook
([validated by a rerender from a placeholder "New thread" to "Booking 4711" steps character by character at 25ms intervals](../../tests/ConversationList.test.tsx#L304),
[validated by a rerender from "Booking 4711" to "Booking 4712", neither a placeholder, replaces the text in one pass with zero timer ticks](../../tests/ConversationList.test.tsx#L345)).

| #   | Decision                                                                                                                                                                                                                                                                                                                                | Reason                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| a   | The active row carries `aria-current="page"` on its interactive element, never a background class alone ([validated by only the row whose id equals activeId carries aria-current="page" on its interactive element](../../tests/ConversationList.test.tsx#L111))                                                                       | Decision 1: a background class announces nothing to assistive tech          |
| b   | The previous render's `isPlaceholderTitle` flag drives the typewriter, never literal-string sniffing (`"New thread"`/`"New conversation"`/`"Untitled"`) ([validated by a rerender from a placeholder "New thread" to "Booking 4711" steps character by character at 25ms intervals](../../tests/ConversationList.test.tsx#L304))        | Decision 3: the rule belongs to the title producer, not the UI              |
| c   | `"Untitled"` → real title with the flag absent animates zero times ([validated by a rerender from "Untitled" to "Booking 4711" with isPlaceholderTitle absent on both animates zero times - the case literal-title sniffing would animate](../../tests/ConversationList.test.tsx#L362))                                                 | Decision 3: the exact bug literal-string sniffing causes                    |
| d   | The empty and loading states render the resolved `noConversations` label and a named `role="status"` region ([validated by isLoading renders a role="status" element named "Loading conversations" and zero rows, even with two items](../../tests/ConversationList.test.tsx#L282), [L295](../../tests/ConversationList.test.tsx#L295)) | 022's labels convention; a spinner region must be named                     |
| e   | `renderLink` and the spread `onClick` carry routing and selection ([validated by anchors carry the component's className and aria-current, and clicking one calls onSelect with that id](../../tests/ConversationList.test.tsx#L197))                                                                                                   | Routing is the consumer's; consumer navigation behaviour hangs on `onClick` |

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
  ([validated by no @clerk, swr, next-intl, next/, @/ or lucide-react import, and every relative import ends in .js](../../tests/ConversationList.test.tsx#L505)).
- The delete button's hover reads the danger role (`--bowman-danger`) rather than a lone
  `red-500`, moving to the role's `red-600` per § Theming decision 6 so the destructive
  affordance re-themes; its rest colour reads the `--bowman-text-subtle` role in place of
  the `text-slate-400` palette class, the icon-control fold issue 104 shipped
  ([validated by the delete button's hover reads the danger role, not the lone red-500](../../tests/ConversationList.test.tsx#L159),
  [validated by the delete button reads text-subtle at rest, its danger hover left to the danger role](../../tests/ConversationList.test.tsx#L165)).
- The full title also renders as plain text in a `bowman-sr-only` span and the
  per-character run is `aria-hidden`, so assistive tech reads the whole title - and, mid-animation,
  already the new one - while the visible characters step
  ([validated by the full title "Booking 4711" is plain text for assistive tech, hidden by the bowman-sr-only class, and the per-character spans are aria-hidden](../../tests/ConversationList.test.tsx#L406),
  [validated by mid-animation, assistive tech already reads the new title while the characters still show the old one](../../tests/ConversationList.test.tsx#L415)).
- The `<ul>` carries an explicit `role="list"` because Safari drops a `list-style: none` list's
  semantics, and its accessible name with them
  ([validated by `the <ul> carries an explicit role="list", which list-style: none cannot strip`](../../tests/ConversationList.test.tsx#L74)).
- The typewriter splits a title by code point (`Array.from`), never by UTF-16 unit, so an emoji is
  one span before, during and after the animation; grapheme clusters stay out of scope because
  `Intl` is banned from the file
  ([validated by the title "📦 Booking" renders nine spans, one per code point, never a lone surrogate](../../tests/ConversationList.test.tsx#L449),
  [validated by animating from the placeholder "🧳 New thread" to "📦 Booking 4711" fades twelve then fourteen code-point spans](../../tests/ConversationList.test.tsx#L456),
  [validated by a one-pass replacement from "Booking 4711" to "📦 Booking" settles on nine code-point spans](../../tests/ConversationList.test.tsx#L481),
  [validated by reads no clock and no locale: no Date constructor, no toLocaleDateString, no Intl](../../tests/ConversationList.test.tsx#L497)).
- GDPR: conversation titles can carry booking identifiers and names.
  The component references no
  `console.`, `localStorage`, `sessionStorage`, `fetch`, `sendBeacon`,
  `analytics` or `indexedDB`, and the
  suite-wide console trap in `tests/setup.ts` fails any test that triggered a
  console call. Titles live only in React state
  ([validated by `GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics`](../../tests/ConversationList.test.tsx#L501)).
- `dist/components/ConversationList.js` opens with `"use client";` as its
  first statement per 018's positional check, and
  `npm pack` ships exactly the built pair
  ([validated by dist/components/ConversationList.js opens with "use client"; as its first statement](../../tests/conversation-list-dist.test.ts#L6),
  [validated by npm pack --dry-run ships dist/components/ConversationList.js with its d.ts](../../tests/conversation-list-dist.test.ts#L10)).

## Recorded deviations from the issue text

- **Test locations.** The issue names `tests/components/ConversationList.test.tsx`
  and `src/__tests__/labelled-exports.tsx`; this repository keeps every test
  flat under `tests/`, and the partition file is
  `tests/labelled-exports.test.tsx`. The tests land there
  (`tests/ConversationList.test.tsx`, `tests/conversation-list-dist.test.ts`).
- **Coverage floor.** The issue says "the 100 / 100 / 100 thresholds `014`
  committed"; the floor was lines/functions/statements 100 with branches 90
  when this landed (100 on all four since issue 152), and it holds.
