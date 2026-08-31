# bowman-ui message list

Issue: re-cinq/Otto#78 (`078-bowman-ui-chat-message-list`)

`ChatMessageList` is the container that holds a conversation: the transcript
column, the pinned auto-scroll, the empty state, and the EU AI Act
disclosure band, shipped as `src/components/ChatMessageList.tsx`
(`ChatMessageList`, `ChatMessageListProps`, `ChatMessageListHandle`,
`ChatMessageListLabels`, `defaultChatMessageListLabels`) and exported from
`src/index.ts`. It replaces the two diverging inline copies in Discovery's
`app/chat/page.tsx` and `app/chat/[id]/page.tsx`; no file in `discovery`
changes.

## The public surface

`ChatMessageListProps` is the thirteen fields the issue names: `entries`,
`userInitials`, `labels`, `assistantAvatar`, `busy` (default `false`),
`greeting`, `prompts`, `showFeedback`, `arrowKeyFeedback`, `markdown`,
`reducedMotion`, `onCopy`, `onFeedback` - with `showFeedback`,
`arrowKeyFeedback`, `markdown`, `onCopy`, `onFeedback` and `assistantAvatar`
forwarded to every `ChatMessage` unchanged, so their defaults stay
`ChatMessage`'s own
([validated by](../../tests/ChatMessageList.test.tsx#L221),
[markdown](../../tests/ChatMessageList.test.tsx#L249),
[avatar](../../tests/ChatMessageList.test.tsx#L267)). Entries render in
order, keyed by `entry.id` - a reorder moves the same DOM nodes - and a
copy on the second message reports that entry's id through `onCopy`
([validated by](../../tests/ChatMessageList.test.tsx#L199),
[keys](../../tests/ChatMessageList.test.tsx#L282)). Nineteen fields in
total: `specs/bowman-ui-tool-activity/spec.md` adds the four tool-entry
props `describeTool`, `showToolName`, `showToolInput` and `toolIcon`,
forwarded to every `ToolActivity` the same way,
`specs/bowman-ui-message-list-entry-footer/spec.md` adds
`renderEntryFooter`, forwarded to every `ChatMessage` as its `footer`, and
`specs/bowman-ui-entry-attribution/spec.md` adds `attribution`, the
persona-id lookup table that overrides `assistantAvatar` and supplies
`assistantName` per entry.

`ChatMessageListLabels` extends `ChatMessageLabels`, `ThinkingIndicatorLabels`
and, since `specs/bowman-ui-tool-activity/spec.md`, `ToolActivityLabels` -
the flat composite of CONTRACT.md § Labels decision 3 - plus `aiDisclosure`
(required, no default) and `transcript` (the scroll region's accessible
name, default `"Conversation"`). `ChatMessageLabels` and
`ThinkingIndicatorLabels` both declare `thinking: string`; the keys collide
legally because they name the same concept with the same type, which is
exactly decision 3's "unique by concept" rule - a future function-form
`thinking` on either side breaks the `extends` and must rename by concept.
`ToolActivityLabels`'s three keys (`activity`, `activityDone`, `details`)
add no further collision, and `assistantMessageFrom`
(`specs/bowman-ui-entry-attribution/spec.md`) rides in through
`ChatMessageLabels`. The union is therefore seventeen keys, sixteen in
`defaultChatMessageListLabels`
([validated by](../../tests/ChatMessageList.test.tsx#L186)).

Because `aiDisclosure` has no default, `ChatMessageList` is the package's
first component whose `labels` prop is itself **required**:
`labels: Partial<ChatMessageListLabels> & Required<Pick<ChatMessageListLabels, "aiDisclosure">>`.
CONTRACT.md § Labels records the exception. Omitting `aiDisclosure` is a
compile error, pinned from outside by an `@ts-expect-error` fixture, and the
defaults object cannot satisfy `Readonly<Required<ChatMessageListLabels>>`
([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L85),
[no-default](../../tests/types/chat-message-list-type-assertions.tsx#L52),
compiled by
[chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L109)).
Passing only `aiDisclosure` resolves every other label to its English
default ([validated by](../../tests/ChatMessageList.test.tsx#L179)).

## The decisions

1. **The AI disclosure is a band above the scroll region, unremovable.**
   The EU AI Act obliges telling users they are talking to an AI, and the
   obligation applies regardless of server location because the agent
   serves EU users. The component ships no default sentence, so no English
   placeholder can reach a Danish customer - the required label is the
   enforcement. The band renders outside the scroll region (it cannot
   scroll away) and above it (visible before the customer types), in both
   states, and no prop in `ChatMessageListProps` removes it - pinned by a
   render with every optional prop `false` or `undefined`
   ([validated by](../../tests/ChatMessageList.test.tsx#L141),
   [L143](../../tests/ChatMessageList.test.tsx#L156)). The type enforces
   presence, not substance: an empty string renders an empty band, and per
   CONTRACT.md § Labels decision 5 the package adds no runtime guard - a
   consumer that supplies `""` owns that compliance failure.
2. **Auto-scroll follows the bottom only while the reader is pinned.**
   Pinning is tracked on the region's `scroll` event as
   `scrollHeight - scrollTop - clientHeight <= 32`; scrolling away opts out
   until a scroll event returns the reader to the bottom
   ([validated by](../../tests/ChatMessageList.test.tsx#L598),
   [L353](../../tests/ChatMessageList.test.tsx#L615),
   [append while pinned](../../tests/ChatMessageList.test.tsx#L582)), and
   the 32px threshold is pinned at both sides of the boundary
   ([validated by](../../tests/ChatMessageList.test.tsx#L719)). One
   exception keeps the feature alive in real browsers: a smooth animation
   this component started fires downward scroll events of its own, and
   those do not unpin - reaching the bottom, or any upward reader-initiated
   movement, settles the flight
   ([validated by](../../tests/ChatMessageList.test.tsx#L745)). Mount
   always scrolls to the latest message unconditionally, instant, before
   any scroll event
   ([validated by](../../tests/ChatMessageList.test.tsx#L678)).
3. **Smooth on append, instant on delta, always instant under reduced
   motion.** `behavior: "smooth"` when `entries.length` grew, `"auto"` when
   only content changed, and `useReducedMotion(reducedMotion)` (021's hook)
   forces `"auto"` always
   ([validated by](../../tests/ChatMessageList.test.tsx#L634),
   [L391](../../tests/ChatMessageList.test.tsx#L653)). A delta must arrive
   as a **new `entries` array**: the scroll effect keys on the prop's
   identity, so a reducer that mutates in place never scrolls - the shape
   every React state update produces anyway - and the inverse holds too: a
   parent that rebuilds the array on every render issues a visually-silent
   instant scroll per render while pinned. `busy` turning on while pinned
   also scrolls (instant), so the ThinkingIndicator cannot appear below the
   fold ([validated by](../../tests/ChatMessageList.test.tsx#L689)).
4. **`scrollTo` with a `scrollTop` fallback, never `scrollIntoView`.**
   `scrollIntoView` walks to the nearest scrollable ancestor outside this
   package's control. The fallback (`node.scrollTop = node.scrollHeight`
   when `scrollTo` is not a function) exists because jsdom performs no
   layout and implements neither method - which is also why the test
   geometry (`scrollHeight`, `clientHeight`) and the `scrollTo` spy are
   stubs installed by the tests
   ([validated by](../../tests/ChatMessageList.test.tsx#L704)).
5. **The handle is the consumer's escape hatch.**
   `scrollToBottom()` scrolls even while unpinned and re-pins, so the next
   change follows again - the primitive for a consumer's own "jump to
   latest" control - and respects reduced motion
   ([validated by](../../tests/ChatMessageList.test.tsx#L805),
   [L574](../../tests/ChatMessageList.test.tsx#L836)).
   `isPinnedToBottom()` measures the live geometry rather than replaying
   the last scroll event
   ([validated by](../../tests/ChatMessageList.test.tsx#L784)) - which
   means it reports the truth at call time and can disagree with the
   event-tracked gate until the next scroll event (a resize or zoom moves
   geometry without firing one); the predicate describes the region, not
   the component's next scheduling decision. A handle retained past
   unmount is a no-op, not a crash
   ([validated by](../../tests/ChatMessageList.test.tsx#L856)).
6. **The transcript is `role="log"` with `aria-live="off"`.** The role's
   implicit `aria-live="polite"` would have a screen reader announce every
   streamed token; the resolved `transcript` label is the region's
   accessible name
   ([validated by](../../tests/ChatMessageList.test.tsx#L875)).
   `ThinkingIndicator`'s own `role="status"` subtree is the one
   announcement worth making, and it now carries an **explicit**
   `aria-live="polite"` (a one-attribute amendment to
   `src/components/ThinkingIndicator.tsx`, the ARIA-canonical spelling of
   the role's implicit value) so the override is queryable as an attribute:
   `[aria-live="polite"]` inside the region matches exactly when `busy` is
   true ([validated by](../../tests/ChatMessageList.test.tsx#L889),
   [pinned in its own suite](../../tests/ThinkingIndicator.test.tsx#L144)).
   Nothing announces that a streamed answer has finished; that needs a real
   assistive-technology check and is tracked as a Phase 3 task, not here.
7. **The scroll region always renders; the empty state replaces the
   transcript column inside it.** With `entries.length === 0 && !busy` the
   centred `greeting` and `prompts` slots render in place of the message
   column and no `ChatMessage` mounts; with entries, the slots never render
   ([validated by](../../tests/ChatMessageList.test.tsx#L92),
   [L95](../../tests/ChatMessageList.test.tsx#L108)). An empty transcript
   with `busy` shows the indicator, not the slots
   ([validated by](../../tests/ChatMessageList.test.tsx#L124)). The library
   computes neither slot: Discovery's greeting reads the clock and Clerk
   identity during render, and its prompt catalogue is CFO-domain - both
   belong to the consumer.
8. **`busy` renders exactly one `ThinkingIndicator`, after the last
   entry**, forwarding `assistantAvatar` and the `thinking`/`thinkingRegion`
   slices; `busy` false renders none
   ([validated by](../../tests/ChatMessageList.test.tsx#L414),
   [L298](../../tests/ChatMessageList.test.tsx#L428),
   [L304](../../tests/ChatMessageList.test.tsx#L434)). When to set `busy`
   is data-layer state the consumer computes.
9. **The container does not own the composer.** A `composer` slot was
   considered and rejected: it would make this a two-deliverable
   `ChatPanel` and hand the library a layout decision the consumer can make
   with two elements. `ChatComposer` (027) stays a sibling.

## Layout

The root is `flex min-h-0 flex-1 flex-col` and the region
`overflow-y-auto` with a `max-w-3xl` column at `gap-6` rhythm. Without
`min-h-0` a flex child never shrinks and the region never scrolls, so the
parent must be a bounded flex column - recorded as CONTRACT.md's
`## Layout` section, the note every consumer reads before mounting the
list.

## Carried across mechanically

- No `@clerk`, `swr`, `next-intl`, `next/`, `@discovery`, `@/` or
  `lucide-react` import, and every relative import ends in `.js`
  ([validated by](../../tests/ChatMessageList.test.tsx#L908)).
- **GDPR.** The rendered entries are customer questions carrying booking
  identifiers and names (`003-support-conversation-data-flow-record`). The
  source references no `console.`, `localStorage`, `sessionStorage`,
  `fetch`, `sendBeacon` - nor `scrollIntoView`
  ([validated by](../../tests/ChatMessageList.test.tsx#L917)); the
  suite-wide console and network traps in `tests/setup.ts` hold every test
  of this component to zero calls.
- `dist/components/ChatMessageList.js` opens with `"use client";` as its
  first statement per 018 decision 1, and ships with its `.d.ts` in the
  pack ([validated by](../../tests/chat-message-list-dist.test.ts#L85),
  [pack](../../tests/chat-message-list-dist.test.ts#L91)).
- `ChatMessageList` sits in the `labelsProp` partition bucket with a
  sentinel harness that renders a user entry, a linked assistant entry and
  the busy indicator, then clicks copy and thumbs-up so the
  interaction-only labels reach the checked DOM
  ([validated by](../../tests/labelled-exports.test.tsx#L320)). Its
  key-coverage check is the package's one asymmetric sentinel test -
  defaults keys **plus** `aiDisclosure` - because the required label is
  deliberately absent from `defaultChatMessageListLabels`
  ([validated by](../../tests/labelled-exports.test.tsx#L474)).

## Recorded decisions

- **Name.** `ChatMessageList`, not `MessageList`: the latter is a 429-line
  Discovery dev-harness component that stays put while this package is
  imported alongside it.
- **Labels forwarding.** The resolved seventeen-key object is handed to
  `ChatMessage` whole - structurally a valid `Partial<ChatMessageLabels>`
  whose six extra keys ride along harmlessly through `ChatMessage`'s own
  `resolveLabels` merge, decision 3's flat-union forwarding without an
  eleven-key copy - while `ThinkingIndicator` and `ToolActivity` each
  receive their own keys explicitly.
- **Not in scope**, per the issue: a jump-to-latest button, an
  unread-count badge, scroll-position restore, a per-entry `footer` slot
  (reopened by 133's `renderEntryFooter`,
  `specs/bowman-ui-message-list-entry-footer`), the load-error/retry block,
  virtualisation, and every Danish string - the
  greeting, the prompts and the `aiDisclosure` sentence belong to
  `support-agent`'s catalogue. Rendering `ToolChatEntry` is now in scope,
  shipped via `ToolActivity` (`specs/bowman-ui-tool-activity/spec.md`), as
  is per-entry persona chrome, shipped via `attribution`
  (`specs/bowman-ui-entry-attribution/spec.md`);
  `ThinkingChatEntry` stays excluded pending
  `087-bowman-ui-thinking-trace`.
