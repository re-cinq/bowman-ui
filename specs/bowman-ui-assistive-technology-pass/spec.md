# bowman-ui assistive technology pass

| Field  | Value                                                |
| ------ | ---------------------------------------------------- |
| Issue  | issue 97 (`097-bowman-ui-assistive-technology-pass`) |
| Status | In Progress                                          |

Three shipped components promise something jsdom cannot check: that a screen
reader speaks `ThinkingIndicator`'s `aria-label` rather than its visible text
(`024`), that a streamed answer's completion is or is not announced under
`ChatMessageList`'s `role="log"` / `aria-live="off"` (`028`), and that the
composer announces its resolved label rather than its placeholder (`027`). A
human with a screen reader answers those. This change builds everything around
that human - a reply worth listening to, a written procedure, and a gate that
keeps the answer from silently rotting - and deliberately does not answer them.

No file under `src/` changes. The component surface is frozen for this work by
construction: the freshness gate below invalidates on component edits, so a
`src/` change in this pull request would be a gate that certifies a tree that
no longer exists.

## What is deliberately absent

`docs/accessibility/at-pass-<date>.md` does not exist and is not created here.
A record states that a named person listened on a named date with a named voice
and heard a named string; written by anything other than that person it is a
false compliance artifact, and this repository going public makes it a
published one. The issue's criteria that require the dated record - the record
itself, its front matter of real versions, the verbatim transcriptions in
A1-A7 - are owed by the human runner, not by this change.

The scaffolding is built so that the absence is loud rather than quiet:
`check-at-pass.mjs --freshness` fails with no record present - it is the check
an intending publisher runs by hand; it was unhooked from `publish.yml` on
2026-09-09, when the pass became a procedure rather than a release gate - while
`--structure` passes with a warning so no pull request is held hostage to a
listening session that has not happened yet
([validated by](../../tests/check-at-pass.test.ts#L154),
[L146](../../tests/check-at-pass.test.ts#L146)).

## The demo's streamed reply

`032`'s Vite demo answered a message with one array push, which cannot be used
to ask "is the finished answer announced" - there was no finish. The demo now
reproduces HAL's `entry_upsert → entry_delta → entry_commit` lifecycle
(`hal-engine/docs/websocket-protocol.md` §7.1) with plain timers over a canned
reply in the demo's existing catalogue register. No `@re-cinq/hal-engine`
dependency, no network, no engine: `examples/chat-demo/src/streaming.ts` splits
the reply into 24 word-boundary chunks and schedules `setTimeout`s at 150 ms
intervals after a 400 ms head start.

`busy` goes true on send and false at `upsert`, which is exactly the transition
row A2 listens to: the thinking indicator mounts with entries already present,
then yields to a streaming entry. The entry appears empty with
`isStreaming: true`, grows by one chunk per delta, and has `isStreaming` cleared
at commit - the demo's only remaining state change.

Sampling the entry's text length at two times shows it longer at 2.6 s than at
0.9 s, and shorter at 0.9 s than the committed reply
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L91)). A
second test counts the distinct growth steps and the span they cover: at least
20 steps over at least 3 seconds
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L118)). That
second test samples inside the page rather than across the Playwright wire,
because a slow round trip would merge two real steps into one observation and
under-count a stream that did emit 24.

## The procedure

`docs/accessibility/README.md` is the pass itself: the stacks, seven rows with
reproduction steps against the demo's English catalogue, the record format, and
the GDPR rule.

