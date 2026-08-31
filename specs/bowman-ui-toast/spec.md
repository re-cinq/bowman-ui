# bowman-ui toast

Issue: re-cinq/Otto#75 (`025-bowman-ui-toast`)

`Toast` is the transient notification surface lifted from the source app's
`components/chat/Toast.tsx` (26 lines), extracted as
`src/components/Toast.tsx` (`Toast`, `ToastProps`) with a re-render-proof
auto-dismiss timer. No file in `discovery` changes. The component is dead code
at the source - `setToastMessage` is called only with `null` inside the
toast's own `onClose`, so `{toastMessage && <Toast/>}` never renders for a
user - and shipped on thin call-site evidence, the same precedent 021's Why
section set when it shipped `useReducedMotion`, `useSidebarState` and
`ErrorBoundary`. The two future users 025 named both declined it, recorded
here as history:
054 declined the escalation toast (the hand-off renders in the transcript);
064 declined the failover toast (success silent, failure on 044's error
frame). The component's only consumer in the org, measured by 097, is
`044-support-agent-chat-wiring`'s `ChatScreen.tsx` in the support agent,
which mounts it twice - a reconnect notice and a connection-failed notice,
both persistent conditions. `CONTRACT.md § Toast (issue 025)` records the
corrected justification.

## The public surface

