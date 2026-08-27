# bowman-ui composer resize in a real browser

Issue: re-cinq/Otto#132 (`132-composer-resize-browser`)

The chat composer's auto-resize was measured nowhere real: the unit suite
stubs `scrollHeight` because jsdom performs no layout, and the browser suite
typed into the composer without asserting that it grows, caps, scrolls or
shrinks back. This change adds a `composer auto-resize` describe block to the
existing consumer suite
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L203)),
measuring the really rendered box via `getBoundingClientRect().height`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L208)) -
never the inline `style.height` string. No file under `src/` and no file
under `examples/chat-demo/src/` changes in this PR - the proof is the PR
diff itself, reviewable but not re-runnable.

All statements below executed green on 2026-08-27 against the packed tarball
via `scripts/consumer-app.sh` (11 passed, exit 0), and the three resize tests
also passed a local `--repeat-each 10` flake run (30 passed).

Anchor note: `scripts/repoint-spec-anchors.mjs` originally tracked only
`(../)+tests/*.ts(x)` anchors; this change widens its regex by one line to
also track `(../)+examples/*/tests/*.ts(x)` anchors
([regex](../../scripts/repoint-spec-anchors.mjs#L39)), so this spec's links
into `examples/chat-demo/tests/chat-demo.spec.ts` are repointed by CI like
any `tests/` anchor. The widened check ran clean over the pre-existing
consumer-app spec (21 newly tracked anchors there; 591 up to date repo-wide,
0 stale, 0 rotten). Links into `scripts/`, `vitest.config.ts` and workflow
files remain plain GitHub links CI never repoints.

## Baseline

With the composer empty, the suite records `getBoundingClientRect().height`
as the baseline and asserts it is greater than `0` and less than `200`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L222),
[L223](../../examples/chat-demo/tests/chat-demo.spec.ts#L223)). A baseline of
`0` fails with a message naming the Havkat Rejser demo screen
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L221)).

Each of the three tests opens a fresh page and measures its own baseline in
the same run
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L231),
[L253](../../examples/chat-demo/tests/chat-demo.spec.ts#L253)) rather than
sharing one through `beforeAll`: the suite runs `fullyParallel` with two CI
retries, so cross-test state would either serialize the suite or leak between
a retry and a fresh worker. A font or line-height change moves the baseline
and the grown heights together, so growth and shrink assertions cannot go red
for the wrong reason.

## Growth by Shift+Enter

Three `Shift+Enter` presses on a one-line invented draft
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L236)) leave
the draft in the box - the surviving value `draft + "\n\n\n"` is the
load-bearing no-send assertion, because `submit()` clears the value on any
send ([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L240)).
The user-entry count staying at four corroborates it
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L243)), and
the measured height ends strictly greater than the baseline
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L244)) - the
first exercise of the newline branch that produces real layout rather than a
jsdom string.

## The 200px cap

After `fill()` with a twelve-line invented string, the measured height is
exactly `200`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L257)) -
`027`'s `maxHeightPx` default - and filling twenty-four lines instead leaves
it at exactly `200`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L261)). The
exactness doubles as a `border-box` regression test: the component writes the
literal inline string `200px`, the textarea carries no border of its own
(the border sits on the wrapper), and Tailwind's preflight `border-box`
sizing means any future border or sizing change on the textarea would break
the equality. `getBoundingClientRect()` returns CSS pixels, so the device
scale factor cannot introduce fractions.

After every `fill()` the send button is asserted enabled
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L256),
[L260](../../examples/chat-demo/tests/chat-demo.spec.ts#L260),
[L235](../../examples/chat-demo/tests/chat-demo.spec.ts#L235)): the button
only enables through the same `onChange` that runs the resize, so this proves
the programmatic fill actually drove React's change path rather than only
writing the DOM value.

At the cap, one further real `Shift+Enter` keystroke is pressed by design
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L263)) - a
keyboard insertion is guaranteed to scroll the caret into view, where a
programmatic value set is not - and the suite then asserts behaviourally that
`scrollHeight > clientHeight`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L270)) and
`scrollTop > 0`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L271)).
`scrollTop` is never written from the test. No assertion is made on computed
`overflow-y` or any other user-agent-stylesheet value: the scrollbar comes
from the browser's own stylesheet, not from anything the library sets.