A stack is any screen reader, browser and operating system run together, named
by an `id` slug its rows refer to; NVDA plus Firefox on Windows and VoiceOver
plus Safari on macOS are the recommended pairings, not requirements (the
original NVDA-mandatory rule was dropped on 2026-09-09 with the release gate).
Live-region behaviour is implementation-specific, so one stack proves one
stack. At least one stack must actually have been run
([validated by](../../tests/check-at-pass.test.ts#L218),
[one is enough](../../tests/check-at-pass.test.ts#L471),
[a third needs its rows](../../tests/check-at-pass.test.ts#L368)). Every
stack needs a unique `id`
([validated by](../../tests/check-at-pass.test.ts#L385),
[duplicates](../../tests/check-at-pass.test.ts#L398)). On a run stack's row,
`not-run` is legal only with a stated reason
([validated by](../../tests/check-at-pass.test.ts#L230),
[with one](../../tests/check-at-pass.test.ts#L236)). A stack nobody could run
is declared once, on its `stacks` entry, with no invented versions; every row
on it is then `not-run` without a reason of its own
([validated by](../../tests/check-at-pass.test.ts#L448),
[a pass row on it](../../tests/check-at-pass.test.ts#L461)).

The pass runs against the demo's English catalogue, and the record names the
voice actually used. The record transcribes verbatim and judges nothing. The
published site is the default surface; a local build is needed only for the two
optional local-only sub-steps. Expected runtime is two to three hours for a
first run and about 30 minutes for a repeat against an unchanged surface.

## What the pass will answer

The statements below carry a link to a record that does not exist yet rather
than to a test, for the reason the issue itself gives: no automated test can
hear a screen reader, so the evidence for each is a human's verbatim
transcription in `docs/accessibility/at-pass-<date>.md`, and this spec says
plainly that the file is owed rather than pretending otherwise.

<!-- eslint-disable re-lint/no-dead-md-links -- the seven links below point at the at-pass record a human writes after the pass; the file is owed, not missing -->

1. **A1.** What each stack announces when a streamed answer completes under
   `role="log"` / `aria-live="off"` - transcribed verbatim, including `nothing`
   when nothing is announced
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A1)).
2. **A2.** Whether `ThinkingIndicator`'s `role="status"` is announced despite
   its `aria-live="off"` ancestor, with entries already present
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A2)).
3. **A3.** Which of the two competing strings each stack speaks for the
   indicator - the visible `thinking` label (`"Thinking"`) or the region's
   `thinkingRegion` `aria-label` (`"Loading response"`)
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A3)).
4. **A4.** Whether focusing the composer announces the resolved `composerInput`
   label rather than the `composerPlaceholder` string
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A4)).
5. **A5.** Whether the resolved `aiDisclosure` band is reachable and announced
   before the first message is sent, with `entries: []`, cited against Article
   50 of Regulation (EU) 2024/1689 - both the first-interaction timing
   obligation in Article 50(5) and its requirement that the information conform
   to applicable accessibility requirements
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A5)).
6. **A6.** Whether copying an assistant message announces `Toast`'s
   `role="status"` / `aria-live="polite"` region, and whether the two-second
   auto-dismiss cuts the announcement short
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A6)).
7. **A7.** Whether each entry's author is distinguishable under the virtual
   cursor given `aria-hidden` avatars, answered twice: once as the demo ships,
   and once with two personas in view, against the name line `121` added to
   `ChatMessage`
   ([validated by](../../docs/accessibility/at-pass-<date>.md#A7)).

<!-- eslint-enable re-lint/no-dead-md-links -->

## The gate

`scripts/check-at-pass.mjs` is the mechanical half. CI cannot hear, but it can
check that a record exists, is complete, and has not been invalidated.

1. **The record's front matter is the machine-readable part.** Row verdicts
   live in front matter under `rows`, one entry per row per stack, rather than
   in a markdown table in the body, so the gate reads them without parsing
   prose. A missing required field fails, naming the field; a `commit` that is
   not 40 hex fails; a row missing a verdict on any declared stack fails,
   naming the row and the stack. The front-matter reader is 40 lines of this
   repository's own, not a YAML dependency: the format is defined by
   `docs/accessibility/README.md`, and a record that strays from it is a
   finding rather than a parser upgrade
   ([validated by](../../tests/check-at-pass.test.ts#L368),
   [L171](../../tests/check-at-pass.test.ts#L171),
   [L183](../../tests/check-at-pass.test.ts#L183),
   [L192](../../tests/check-at-pass.test.ts#L192)).
2. **Every `fail` has an owner.** A `fail` row naming neither a `fixing-issue`
   nor an `accepted-by` fails the gate; one naming a fixing issue passes.
   Fixing what a row finds is a separate pull request against the component
   that shipped the behaviour
   ([validated by](../../tests/check-at-pass.test.ts#L200),
   [L206](../../tests/check-at-pass.test.ts#L206)).
3. **A waiver is temporary by construction.** `waived` without both `waived-by`
   and `expires` fails; an expired waiver fails in both modes, with the same
   exit code as a stale record; an unexpired one passes. A first release is not
   hostage to VM access, and a waiver cannot quietly become permanent
   ([validated by](../../tests/check-at-pass.test.ts#L248),
   [L254](../../tests/check-at-pass.test.ts#L254),
   [L275](../../tests/check-at-pass.test.ts#L275)).
4. **`covers` makes the record perishable.** `--freshness` takes the last
   commit touching each covered path and fails when it is not an ancestor of
   the record's `commit`, naming the file and both commits; a covered path no
   commit touches fails too. Editing `ChatMessageList.tsx` mechanically
   invalidates the pass that certified it. Run it in a full clone: a shallow
   checkout has no history to walk and would read every record as stale
   ([validated by](../../tests/check-at-pass.test.ts#L303),
   [L322](../../tests/check-at-pass.test.ts#L322)).
5. **No record fails `--freshness`, never `--structure`.** `--structure`
   passes with a warning when no record exists and `--freshness` fails. The
   asymmetry outlived the release gate: a pull request cannot be blocked by a
   listening session nobody has scheduled, and whoever runs `--freshness` by
   hand gets a plain no rather than a silent pass
   ([validated by](../../tests/check-at-pass.test.ts#L146),
   [L154](../../tests/check-at-pass.test.ts#L154)).
6. **No placeholder survives.** `TBD`, `TODO`, `FIXME`, `XXX` and
   angle-bracket markers anywhere in the front matter fail the structure
   check, which is what turns "no placeholder left in the file" from an
   instruction into a gate
   ([validated by](../../tests/check-at-pass.test.ts#L291)).
7. **The newest record by filename is the one validated**. ISO dates sort
   lexically, so the newest file name is the newest pass
   ([validated by](../../tests/check-at-pass.test.ts#L337)).
8. **Exit codes follow the house.** 1 lists every violation on stderr; 2 is a
   usage or environment error - no mode flag or an unknown one
   ([validated by](../../tests/check-at-pass.test.ts#L419),
   [L415](../../tests/check-at-pass.test.ts#L415)).

`npm run check:at-pass -- --structure` runs in `ci.yml`'s `build-test` job.
`npm run check:at-pass -- --freshness` ran in `publish.yml` between the build
and `npm publish` until 2026-09-09, when the pass was made a procedure rather
than a release gate: a 0.x library with one maintainer and no screen-reader
access had every release hostage to a listening session, which was
disproportionate. The check is now run by hand by whoever wants the record's
answer, and the root README says plainly that the announced behaviour is
documented, not yet verified by a human listener.

## The red fixtures live in temp trees

The issue asks the script to "ship a fixture record that makes it go red", the
standard `014` and `032` hold their own check scripts to. It does - built in a
temporary git repository per test, exactly as `tests/repoint-spec-anchors.test.ts`
and `tests/security/` do, never committed under `docs/accessibility/`. A red
record committed to that directory would be indistinguishable from a real one
to a reader, would be the newest record the gate validates, and would be
published when this repository goes public. The fixtures are synthetic, are
labelled as such in the file they are generated in, and carry a runner name of
`Test Runner`
([validated by](../../tests/check-at-pass.test.ts#L161)).

## `121`'s recorded requirement

The attribution change (issue 121) recorded that a future AT-pass record
must list `ChatMessage.tsx` and `ChatMessageList.tsx` in its `covers` set and
must postdate that merge, re-answering A7 with two personas rendered. Both are
folded into `docs/accessibility/README.md`: the `covers` guidance names all
seven components the rows exercise with both of those first, and A7 is split
into A7a (as shipped, one voice) and A7b (a local, uncommitted `attribution`
map with two personas, reverted afterwards because committing it changes the
articles' accessible names and breaks the demo's Playwright counts).

## Known unknowns

- **KU-21, who runs the pass.** No transcript names anyone for this role.
  issue 97 **proposes** a named runner as the accountable runner; that
  proposal is recorded here, not settled here, and nothing in this change
  asserts it. The consequence is structural rather than rhetorical: the
  record's `runner` field is required by the gate, so whoever runs the pass
  names themselves in it and no name is asserted on this issue's own authority
  ([validated by](../../tests/check-at-pass.test.ts#L171)).
- **KU-22, which accessibility standard applies.** None has been named. This is
  seven checks against three named promises, not a WCAG or EN 301 549
  conformance audit, and `docs/accessibility/README.md` claims neither. Naming
  a standard is a decision for `001`'s ADR, not for this change.

## Premise discrepancies

- The issue's acceptance criteria include the dated record, its front matter of
  real versions and the verbatim A1-A7 transcriptions. Those are not delivered
  here and cannot honestly be: see "What is deliberately absent". The issue
  stays open after this merge for that reason.
- The issue's "Why" routes `027`'s composer auto-resize to this pass; its own
  tech notes then place auto-resize out of scope, in `032`'s Playwright suite,
  because it needs real layout rather than an assistive technology. The tech
  notes are followed - `examples/chat-demo/tests/chat-demo.spec.ts` already
  measures the box - and A4 asks only what the composer announces on focus.
- The issue does not mention checkout depth. `--freshness` reads git history,
  so while it ran in `publish.yml` that checkout needed `fetch-depth: 0`, or
  every record read as stale; the setting left with the gate, and the README
  tells a hand runner to use a full clone.
- Row verdicts are recorded in front matter rather than in the body prose the
  issue's wording implies, so that the gate reads structured data. The verbatim
  announcements the issue asks for stay in the body, where a human reads them.

## Gates

- `npm run lint`, `npm run typecheck`, `npm run test:coverage` and
  `npm run build` pass at `014`'s thresholds; no file under `src/` changed, so
  the coverage floor is untouched.
- `scripts/consumer-app.sh` passes end to end with the streaming demo and the
  two new Playwright tests.
- This pull request edits `.github/workflows/`, so it must be merged with a
  merge commit rather than a squash: the token used for squash merges carries
  no `workflow` scope.

## Out of scope

Fixing anything the pass finds (each `fail` routes to its own issue against the
shipping component); an automated scanner such as `axe-core`, which would catch
contrast and attribute defects and answer none of A1-A7; WCAG or EN 301 549
conformance as a whole; colour contrast, keyboard-only navigation and reduced
motion, which a browser measures without an assistive technology; the app shell
and mobile drawer, since a focus trap does not trap a virtual cursor; and the
`support-agent` chat surface, which inherits this procedure and whose re-run is
that consumer's own decision.
