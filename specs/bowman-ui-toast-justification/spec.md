# bowman-ui toast justification

| Field  | Value                                                  |
| ------ | ------------------------------------------------------ |
| Issue  | issue 118 (`097-bowman-ui-toast-justification`) |
| Status | In Progress                                            |

A documentation-only correction: no file under `src/` changes, `Toast.tsx`
ships exactly as 025 specifies it, and no test changes. 025 shipped `Toast`
ahead of any live call site, justified by naming two future users - the
escalation path and the failover path. Both have since been written and both
declined it, and 064 concluded "025 now has zero claimants" - a conclusion
that missed that `044-support-agent-chat-wiring` already depends on 025 and
mounts `Toast` twice. This issue corrects the record in the two places a
developer building 025-adjacent work will read it: `docs/design-notes.md § Toast` and `specs/bowman-ui-toast/spec.md`.

## The corrected record

- 054 declined the escalation toast: a hand-off is the answer to the
  question the customer just asked, so it renders in the persisted
  transcript through the existing `entry_delta`/`entry_commit` path, not in
  a two-second notification.
- 064 declined the failover toast: a successful failover is silent by
  design, and the failed case reaches the client as 044's `error` frame.
  064's follow-on claim that 025 "now has zero claimants" is the error this
  issue corrects.
- The component's only consumer in the org, measured by 097, is
  `044-support-agent-chat-wiring`'s `ChatScreen.tsx` in the support agent:
  a reconnect notice (a sentence stating the conversation was
  restarted) and a connection-failed notice. Both are conditions that
  persist, not messages
  that fade - the opposite of the use case 025 was designed around.
- Both uses take `duration={null}` under the persistence rule 064 settled;
  `098-support-agent-persistent-connection-notices` applies it at both call
  sites (044 shipped the notices on the default; 098, open as this
  correction lands, sets the prop). No consumer passes a number, so once
  098 lands the 2000ms default has no shipped caller; it stays because
  015's characterization suite pins it.
- 025's original criterion is preserved, not replaced: the package itself
  still mounts `Toast` nowhere - the component is live only in its
  consumers.

## The closed question

025 left the zero-close-button decision open pending a real consumer. Now
that one exists, the question closes rather than re-opens: both of 044's
uses are persistent states, so a close button would let a customer dismiss
a condition that is still true - the connection-failed notice is the only
thing on screen explaining why nothing works - and the `dismissToast` label
it would need (`docs/design-notes.md § Labels` decision 3's key-naming example)
would pull `Toast` out of the `stringPropOnly` partition. The real
consequence is documented instead: with `duration={null}` and no close
button, dismissal is entirely the consumer unmounting the element, and a
toast a consumer forgets to unmount occupies the
`fixed bottom-8 left-1/2 z-50` overlay for the life of the page
([validated by](../../tests/Toast.test.tsx#L138),
[L89](../../tests/Toast.test.tsx#L89)).

## What deliberately did not change

- Nothing under `src/`: the issue mandates no source change and its
  acceptance criteria assert the PR's `git diff --stat` touches no file
  there. `ToastProps` remains `message`, `onClose`, `duration`; `Toast`
  remains in the `stringPropOnly` list; the partition test passes
  unchanged ([validated by](../../tests/labelled-exports.test.tsx#L152)).
- The 2000ms default: 015's characterization suite pins it (uncalled at
  1999ms, called once at 2000ms) and removing it is not this issue's call
  ([validated by](../../tests/Toast.test.tsx#L51)).
- 044's two call sites still omit `duration`: making them actually pass
  `duration={null}` is 098's work, in the support agent repo.

## Recorded decisions, interpretations and deviations

- **Tense deviation on the duration criterion.** Read literally, the
  acceptance criterion asserts both consumer uses pass `duration={null}`
  today; 098's own Why section records that 044 shipped both notices
  inheriting the 2000ms default and that 098 - still open - is what sets
  the prop. The wording in `docs/design-notes.md § Toast` follows the
  issue's What-to-do instead ("state plainly that no consumer passes one"):
  it states the settled rule, names 098 as the issue that applies it, and
  scopes both "pass `duration={null}`" and "no shipped caller" to once 098
  lands, so no clause asserts a state 098 has yet to create.
- **Slug provenance.** The slug `097-bowman-ui-toast-justification` is not
  derivable from this repo; it appears verbatim in issue 40 (098),
  which names this issue as its companion.
- **Grep criterion wrapping.** The acceptance grep
  `grep -rniE "escalation|failover" specs/bowman-ui-toast/` matches lines,
  not sentences, so `specs/bowman-ui-toast/spec.md` is wrapped so that
  every matching line carries its deciding issue and decision on that same
  line.
- **No `tasks.md`.** The issue's tech notes name one, but none of the ten
  existing spec directories carries one; this spec matches the repo.
- **`[validated by]` links only where behaviour is restated.** Every
  existing spec links tests because every existing spec shipped code; this
  one ships none and changes no test, so narrative and history statements
  carry no links - only the statements restating 025's still-pinned
  behaviour cite the unchanged tests. Verification is the acceptance grep
  above plus the unchanged quality gates (`npm run lint`,
  `npm run typecheck`, `npm run test:coverage`, `npm run build`,
  `npm run prettier:check`).
