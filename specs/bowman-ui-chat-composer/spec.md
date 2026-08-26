# bowman-ui chat composer

Issue: issue 77 (`027-bowman-ui-chat-composer`)

`ChatComposer` is the chat input surface authored NEW for E3 - the source app
writes the textarea + attach + send block inline three times (twice in
`app/chat/page.tsx`, once in `app/chat/[id]/page.tsx`, plus a fourth divergent
Enter-to-send site in `app/comparison/page.tsx:390`) and never as a component.
Those copies are the specification, not the source: nothing is ported
verbatim, there is no 015 characterization suite, and the tests in
`tests/ChatComposer.test.tsx` are written fresh. No file in `discovery`
changes; deleting the three inline copies is the adoption issue at the end of
E3.

## The public surface

`ChatComposerProps` is exactly seven fields - `onSubmit`, `busy`, `disabled`,
`autoFocus`, `maxHeightPx`, `attachSlot`, `labels` - with an uncontrolled
draft: the source grep shows `onChange=` once (the textarea's own binding)
and no `value=` or `onValueChange` prop
([validated by](../../tests/ChatComposer.test.tsx#L337)). External writes go
through `ChatComposerHandle` (`focus()`, `setValue()`) via
`forwardRef` + `useImperativeHandle`, covering the source's only two outside
writes: clear-on-send and the DevTools text-injection helper.

**Note - first `useImperativeHandle` in the repo.** 018 Decision 4's idiom is
`forwardRef` (preserved here); `useImperativeHandle` itself has no prior use
in this package. It is standard React and needs no precedent, but no earlier
issue is cited for it.

## Submitting

- The trimmed draft is submitted once and the composer clears itself: value
  `""`, inline height back to `auto`
  ([validated by](../../tests/ChatComposer.test.tsx#L31)).
- `"  Ja  "` submits as `"Ja"` - no length floor, rejecting `the-expert-ui`'s
  3-character floor ([validated by](../../tests/ChatComposer.test.tsx#L44));
  `"   "` leaves send disabled and `onSubmit` uncalled
  ([validated by](../../tests/ChatComposer.test.tsx#L55)), also under `Enter`
  ([validated by](../../tests/ChatComposer.test.tsx#L87)).

## The keyboard

- `Enter` submits ([validated by](../../tests/ChatComposer.test.tsx#L76)) and
  preventDefaults ([validated by](../../tests/ChatComposer.test.tsx#L120));
  `Shift+Enter` inserts a newline and leaves the draft
  ([validated by](../../tests/ChatComposer.test.tsx#L97)).
- **The IME guard is the fix this component adds.** `Enter` with
  `nativeEvent.isComposing` neither submits nor preventDefaults
  ([validated by](../../tests/ChatComposer.test.tsx#L108)). None of the three
  inline copies checks it. Verified by mutation: removing the
  `event.nativeEvent.isComposing` term from `handleKeyDown` makes exactly
  this test fail (1 failed, 29 passed in the mutant run).
- `Escape` is not bound - it clears nothing and calls nothing, pinned so the
  shortcut is not added later without a decision
  ([validated by](../../tests/ChatComposer.test.tsx#L129)).

## busy and disabled

Separate props because the source distinguishes them (`isLoading ||
isStreaming` pulses, `... || isLoadingConversation` only disables). `busy`
disables both controls, swallows `Enter`, and pulses the wrapper
([validated by](../../tests/ChatComposer.test.tsx#L142)); `disabled` disables
without the pulse ([validated by](../../tests/ChatComposer.test.tsx#L165)).

**Note - pulse class.** The wrapper carries `bowman-pulse-subtle`, not the
issue text's `animate-pulse-subtle`: 019 renamed every package animation
class under the `bowman-` prefix, the same recorded deviation as
`specs/bowman-ui-chat-message/spec.md`.

## The ref handle and focus

`setValue` writes the draft, re-runs the auto-resize and re-enables send
([validated by](../../tests/ChatComposer.test.tsx#L175)); a blank write keeps
send disabled ([validated by](../../tests/ChatComposer.test.tsx#L187)); a
handle retained past unmount is a no-op
([validated by](../../tests/ChatComposer.test.tsx#L196)). `focus()` makes the
textarea `document.activeElement`
([validated by](../../tests/ChatComposer.test.tsx#L205)); `autoFocus` does
the same on mount and defaults to false
([validated by](../../tests/ChatComposer.test.tsx#L214)).

## Auto-resize

`height = auto` then `min(scrollHeight, maxHeightPx)`, the source's literal
`200` becoming the `maxHeightPx` default, `resize-none` with scroll past the
cap. jsdom performs no layout and reports `scrollHeight` 0, so the tests stub
the property (`Object.defineProperty(textarea, "scrollHeight", { value: 320,
configurable: true })`) and note it: a stubbed 320 caps at `200px` by default
([validated by](../../tests/ChatComposer.test.tsx#L225)) and reaches `320px`
with `maxHeightPx={400}`
([validated by](../../tests/ChatComposer.test.tsx#L234)). A passing test here
proves the arithmetic, never real browser layout.

## The attachment slot

No attach button ships and no paperclip glyph exists in `src/` or `dist/`
(CONTRACT.md Decision 2 - the source's attach buttons are decorative,
`onClick`-less) ([validated by](../../tests/ChatComposer.test.tsx#L342)).
With no `attachSlot`, send is the only button
([validated by](../../tests/ChatComposer.test.tsx#L245)); a supplied slot
renders left of send
([validated by](../../tests/ChatComposer.test.tsx#L251)). The wrapper is a
`div`, not a `<form>`, and every self-rendered button carries
`type="button"` ([validated by](../../tests/ChatComposer.test.tsx#L264)), so
a consumer's own wrapping form never receives a submit from the composer
([validated by](../../tests/ChatComposer.test.tsx#L272)).

## Labels and accessible names

Three flat keys per 022 Decision 2: `composerInput` (the textarea's
`aria-label` - a real accessible name, not the placeholder),
`composerPlaceholder`, and `send`. The textarea answers to the resolved
`composerInput` while showing the `composerPlaceholder`
([validated by](../../tests/ChatComposer.test.tsx#L288), defaults
[validated by](../../tests/ChatComposer.test.tsx#L302)); the send button's
accessible name is the resolved `send` label with its `SendIcon`
`aria-hidden` per 020's `getAccessibleIconProps` contract
([validated by](../../tests/ChatComposer.test.tsx#L311)).

`defaultChatComposerLabels` is `Readonly<Required<ChatComposerLabels>>`; a
key added without a default fails `npm run typecheck`, pinned by the
`@ts-expect-error` fixture in
[tests/types/chat-composer-type-assertions.tsx](../../tests/types/chat-composer-type-assertions.tsx)
compiled against `dist/` by
[tests/chat-composer-dist.test.ts](../../tests/chat-composer-dist.test.ts).
`ChatComposer` joins the `labelsProp` partition and the sentinel render
covers it in
[tests/labelled-exports.test.tsx](../../tests/labelled-exports.test.tsx).

**Note - the two-of-three placeholder nuance.** Two of the three Discovery
copies use the `chat.reply` placeholder (`"Svar..."` / `"Reply..."`); the
empty-state copy uses `chat.welcomeSubtitle`, a different welcome sentence.
The single `composerPlaceholder` default (`"Reply..."`) follows the
two-of-three majority; a consumer rendering the empty state passes its
welcome string through `labels`.

## GDPR

The draft is a customer's question and may carry booking identifiers, names
and addresses (`003-support-conversation-data-flow-record`). The component
calls no `console.*`, `localStorage`, `sessionStorage`, `fetch`,
`sendBeacon` or analytics, asserted by source grep
([validated by](../../tests/ChatComposer.test.tsx#L353)) and by the
suite-wide console trap in `tests/setup.ts`. There is no draft persistence
and no autosave: an unsent support question does not survive on the
customer's device.

## Source purity and the build

No `@clerk`, `swr`, `next-intl`, `next/`, `@discovery`, `@/` or
`lucide-react` import, and every relative import ends in `.js`
([validated by](../../tests/ChatComposer.test.tsx#L359)).
`dist/components/ChatComposer.js` opens with `"use client";` as its first
statement per 018 Decision 1's positional check, and `npm pack` ships it
with its `.d.ts`
([validated by](../../tests/chat-composer-dist.test.ts#L30)).

## Recorded deviations from the issue text

| #   | Issue text                                   | Reality                                                                                                                                               |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | `src/__tests__/labelled-exports.tsx`         | The partition/sentinel file is `tests/labelled-exports.test.tsx`; no `src/__tests__/` directory exists in this repo                                   |
| b   | `tests/components/ChatComposer.test.tsx`     | The suite lives flat as `tests/ChatComposer.test.tsx`, matching every existing component suite (`tests/ChatMessage.test.tsx`, `tests/Toast.test.tsx`) |
| c   | coverage "at the 100 / 100 / 100 thresholds" | The committed floor is lines 100 / functions 100 / statements 100 / **branches 90** (`vitest.config.ts`); this change holds 100 / 100 / 100 / 99.41   |
| d   | wrapper carries `animate-pulse-subtle`       | `bowman-pulse-subtle` - 019's package-prefix rename, same as 023's recorded deviation                                                                 |