## Send and shrink

Pressing `Enter` on the capped draft sends it - the user-entry count rises to
five ([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L275)),
the sent entry contains the unique final line `Opdigtet linje 24 af 24`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L276)) (a
line-number sentinel is avoided as a prefix trap: `Linje 1` would also match
`Linje 10`), the composer's value is `""`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L277)) so
the shrink cannot be a layout coincidence - and the measured height returns
to the recorded baseline, polled to absorb the clearing re-render
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L278)).

### Reconciling 027's "inline height back to auto" criterion

The inline `style.height` string is deliberately not asserted anywhere in
this suite. Measured in the real Chromium run (2026-08-27, headless, pinned
`@playwright/test` 1.62.1), the shipped component leaves the literal string
`auto` on `style.height` after a clear, and it is still `auto` after the
busy-to-idle re-render when the fixture reply lands. The issue predicted the
opposite - "the resize effect re-runs after the clearing re-render and
overwrites `auto` with the empty-textarea's own pixel height" - but the
shipped component has no resize effect: the resize runs inside the `onChange`
handler and the ref handle's `setValue`, the textarea is uncontrolled, and
the demo passes no ref, so nothing re-runs the resize after `submit()` writes
`auto`. `027`'s string criterion therefore still holds in a real browser,
exactly as its unit test asserts
([validated by](../../tests/ChatComposer.test.tsx#L41)).

What this suite adds is the half no jsdom test could reach: the browser
resolves that `auto` back to a real rendered height equal to the recorded
baseline
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L278)). The
string stays unit-covered as an implementation detail; the measured height is
the customer-visible fact, and asserting the string here would only duplicate
`027` without proving layout.

### What stays unproven in a browser

The `maxHeightPx` override is proven only by `027`'s stubbed unit test - a
stubbed `scrollHeight` of 320 capping at `200px` under the default
([validated by](../../tests/ChatComposer.test.tsx#L231)) and reaching `320px`
with `maxHeightPx={400}`
([validated by](../../tests/ChatComposer.test.tsx#L240)) - and by no browser.
The demo pins its composition and threads no URL parameter to a second
`maxHeightPx`, per the issue's tech note: that would turn the worked consumer
into a fixture for its own test suite.

## GDPR

Every string these assertions type or fill is invented text: the one-line
draft `En opdigtet kladde om en ombooking`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L233)) and
generated numbered lines `Opdigtet linje N af M`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L211)) - no
real support question, booking identifier, or personal data, because the repo
is public and a Playwright failure dump in a CI log is a publication. The
generated pattern is deterministic and obviously synthetic, which is a
stronger posture than invented prose.

## CI wiring

The assertions run inside the existing `consumer` job in
`.github/workflows/ci.yml`, against `vite preview` and the packed tarball,
on every pull request - the job already runs the whole suite via
`scripts/consumer-app.sh`
([job](../../.github/workflows/ci.yml#L80)). No new job, no second browser
install, and `scripts/consumer-app.sh` is unchanged in this PR - like the
`src/` constraint, that is proven by the PR diff, not by an executable
anchor.

## Gates preserved

- `npm run test:coverage` passes at the unchanged 100/100/100/90 thresholds
  ([validated by](../../vitest.config.ts#L24)); the Playwright suite stays
  excluded from vitest ([validated by](../../vitest.config.ts#L12)).
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and
  `npm run prettier:check` pass, and `npm run consumer` exits 0 from a clean
  `npm ci`.

## Out of scope

Per the issue: transcript placement under a growing composer, the
`maxHeightPx` override in a browser, anything a screen reader answers
(re-cinq/Otto#71's territory), visual regression and screenshot comparison,
the wrapper's `transition-all` and reduced-motion behaviour, and any change
in `discovery`.
