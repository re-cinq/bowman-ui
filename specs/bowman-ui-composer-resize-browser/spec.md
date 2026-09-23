# bowman-ui composer resize in a real browser

| Field  | Value                                     |
| ------ | ----------------------------------------- |
| Issue  | issue 132 (`132-composer-resize-browser`) |
| Status | In Progress                               |

The chat composer's auto-resize was measured nowhere real: the unit suite
stubs `scrollHeight` because jsdom performs no layout, and the browser suite
typed into the composer without asserting that it grows, caps, scrolls or
shrinks back. This change adds a `composer auto-resize` describe block to the
existing consumer suite, measuring the really rendered box via
`getBoundingClientRect().height` - never the inline `style.height` string
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L289),
[L294](../../examples/chat-demo/tests/chat-demo.spec.ts#L294)). No file under
`src/` and no file under `examples/chat-demo/src/` changes in this PR - the
proof is the PR diff itself, reviewable but not re-runnable.

All statements below executed green on 2026-09-10 against the packed tarball
via `scripts/consumer-app.sh` (32 passed, exit 0), re-run for the theming
tokens' custom-themed variant; the three resize tests also passed a local
`--repeat-each 10` flake run on 2026-08-27 (30 passed).

Anchor note: the anchor checker at first tracked only `(../)+tests/*.ts(x)` anchors; this
change widened it to `(../)+examples/*/tests/*.ts(x)` anchors, so this spec's links into
`examples/chat-demo/tests/chat-demo.spec.ts` are checked by CI like any `tests/` anchor. Issue
32 widened it again to `scripts/`, `README.md` and `docs/` markdown anchors, which exposed six
dead links the narrower check had never seen, and issue 37 to any repo-relative path carrying a
file extension. `scripts/reanchor-spec-links.mjs`, which replaced that checker, keeps the
widest form: any `(../)+path#Lnn` link
([regex](../../scripts/reanchor-spec-links.mjs#L45)), so root config files, workflow files,
`package.json` files and `examples/` sources are re-anchored and rot-checked like every other
cited file
([validated by maps a link into README.md, titled or not, from L2 to L3 through the hunks](../../tests/reanchor-spec-links.test.ts#L296)). The
assistive-technology spec's placeholder links carry `#A1`-style fragments and a `<date>`
placeholder, so the checker never matches them; a real `docs/accessibility/at-pass-*.md` cited
with `#L` anchors becomes tracked the moment it exists
([validated by leaves a link whose fragment is not a line number, and a web URL, untouched](../../tests/reanchor-spec-links.test.ts#L370)).

## Baseline

With the composer empty, the suite records `getBoundingClientRect().height`
as the baseline and asserts it is greater than `0` and less than `200`
([validated by the empty composer measures above 0 and below the 200px cap](../../examples/chat-demo/tests/chat-demo.spec.ts#L309),
[validated by the empty composer measures above 0 and below the 200px cap](../../examples/chat-demo/tests/chat-demo.spec.ts#L310)). A baseline of
`0` fails with a message naming the Marginalia Books demo screen
([validated by the empty composer measures above 0 and below the 200px cap](../../examples/chat-demo/tests/chat-demo.spec.ts#L308)).

Each of the three tests opens a fresh page and measures its own baseline in
the same run rather than sharing one through `beforeAll`: the suite runs
`fullyParallel` with two CI retries, so cross-test state would either
serialize the suite or leak between a retry and a fresh worker
([validated by three Shift+Enter presses keep the draft, append no entry and grow the box](../../examples/chat-demo/tests/chat-demo.spec.ts#L313),
[validated by a twelve-line fill caps the box at exactly 200px, the draft scrolls, and Enter sends and restores the baseline](../../examples/chat-demo/tests/chat-demo.spec.ts#L335)). A font or
line-height change moves the baseline and the grown heights together, so
growth and shrink assertions cannot go red for the wrong reason.

## Growth by Shift+Enter

Three `Shift+Enter` presses on a one-line invented draft leave the draft in
the box - the surviving value `draft + "\n\n\n"` is the load-bearing no-send
assertion, because `submit()` clears the value on any send
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L328),
[L324](../../examples/chat-demo/tests/chat-demo.spec.ts#L324)). The
user-entry count staying at four corroborates it, and the measured height
ends strictly greater than the baseline - the first exercise of the newline
branch that produces real layout rather than a jsdom string
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L331),
[L332](../../examples/chat-demo/tests/chat-demo.spec.ts#L332)).

## The 200px cap

After `fill()` with a twelve-line invented string, the measured height is
exactly `200` - `027`'s `maxHeightPx` default - and filling twenty-four lines
instead leaves it at exactly `200`
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L349),
[L345](../../examples/chat-demo/tests/chat-demo.spec.ts#L345)). The
exactness doubles as a `border-box` regression test: the component writes the
literal inline string `200px`, the textarea carries no border of its own
(the border sits on the wrapper), and Tailwind's preflight `border-box`
sizing means any future border or sizing change on the textarea would break
the equality. `getBoundingClientRect()` returns CSS pixels, so the device
scale factor cannot introduce fractions.

After every `fill()` the send button is asserted enabled: the button only
enables through the same `onChange` that runs the resize, so this proves the
programmatic fill actually drove React's change path rather than only writing
the DOM value
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L344),
[L348](../../examples/chat-demo/tests/chat-demo.spec.ts#L348),
[L323](../../examples/chat-demo/tests/chat-demo.spec.ts#L323)).

At the cap, one further real `Shift+Enter` keystroke is pressed by design - a
keyboard insertion is guaranteed to scroll the caret into view, where a
programmatic value set is not - and the suite then asserts behaviourally that
`scrollHeight > clientHeight` and `scrollTop > 0`. `scrollTop` is never
written from the test
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L351),
[L359](../../examples/chat-demo/tests/chat-demo.spec.ts#L359),
[L360](../../examples/chat-demo/tests/chat-demo.spec.ts#L360)). No assertion
is made on computed `overflow-y` or any other user-agent-stylesheet value:
the scrollbar comes from the browser's own stylesheet, not from anything the
library sets.

## Send and shrink

Pressing `Enter` on the capped draft sends it - the user-entry count rises to
five, the sent entry contains the unique final line `Invented line 24 of 24`
(a line-number sentinel is avoided as a prefix trap: `Line 1` would also
match `Line 10`), the composer's value is `""` so the shrink cannot be a
layout coincidence - and the measured height returns to the recorded
baseline, polled to absorb the clearing re-render
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L368),
[L365](../../examples/chat-demo/tests/chat-demo.spec.ts#L365),
[L366](../../examples/chat-demo/tests/chat-demo.spec.ts#L366),
[L367](../../examples/chat-demo/tests/chat-demo.spec.ts#L367)).

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
([validated by typing "Hvor er min booking?" and clicking send calls onSubmit once with exactly that string, then the draft is "", the height is back to auto and send is disabled again](../../tests/ChatComposer.test.tsx#L46)).

What this suite adds is the half no jsdom test could reach: the browser
resolves that `auto` back to a real rendered height equal to the recorded
baseline
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L368)). The
string stays unit-covered as an implementation detail; the measured height is
the customer-visible fact, and asserting the string here would only duplicate
`027` without proving layout.

### What stays unproven in a browser

The `maxHeightPx` override is proven only by `027`'s stubbed unit test - a
stubbed `scrollHeight` of 320 capping at `200px` under the default and
reaching `320px` with `maxHeightPx={400}` - and by no browser
([validated by a stubbed scrollHeight of 320 caps the height at 200px under the default maxHeightPx](../../tests/ChatComposer.test.tsx#L381),
[validated by the same 320 becomes 320px with maxHeightPx={400}](../../tests/ChatComposer.test.tsx#L390)). The demo pins its
composition and threads no URL parameter to a second `maxHeightPx`, per the
issue's tech note: that would turn the worked consumer into a fixture for its
own test suite.

## GDPR

Every string these assertions type or fill is invented text: the one-line
draft `An invented draft about a delivery change` and generated numbered
lines `Invented line N of M` - no real support question, booking identifier,
or personal data, because the repo is public and a Playwright failure dump in
a CI log is a publication
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L320),
[L296](../../examples/chat-demo/tests/chat-demo.spec.ts#L296)). The generated
pattern is deterministic and obviously synthetic, which is a stronger posture
than invented prose.

## CI wiring

The assertions run inside the existing `consumer` job in
`.github/workflows/ci.yml`, against `vite preview` and the packed tarball,
on every pull request - the job already runs the whole suite via
`scripts/consumer-app.sh`
([job](../../.github/workflows/ci.yml#L135)). No new job, no second browser
install, and `scripts/consumer-app.sh` is unchanged in this PR - like the
`src/` constraint, that is proven by the PR diff, not by an executable
anchor.

## Gates preserved

- `npm run test:coverage` passes at the unchanged 100/100/100/100 thresholds
  ([validated by](../../vitest.config.ts#L26)); the Playwright suite stays
  excluded from vitest ([validated by](../../vitest.config.ts#L12)).
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and
  `npm run prettier:check` pass, and `npm run consumer` exits 0 from a clean
  `npm ci`.

## Out of scope

Per the issue: transcript placement under a growing composer, the
`maxHeightPx` override in a browser, anything a screen reader answers
(issue 71's territory), visual regression and screenshot comparison,
the wrapper's `transition-all` and reduced-motion behaviour.
