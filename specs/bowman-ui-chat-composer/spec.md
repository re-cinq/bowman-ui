# bowman-ui chat composer

Issue: issue 77 (`027-bowman-ui-chat-composer`)

`ChatComposer` is the package's chat input surface - the textarea + attach +
send block shipped once, as a component, instead of being re-written inline
by every consumer screen that needs it. There is no characterization
baseline: the tests in
`tests/ChatComposer.test.tsx` are written fresh against this component.

## The public surface

`ChatComposerProps` is exactly seven fields - `onSubmit`, `busy`, `disabled`,
`autoFocus`, `maxHeightPx`, `attachSlot`, `labels` - with an uncontrolled
draft: the source grep shows `onChange=` once (the textarea's own binding)
and no `value=` or `onValueChange` prop
([validated by](../../tests/ChatComposer.test.tsx#L336)). External writes go
through `ChatComposerHandle` (`focus()`, `setValue()`) via
`forwardRef` + `useImperativeHandle`, covering the only two outside
writes a consumer needs: clear-on-send and a text-injection helper
([validated by](../../tests/ChatComposer.test.tsx#L174),
[L205](../../tests/ChatComposer.test.tsx#L204)).

**Note - first `useImperativeHandle` in the repo.** 018 Decision 4's idiom is
`forwardRef` (preserved here); `useImperativeHandle` itself has no prior use
in this package. It is standard React and needs no precedent, but no earlier
issue is cited for it.

## Submitting

- The trimmed draft is submitted once and the composer clears itself: value
  `""`, inline height back to `auto`
  ([validated by](../../tests/ChatComposer.test.tsx#L30)).
- `"  Ja  "` submits as `"Ja"` - no length floor, rejecting `the-expert-ui`'s
  3-character floor;
  `"   "` leaves send disabled and `onSubmit` uncalled, also under `Enter`
  ([validated by](../../tests/ChatComposer.test.tsx#L43),
  [L55](../../tests/ChatComposer.test.tsx#L54),
  [L87](../../tests/ChatComposer.test.tsx#L86)).

## The keyboard

- `Enter` submits and preventDefaults;
  `Shift+Enter` inserts a newline and leaves the draft
  ([validated by](../../tests/ChatComposer.test.tsx#L75),
  [L120](../../tests/ChatComposer.test.tsx#L119),
  [L97](../../tests/ChatComposer.test.tsx#L96)).
- **The IME guard is the fix this component adds.** `Enter` with
  `nativeEvent.isComposing` neither submits nor preventDefaults. None of the
  three inline copies checks it. Verified by mutation: removing the
  `event.nativeEvent.isComposing` term from `handleKeyDown` makes exactly
  this test fail (1 failed, 29 passed in the mutant run;
  [validated by](../../tests/ChatComposer.test.tsx#L107)).
- `Escape` is not bound - it clears nothing and calls nothing, pinned so the
  shortcut is not added later without a decision
  ([validated by](../../tests/ChatComposer.test.tsx#L128)).

## busy and disabled

Separate props because they are different states - busy is a pulse the
reader should see, disabled is merely inert;
[validated by](../../tests/ChatComposer.test.tsx#L141),
[L165](../../tests/ChatComposer.test.tsx#L164)). `busy`
disables both controls, swallows `Enter`, and pulses the wrapper; `disabled`
disables without the pulse
([validated by](../../tests/ChatComposer.test.tsx#L141),
[L165](../../tests/ChatComposer.test.tsx#L164)).

**Note - pulse class.** The wrapper carries `bowman-pulse-subtle`, not the
issue text's `animate-pulse-subtle`: 019 renamed every package animation
class under the `bowman-` prefix, the same recorded deviation as
`specs/bowman-ui-chat-message/spec.md`
([validated by](../../tests/ChatComposer.test.tsx#L141)).

## The ref handle and focus

`setValue` writes the draft, re-runs the auto-resize and re-enables send; a
blank write keeps send disabled; a
handle retained past unmount is a no-op
([validated by](../../tests/ChatComposer.test.tsx#L174),
[L187](../../tests/ChatComposer.test.tsx#L186),
[L196](../../tests/ChatComposer.test.tsx#L195)). `focus()` makes the
textarea `document.activeElement`; `autoFocus` does
the same on mount and defaults to false
([validated by](../../tests/ChatComposer.test.tsx#L204),
[L214](../../tests/ChatComposer.test.tsx#L213)).

## Auto-resize

`height = auto` then `min(scrollHeight, maxHeightPx)`, with `200` as the
`maxHeightPx` default, `resize-none` with scroll past the
cap ([validated by](../../tests/ChatComposer.test.tsx#L224)). jsdom performs no layout and reports `scrollHeight` 0, so the tests stub
the property (`Object.defineProperty(textarea, "scrollHeight", { value: 320,
configurable: true })`) and note it: a stubbed 320 caps at `200px` by default
and reaches `320px` with `maxHeightPx={400}`
([validated by](../../tests/ChatComposer.test.tsx#L224),
[L234](../../tests/ChatComposer.test.tsx#L233)). A passing test here
proves the arithmetic, never real browser layout.

## The attachment slot

No attach button ships and no paperclip glyph exists in `src/` or `dist/`
(docs/design-notes.md decision 2 - the attach affordance is decorative,
so no button ships without a slot to fill it) ([validated by](../../tests/ChatComposer.test.tsx#L341)).
With no `attachSlot`, send is the only button; a supplied slot
renders left of send
([validated by](../../tests/ChatComposer.test.tsx#L244),
[L251](../../tests/ChatComposer.test.tsx#L250)). The wrapper is a
`div`, not a `<form>`, and every self-rendered button carries
`type="button"`, so
a consumer's own wrapping form never receives a submit from the composer
([validated by](../../tests/ChatComposer.test.tsx#L263),
[L272](../../tests/ChatComposer.test.tsx#L271)).

## Labels and accessible names

Three flat keys per 022 Decision 2: `composerInput` (the textarea's
`aria-label` - a real accessible name, not the placeholder),
`composerPlaceholder`, and `send`
([validated by](../../tests/ChatComposer.test.tsx#L301)). The textarea answers to the resolved
`composerInput` while showing the `composerPlaceholder`; the send button's
accessible name is the resolved `send` label with its `SendIcon`
`aria-hidden` per 020's `getAccessibleIconProps` contract
([validated by](../../tests/ChatComposer.test.tsx#L288), defaults
[L302](../../tests/ChatComposer.test.tsx#L301),
[L311](../../tests/ChatComposer.test.tsx#L310)).

`defaultChatComposerLabels` is `Readonly<Required<ChatComposerLabels>>`; a
key added without a default fails `npm run typecheck`, pinned by the
`@ts-expect-error` fixture in `tests/types/chat-composer-type-assertions.tsx`
compiled against `dist/`
([validated by](../../tests/chat-composer-dist.test.ts#L47), fixture at
[chat-composer-type-assertions](../../tests/types/chat-composer-type-assertions.tsx)).
`ChatComposer` joins the `labelsProp` partition and the sentinel render
covers it ([validated by](../../tests/labelled-exports.test.tsx#L484)).

**Note - one placeholder default.** The single `composerPlaceholder`
default (`"Reply..."`) is the mid-conversation reply prompt, the composer's
common case. A consumer rendering an empty state passes its own
welcome sentence through `labels` instead of the package shipping a second
default
([validated by](../../tests/ChatComposer.test.tsx#L301)).

## GDPR

The draft is a customer's question and may carry booking identifiers, names
and addresses (`003-support-conversation-data-flow-record`). The component
calls no `console.*`, `localStorage`, `sessionStorage`, `fetch`,
`sendBeacon` or analytics, asserted by source grep and by the
suite-wide console trap in `tests/setup.ts`
([validated by](../../tests/ChatComposer.test.tsx#L352)). There is no draft persistence
and no autosave: an unsent support question does not survive on the
customer's device ([validated by](../../tests/ChatComposer.test.tsx#L352)).

## Source purity and the build

No `@clerk`, `swr`, `next-intl`, `next/`, `@/` or
`lucide-react` import, and every relative import ends in `.js`
([validated by](../../tests/ChatComposer.test.tsx#L360)).
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