`ToastProps` is exactly `message: string`, `onClose: () => void`,
`duration?: number | null` (default `2000`; `null` disables auto-dismiss)
([validated by](../../tests/Toast.test.tsx#L51),
[L135](../../tests/Toast.test.tsx#L135)).
No `labels` prop and no `className`: the fixed positioning
(`fixed bottom-8 left-1/2 z-50 -translate-x-1/2`) and the fade animation's
restated `-50%` translate are one decision that stays together
([validated by](../../tests/Toast.test.tsx#L87)). `message` renders inside
an element with `role="status"` and `aria-live="polite"`
([validated by](../../tests/Toast.test.tsx#L26)). Since the 2026-08-26
review the positioned pill and the status region are two elements: the
aria-hidden pill shows the message from the first render, and the separate
inline-visually-hidden status region receives it in the mount effect, so the
live region exists before its text and screen readers announce it
([validated by](../../tests/Toast.test.tsx#L34),
[L43](../../tests/Toast.test.tsx#L43)).

## The timer fix

The source keyed its timeout effect on `[onClose, duration]`, so a parent
re-render with a fresh `onClose` identity - which a streaming chat page
produces constantly - restarted the countdown before it could fire. Here the
latest `onClose` lives in a ref updated in its own effect, the timeout
effect keys on `[message, duration]`, and the timer calls
`onCloseRef.current()` ([validated by](../../tests/Toast.test.tsx#L105)):

- **The divergence.** A new `onClose` identity at 1000ms does not restart
  the countdown: the latest callback fires exactly once at 2000ms total,
  the stale one never.
  Verified by mutation: reverting the timer to the original
  `[onClose, duration]`-keyed `setTimeout(onClose, duration)` effect makes
  this test fail (2 failed, 9 passed in the mutant run;
  [validated by](../../tests/Toast.test.tsx#L105)).
- A different `message` on the same instance restarts the countdown:
  `onClose` fires 2000ms after the new message - this also fails
  against the original implementation, which never keyed on `message`
  ([validated by](../../tests/Toast.test.tsx#L121)).
- `duration={null}` calls `onClose` zero times after 60000ms of fake-timer
  advance and `setTimeout` is never invoked, asserted on a spy. The library
  ships no close button, so in that mode dismissal is entirely the
  consumer's - 044's connection notices are conditions that persist for as
  long as they hold and must not vanish on their own
  ([validated by](../../tests/Toast.test.tsx#L135)).

All of 015's timer assertions pass unchanged: uncalled at 1999ms, called
once at 2000ms;
`duration={500}` fires at 500ms; unmounting before the
deadline never calls it ([validated by](../../tests/Toast.test.tsx#L51),
[L62](../../tests/Toast.test.tsx#L62),
[L73](../../tests/Toast.test.tsx#L73)).

## The 015 characterization suite, ported

Four of the five source assertions survive verbatim in
`tests/Toast.test.tsx` (role/aria-live, the 1999/2000ms edge,
`duration={500}`, unmount cleanup;
[validated by](../../tests/Toast.test.tsx#L26),
[L51](../../tests/Toast.test.tsx#L51),
[L62](../../tests/Toast.test.tsx#L62),
[L73](../../tests/Toast.test.tsx#L73)). One adaptation:

| #   | Adaptation                                                                                                                                                                                                                                               | Reason                                                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | The class assertion flips from `toHaveClass("animate-fade-in")` to `bowman-toast-fade-in` plus the positioning classes, asserted on the visible pill since the 2026-08-26 review split it from the status region ([L87](../../tests/Toast.test.tsx#L87)) | 019's CSS rename - every package animation class ships under the `bowman-` prefix so it cannot collide with a consumer's `animate-*` utilities. This is the rename, not the timer fix |

The divergence, message-restart and duration-null tests above are new, not
adaptations: they pin behaviour the source component did not have
([validated by](../../tests/Toast.test.tsx#L105),
[L121](../../tests/Toast.test.tsx#L121),
[L135](../../tests/Toast.test.tsx#L135)).

## The stylesheet

019's fadeIn split reserved the centring half for this extraction: because
the animated `transform` would otherwise overwrite the element's static
`-translate-x-1/2` centring for its 0.2s run, `bowman-fade-in` stays
`translateX`-free while
the new `bowman-toast-fade-in` keyframe restates `translateX(-50%)` in
both stops ([validated by](../../tests/styles.test.ts#L57),
[L64](../../tests/styles.test.ts#L64)). The keyframe count grows to
four with a paired utility rule; the
`prefers-reduced-motion: reduce` block from 019 Decision 5 covers
`.bowman-toast-fade-in` and touches no `transform`, so the element stays
positioned when animation is off
([validated by](../../tests/styles.test.ts#L28),
[L38](../../tests/styles.test.ts#L38),
[L72](../../tests/styles.test.ts#L72)).
`grep -rn "animate-fade-in" src/` returns nothing
([validated by](../../tests/Toast.test.tsx#L166)).

## The partition amendment

`Toast` is the **third** `stringPropOnly` exception: `message` is
caller-supplied content with nothing to default, so a one-key labels
wrapper would add ceremony without adding safety - the same shape as the
icons' `ariaLabel` and `useFocusGroups`' `announce`
([validated by](../../tests/labelled-exports.test.tsx#L98)). Per the closed-list
rule, this PR carries the amendment itself: `CONTRACT.md § Labels` now
documents three exceptions with the reason above, and
`specs/bowman-ui-labels-convention/spec.md`'s closed-list bullet now states
that an addition requires exactly this kind of same-PR contract amendment.
`tests/labelled-exports.test.tsx` classifies `Toast` under `stringPropOnly`
and the partition still asserts the full barrel
([validated by](../../tests/labelled-exports.test.tsx#L98),
[L127](../../tests/labelled-exports.test.tsx#L133)).

## Carried across mechanically

- `"use client"` as the first statement of `dist/components/Toast.js`, per
  018 Decision 1's positional check and
  `scripts/check-client-directives.mjs`; `npm pack` ships the built file
  with its `d.ts` ([validated by](../../tests/toast-dist.test.ts#L30),
  [L36](../../tests/toast-dist.test.ts#L36)).
- No `@clerk`, `swr`, `next-intl`, `next/`, `@discovery` or `@/` import,
  and every relative import ends in `.js`
  ([validated by](../../tests/Toast.test.tsx#L155)).
- **GDPR.** `message` is caller-supplied and in the support agent may quote
  a booking reference or a customer name
  (`003-support-conversation-data-flow-record`). The component renders it
  and does nothing else with it: no `console.*`, `localStorage`,
  `sessionStorage`, `fetch`, `sendBeacon` or clipboard access, asserted by
  a source grep and the
  suite-wide console trap 023 installed in `tests/setup.ts`
  ([validated by](../../tests/Toast.test.tsx#L162)).

## Recorded decisions, interpretations and deviations

- **Test path deviation.** The issue names `tests/components/Toast.test.tsx`
  and `src/__tests__/labelled-exports.tsx`; this repo keeps every test flat
  under `tests/` with a `.test` suffix (022's recorded deviation), so the
  files are `tests/Toast.test.tsx` and `tests/labelled-exports.test.tsx`.
- **`translateX` ban narrowed.** 023's source sweep asserted no file under
  `src/` contains `translateX`; the toast keyframe now legitimately carries
  it in `src/styles.css`, so that assertion exempts `styles.css` alone -
  component sources remain banned from restating centring transforms
  ([validated by](../../tests/ChatMessage.test.tsx#L634)).
- **Precedent citation.** The issue cites "021 Decision 0" for shipping on
  thin call-site evidence; 021's spec has no such numbered decision - the
  precedent lives in its Why section, and is cited as such here and in
  `CONTRACT.md § Toast (issue 025)`.
- Not shipped, per the issue: no toast stack, variants, severity styling or
  `useToast` hook - and the first real consumer confirms the call: 044
  needs none of them (098 shows at most one notice at a time,
  connection-failed taking precedence, a selection made in the screen
  rather than the package). The close-button
  question is closed by 097, not still unvalidated: both consumer uses are
  persistent states, a close button would let a customer dismiss a
  condition that is still true, and its `dismissToast` label would pull
  `Toast` out of the `stringPropOnly` partition.
