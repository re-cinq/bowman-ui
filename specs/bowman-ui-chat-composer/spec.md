# bowman-ui chat composer

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Issue  | issue 77 (`027-bowman-ui-chat-composer`) |
| Status | In Progress                              |

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
([validated by the textarea is uncontrolled: onChange= is its own binding and no value= or onValueChange prop exists](../../tests/ChatComposer.test.tsx#L459)). External writes go
through `ChatComposerHandle` (`focus()`, `setValue()`) via
`forwardRef` + `useImperativeHandle`, covering the only two outside
writes a consumer needs: clear-on-send and a text-injection helper
([validated by](../../tests/ChatComposer.test.tsx#L257),
[L290](../../tests/ChatComposer.test.tsx#L290),
[validated by ChatComposer is a forwardRef<ChatComposerHandle, ChatComposerProps> component - never ref-as-prop](../../tests/ChatComposer.test.tsx#L486)).

**Note - first `useImperativeHandle` in the repo.** 018 Decision 4's idiom is
`forwardRef` (preserved here); `useImperativeHandle` itself has no prior use
in this package. It is standard React and needs no precedent, but no earlier
issue is cited for it.

## Submitting

- The trimmed draft is submitted once and the composer clears itself: value
  `""`, inline height back to `auto`, and send disabled again - from the
  button and from `Enter` alike
  ([validated by typing "Hvor er min booking?" and clicking send calls onSubmit once with exactly that string, then the draft is "", the height is back to auto and send is disabled again](../../tests/ChatComposer.test.tsx#L46),
  [validated by Enter submits the trimmed draft once, then the draft is "", the height is back to auto and send is disabled again](../../tests/ChatComposer.test.tsx#L91)).
- `"  Ja  "` submits as `"Ja"` - no length floor, rejecting `the-expert-ui`'s
  3-character floor;
  `"   "` leaves send disabled and `onSubmit` uncalled, also under `Enter`
  ([validated by " Ja " submits as "Ja" - trimmed, with no length floor](../../tests/ChatComposer.test.tsx#L57),
  [validated by " " leaves the send button disabled and onSubmit uncalled](../../tests/ChatComposer.test.tsx#L69),
  [validated by Enter on a whitespace-only draft calls onSubmit zero times](../../tests/ChatComposer.test.tsx#L102)).

## The keyboard

- `Enter` submits and preventDefaults;
  `Shift+Enter` inserts a newline and leaves the draft
  ([validated by Enter submits the trimmed draft once, then the draft is "", the height is back to auto and send is disabled again](../../tests/ChatComposer.test.tsx#L91),
  [validated by plain Enter preventDefaults, so no newline leaks into the cleared draft](../../tests/ChatComposer.test.tsx#L138),
  [validated by Shift+Enter does not submit and leaves the draft in the box](../../tests/ChatComposer.test.tsx#L113)).
- Modified `Enter` is decided (issue 135, option c): `Ctrl+Enter` and
  `Meta+Enter` submit and preventDefault exactly like plain `Enter`; `Alt+Enter` joins
  `Shift+Enter` as a newline chord - no submit, no preventDefault, the draft
  stays - and a chord carrying Shift or Alt next to Ctrl or Meta is a newline
  chord too. `isNewlineChord` names the pair so `handleKeyDown` stays inside
  the two-operator budget. The browser's own newline insertion is unasserted:
  jsdom inserts nothing, and the Playwright case pins only that no entry is
  appended and the draft survives, with or without a trailing newline
  ([validated by Ctrl+Enter submits the trimmed draft once and clears the box like plain Enter](../../tests/ChatComposer.test.tsx#L120),
  [validated by Meta+Enter submits the trimmed draft once and clears the box like plain Enter](../../tests/ChatComposer.test.tsx#L132),
  [validated by Alt+Enter does not submit, does not preventDefault and leaves the draft in the box](../../tests/ChatComposer.test.tsx#L144),
  [validated by Shift+Enter does not submit and leaves the draft in the box](../../tests/ChatComposer.test.tsx#L113),
  [validated by Ctrl+Shift+Enter does not submit: Shift wins over Ctrl](../../tests/ChatComposer.test.tsx#L157),
  [validated by Alt+Enter appends no entry and keeps the draft in the box](../../examples/chat-demo/tests/chat-demo.spec.ts#L367)).
- **The IME guard is the fix this component adds.** `Enter` with
  `nativeEvent.isComposing` neither submits nor preventDefaults. None of the
  three inline copies checks it. Verified by mutation: removing the
  `event.nativeEvent.isComposing` term from `handleKeyDown` makes exactly
  this test fail (1 failed, 29 passed in the mutant run;
  [validated by Enter while isComposing does not submit and does not preventDefault - the IME guard the inline copies lack](../../tests/ChatComposer.test.tsx#L125)).
- `Escape` is not bound - it clears nothing and calls nothing, pinned so the
  shortcut is not added later without a decision
  ([validated by Escape does not clear the draft and calls nothing - pinned so the shortcut is not added without a decision](../../tests/ChatComposer.test.tsx#L147)).

## busy and disabled

Separate props because they are different states - busy is a pulse the
reader should see, disabled is merely inert. `busy`
disables both controls, swallows `Enter`, and pulses the wrapper; `disabled`
disables without the pulse
([validated by busy disables the textarea and the send button, Enter calls onSubmit zero times, and the wrapper pulses](../../tests/ChatComposer.test.tsx#L161),
[validated by disabled without busy disables both and the wrapper carries no pulse class](../../tests/ChatComposer.test.tsx#L185)).

A draft typed before `busy` survives the toggle: the textarea is uncontrolled
and never remounts, so its value and the enabled send button return once
`busy` is false again
([validated by a draft typed before busy survives the toggle: "Hvor er min booking?" and the enabled send button return once busy is false](../../tests/ChatComposer.test.tsx#L193)).

The wrapper also carries `aria-busy`: `"true"` while `busy`, `"false"` when
idle and when merely `disabled`, so assistive technology hears the pulse the
sighted reader sees
([validated by busy disables the textarea and the send button, Enter calls onSubmit zero times, and the wrapper pulses](../../tests/ChatComposer.test.tsx#L168)).

**Note - pulse class.** The wrapper carries `bowman-pulse-subtle`, not the
issue text's `animate-pulse-subtle`: 019 renamed every package animation
class under the `bowman-` prefix, the same recorded deviation as
`specs/bowman-ui-chat-message/spec.md`
([validated by busy disables the textarea and the send button, Enter calls onSubmit zero times, and the wrapper pulses](../../tests/ChatComposer.test.tsx#L161)).

## The ref handle and focus

`setValue` writes the draft, re-runs the auto-resize and re-enables send; a
blank write keeps send disabled; a
handle retained past unmount is a no-op. `focus()` makes the
textarea `document.activeElement`; `autoFocus` does
the same on mount and defaults to false
([validated by](../../tests/ChatComposer.test.tsx#L290),
[validated by autoFocus focuses the textarea on mount, and its default is false](../../tests/ChatComposer.test.tsx#L300),
[L257](../../tests/ChatComposer.test.tsx#L257),
[validated by setValue with a blank string leaves the send button disabled](../../tests/ChatComposer.test.tsx#L270),
[validated by setValue on a handle retained past unmount is a no-op, not a crash](../../tests/ChatComposer.test.tsx#L280)).

After a send that leaves the composer active, the textarea is
`document.activeElement` again whether the submit came from `Enter` or from
the send button: `submit` focuses the textarea before it calls `onSubmit` -
so a consumer that moves focus on purpose inside `onSubmit` wins, and one
that sets `busy` there disables the field in the same commit, as the section
above records - and before the re-render disables send, so a keyboard user
who tabbed to send never lands on `body` (issue 131; the demo, which passes
no `busy`, proves Tab to send then `Enter` and then `Space` in a real
Chromium)
([validated by clicking the focused send button submits, disables send, and leaves the textarea as document.activeElement](../../tests/ChatComposer.test.tsx#L410),
[validated by Enter keeps the textarea as document.activeElement after the submit](../../tests/ChatComposer.test.tsx#L424),
[validated by an onSubmit that focuses an outside button wins: that button is document.activeElement after send](../../tests/ChatComposer.test.tsx#L435),
[validated by Tab to send then Enter or Space appends the entry and returns focus to the textarea](../../examples/chat-demo/tests/chat-demo.spec.ts#L388)).

## Auto-resize

`height = auto` then `min(scrollHeight, maxHeightPx)`, with `200` as the
`maxHeightPx` default, `resize-none` with scroll past the
cap. jsdom performs no layout and reports `scrollHeight` 0, so the tests stub
the property (`Object.defineProperty(textarea, "scrollHeight", { value: 320,
configurable: true })`) and note it: a stubbed 320 caps at `200px` by default
and reaches `320px` with `maxHeightPx={400}`
([validated by a stubbed scrollHeight of 320 caps the height at 200px under the default maxHeightPx](../../tests/ChatComposer.test.tsx#L312),
[validated by the same 320 becomes 320px with maxHeightPx={400}](../../tests/ChatComposer.test.tsx#L321)). A passing test here
proves the arithmetic, never real browser layout.

## The attachment slot

No attach button ships and no paperclip glyph exists in `src/` or `dist/`
(docs/design-notes.md decision 2 - the attach affordance is decorative,
so no button ships without a slot to fill it) ([validated by no paperclip glyph appears anywhere in src/ or dist/](../../tests/ChatComposer.test.tsx#L464)).
With no `attachSlot`, send is the only button; a supplied slot
renders left of send
([validated by with no attachSlot, send is the only button in the document](../../tests/ChatComposer.test.tsx#L332),
[validated by attachSlot renders left of send](../../tests/ChatComposer.test.tsx#L338)). The wrapper is a
`div`, not a `<form>`, and every self-rendered button carries
`type="button"`, so
a consumer's own wrapping form never receives a submit from the composer
([validated by every button the component renders itself carries type="button"](../../tests/ChatComposer.test.tsx#L352),
[validated by `clicking send inside a consumer's <form onSubmit> does not fire the form's submit handler`](../../tests/ChatComposer.test.tsx#L360)).

## Labels and accessible names

Three flat keys per 022 Decision 2: `composerInput` (the textarea's
`aria-label` - a real accessible name, not the placeholder),
`composerPlaceholder`, and `send`
([validated by the defaults name the textarea "Your message" with placeholder "Reply..."](../../tests/ChatComposer.test.tsx#L391)). The textarea answers to the resolved
`composerInput` while showing the `composerPlaceholder`; the send button's
accessible name is the resolved `send` label with its `SendIcon`
`aria-hidden` per 020's `getAccessibleIconProps` contract
([validated by the textarea's accessible name is the resolved composerInput label, distinct from the "Responder..." placeholder](../../tests/ChatComposer.test.tsx#L378), defaults
[validated by the defaults name the textarea "Your message" with placeholder "Reply..."](../../tests/ChatComposer.test.tsx#L391),
[validated by the send button's accessible name is the resolved send label and its SendIcon is aria-hidden](../../tests/ChatComposer.test.tsx#L400)).

`defaultChatComposerLabels` is `Readonly<Required<ChatComposerLabels>>`; a
key added without a default fails `npm run typecheck`, pinned by the
`@ts-expect-error` fixture in `tests/types/chat-composer-type-assertions.tsx`
compiled against `dist/` (fixture at
[chat-composer-type-assertions](../../tests/types/chat-composer-type-assertions.tsx)).
`ChatComposer` joins the `labelsProp` partition and the sentinel render
covers it ([partition](../../tests/labelled-exports.test.tsx#L84),
[harness](../../tests/labelled-exports.test.tsx#L453),
[coverage](../../tests/labelled-exports.test.tsx#L591),
[validated by tsc accepts chat-composer-type-assertions.tsx against dist via the '.' exports entry, pinning the @ts-expect-error fixture](../../tests/chat-composer-dist.test.ts#L18)).

**Note - one placeholder default.** The single `composerPlaceholder`
default (`"Reply..."`) is the mid-conversation reply prompt, the composer's
common case. A consumer rendering an empty state passes its own
welcome sentence through `labels` instead of the package shipping a second
default
([validated by the defaults name the textarea "Your message" with placeholder "Reply..."](../../tests/ChatComposer.test.tsx#L391)).

## Theming

The send button paints its glyph with `--bowman-text-on-accent`, a single `white` value in both
modes, so a consumer who sets a pale `--bowman-accent` can darken the icon to keep it legible;
the rest of the composer's palette is covered by `specs/bowman-ui-theming-tokens/spec.md`
([validated by the send button reads --bowman-text-on-accent for its text, one value in both modes](../../tests/ChatComposer.test.tsx#L229)).
Disabled - no draft, `busy` or `disabled` - the button reads `--bowman-text-subtle` for its
glyph and `--bowman-active` for its surface under a `disabled:` prefix, two existing roles and
none of its own
([validated by the disabled send button reads --bowman-text-subtle for its text and --bowman-active for its background, light and dark](../../tests/ChatComposer.test.tsx#L247)).

## GDPR

The draft is a customer's question and may carry booking identifiers, names
and addresses (`003-support-conversation-data-flow-record`). The component
calls no `console.*`, `localStorage`, `sessionStorage`, `fetch`,
`sendBeacon` or analytics, asserted by source grep and by the
suite-wide console trap in `tests/setup.ts`
([validated by `GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics, and holds no draft persistence`](../../tests/ChatComposer.test.tsx#L476)). There is no draft persistence
and no autosave: an unsent support question does not survive on the
customer's device ([validated by `GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics, and holds no draft persistence`](../../tests/ChatComposer.test.tsx#L476)).

## Source purity and the build

No `@clerk`, `swr`, `next-intl`, `next/`, `@/` or
`lucide-react` import, and every relative import ends in `.js`.
`dist/components/ChatComposer.js` opens with `"use client";` as its first
statement per 018 Decision 1's positional check, and `npm pack` ships it
with its `.d.ts`
([validated by dist/components/ChatComposer.js opens with "use client"; as its first statement](../../tests/chat-composer-dist.test.ts#L10),
[validated by no @clerk, swr, next-intl, next/, @/ or lucide-react import, and every relative import ends in .js](../../tests/ChatComposer.test.tsx#L480)).

## Recorded deviations from the issue text

| #   | Issue text                                   | Reality                                                                                                                                                        |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | `src/__tests__/labelled-exports.tsx`         | The partition/sentinel file is `tests/labelled-exports.test.tsx`; no `src/__tests__/` directory exists in this repo                                            |
| b   | `tests/components/ChatComposer.test.tsx`     | The suite lives flat as `tests/ChatComposer.test.tsx`, matching every existing component suite (`tests/ChatMessage.test.tsx`, `tests/Toast.test.tsx`)          |
| c   | coverage "at the 100 / 100 / 100 thresholds" | The floor was lines 100 / functions 100 / statements 100 / **branches 90** when this landed (100 on all four since issue 152); it held 100 / 100 / 100 / 99.41 |
| d   | wrapper carries `animate-pulse-subtle`       | `bowman-pulse-subtle` - 019's package-prefix rename, same as 023's recorded deviation                                                                          |
