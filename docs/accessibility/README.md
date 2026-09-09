# The assistive-technology pass

jsdom renders no audio and performs no layout, so three shipped promises in
this package are unproven by the test suite: that a screen reader speaks the
thinking indicator's label rather than its visible text, that something (or
nothing) announces a streamed answer has finished under `role="log"` /
`aria-live="off"`, and that the composer announces its resolved label rather
than its placeholder. This procedure is how a human answers them, and
`scripts/check-at-pass.mjs` is how CI keeps the answer honest afterwards.

Running the pass is a human task. Nothing in CI, and no agent, may author a
record in this directory: a record is a statement that a named person listened
on a named date, and a fabricated one is a false compliance artifact. Until the
first record exists, `check-at-pass.mjs --structure` passes with a warning and
`check-at-pass.mjs --freshness` fails, which blocks `npm publish` and nothing
else.

## Before you start

Have these in hand; each is asked for below.

1. A Windows machine with NVDA and Firefox installed, an English voice
   selected, and NVDA's **Speech Viewer** open (NVDA menu → Tools → Speech
   Viewer). The Speech Viewer log is the transcript of record: copy from it,
   never from memory.
2. The four version strings for the record's `stacks` block: NVDA (NVDA menu →
   Help → About), Firefox (`about:support`, "Version"), Windows (`winver`),
   and the voice (NVDA menu → Preferences → Settings → Speech: synthesizer and
   voice name).
3. The commit the surface was built from, as a lowercase 40-hex sha - see
   [Which commit](#which-commit).
4. An editor that saves with LF line endings and spaces, never tabs. The
   repository's `.gitattributes` normalises line endings on commit, but the
   gate reads the file you hand it, and a CRLF file fails with "no `---`
   front-matter block".
5. About two to three hours for a first NVDA run - the seven rows are around 30
   minutes of listening; the rest is setup, fourteen verbatim transcriptions,
   and the optional local-only sub-steps. A repeat run against an unchanged
   surface is about 30 minutes.

## The two stacks

| Stack                     | Status            | `not-run` allowed  |
| ------------------------- | ----------------- | ------------------ |
| NVDA + Firefox, Windows   | Mandatory primary | No                 |
| VoiceOver + Safari, macOS | Secondary         | Yes, with a reason |

NVDA plus Firefox is the primary stack because it is free, needs no licence and
no purchase approval, and is the pairing whose live-region behaviour is most
widely relied on. VoiceOver plus Safari is the secondary stack. Live-region
behaviour is implementation-specific - one stack proves one stack, never both -
so a row answered only on NVDA is an answer about NVDA.

A VoiceOver stack nobody could run is declared once, on its `stacks` entry, as
`not-run: <why>` in place of the version fields, and then every `voiceover` row
is `verdict: not-run` with no `reason` of its own. A VoiceOver stack that was
run carries its four versions, and any single row on it may still be
`not-run` with its own `reason`. `not-run` is never legal on an `nvda` row or on
the NVDA stack entry.

## Language and voice

The pass runs against the demo's English catalogue
(`examples/chat-demo/src/labels.ts`), which reuses the library's own English
defaults plus the demo's `aiDisclosure` and screen copy. Run with an English
voice and record which voice was actually used in the record's `stacks` block.
The record transcribes what the Speech Viewer logged, verbatim, and never
judges pronunciation. Where a row asks which of two strings was spoken, quote
the Speech Viewer line that contains it, with its role word (`edit`,
`article`, `status`), because two different elements on this page share the
accessible name `Your message`.

## The surface under test

The pass is run against the packed library in the standalone Vite demo, never
against a dev build of `src/`, so what is listened to is what a consumer
installs. Two surfaces satisfy that; use the first unless a sub-step below says
"local-only".

**The published site**: <https://re-cinq.github.io/bowman-ui/?view=chat>. It is
built by `.github/workflows/pages.yml` from the packed tarball, exactly the way
`scripts/consumer-app.sh` builds the local copy. The `?view=chat` suffix
matters: the bare URL serves the component documentation, whose example
transcript carries a different disclosure sentence, and a transcription taken
there is of the wrong page.

**A local build**, needed only for the two local-only sub-steps (A6 step 3 and
A7b). It requires a clone with Node 22, bash, a completed `npm ci` at the root,
and patience: the script installs Chromium and runs the demo's whole Playwright
suite before it prints anything.

```
scripts/consumer-app.sh --keep     # prints "Keeping temp directory: <dir>"
cd <dir>/chat-demo                 # the app is one level below the printed dir
npm run dev                        # or: npm run build && npm run preview
```

Open the printed URL with `?view=chat` appended. Any edit a sub-step asks for
goes in `<dir>/chat-demo/src/`, the temp copy - never in the repository's
`examples/chat-demo`, where it would break the consumer check's own Playwright
counts.

The demo brand is `Marginalia Books`; the three conversations are
`Delivery change for MB-4821-XQ` (open by default), `Damaged copy of The
Cartographer's Atlas` and `New conversation`. All of it is invented fixture
data. Under the composer sits a note reading "Static demo - canned responses,
no AI backend or network."; it is part of the page and will be read.

Sending a message streams a canned reply through the same lifecycle HAL
produces: `busy` is true for 400 ms (the thinking indicator's window), the
entry then appears empty, grows by one word-chunk every 150 ms across 24 steps,
and commits at about 4.2 seconds. The stream is over when the pulsing stops and
the entry's action row (copy button) mounts.

### Which commit

The record's `commit` is the commit the surface you listened to was built
from, as a **lowercase** 40-hex sha.

- Published site: the commit of the latest successful `Pages` run on `main`
  (Actions → Pages → newest green run → the sha under the run title), or
  `gh run list --workflow Pages --status success --limit 1 --json headSha`.
- Local build: `git rev-parse HEAD` in the clone you ran `consumer-app.sh` in.

Any commit on today's `main` satisfies A7's requirement that the name line
(`assistantMessageFrom`, shipped 2026-08-31) exists.

## The rows

### A1. Is a completed streamed answer announced?

`ChatMessageList` marks the transcript `role="log"` with `aria-live="off"`, and
says so plainly. Whether that combination announces anything on completion is
the question.

1. Open the demo on `Delivery change for MB-4821-XQ` (the default).
2. Focus the composer, type any question, press Enter.
3. Listen through the whole stream, from the empty entry to the commit at
   about 4.2 seconds.

Record, **verbatim**, what each stack announced at the moment the answer
finished - including the word `nothing` when nothing was announced. Nothing is
a legitimate finding and the most likely one; do not paraphrase it into
"minimal announcement".

### A2. Is `ThinkingIndicator` announced under an `aria-live="off"` ancestor?

`ThinkingIndicator` carries `role="status"` and `aria-live="polite"`, but it
mounts inside the transcript, whose ancestor sets `aria-live="off"`.

1. Open a conversation that already has entries (`Delivery change for MB-4821-XQ`).
2. Send a message. For the 400 ms after the send the demo sets `busy` true and
   the `role="status"` indicator mounts; at 400 ms it unmounts and the empty
   streaming entry takes its place.
3. Listen for an announcement in that window.

Record per stack whether the `role="status"` region was announced despite the
`aria-live="off"` ancestor.

### A3. Which string is spoken for the thinking indicator?

Two strings compete in the `role="status"` region: the visible label
(`thinking`, `"Thinking"` in the demo catalogue) and the region's `aria-label`
(`thinkingRegion`, `"Loading response"`). A third source shows the same visible
word: from 400 ms until the first chunk arrives at about 550 ms, the empty
streaming entry renders `InlineThinkingIndicator`, which has no `role="status"`
and whose text is also `Thinking`. Attribute by time and by the Speech Viewer's
role word: `status` is the region under test; a bare `Thinking` with no role
after the 400 ms mark is the inline indicator.

1. Trigger the indicator as in A2.
2. Note which of the two strings was spoken, and from which source.

Record which string each stack spoke for the `role="status"` region.

### A4. Does the composer announce its label, not its placeholder?

The demo's `composerInput` label is `"Your message"` and its
`composerPlaceholder` is `"Reply..."`. Read both from
`examples/chat-demo/src/labels.ts` at the commit under test rather than from
this document, and record the values you actually saw.

1. Tab to the composer, or click it and then Tab away and back.
2. Note what was announced on focus. The composer is an `edit`; the user
   entries in the transcript are `article`s with the same name, so quote the
   role word.

Record whether the resolved `composerInput` label was announced, and whether
the placeholder string was announced instead of, or in addition to, it.

### A5. Is the AI disclosure reachable and announced before the first message?

EU AI Act, Regulation (EU) 2024/1689, Article 50. Article 50(1) obliges
providers to design systems that interact directly with natural persons so
that those persons are informed they are interacting with an AI system.
Article 50(5) fixes the timing - the information is provided at the latest at
the time of the first interaction or exposure - and requires that information
to conform to the applicable accessibility requirements. A disclosure a screen
reader never reaches does not meet that second clause, which is why this row
exists.

1. Select `New conversation` (third in the list), the conversation whose
   entries are `[]`.
2. Without typing anything, navigate the page from the top with the virtual
   cursor (NVDA: down arrow in browse mode; VoiceOver: VO + right arrow).
3. Note whether the disclosure band is reached, and at what point in the
   reading order. Its text is
   `"You are talking to an artificial intelligence. Answers can contain mistakes."`
   The expected order, from the source, is: the skip link, the sidebar (brand,
   new-chat control, the conversation list), then the main region, whose first
   content is the disclosure, then the empty `role="log"` transcript, then the
   composer and the static-demo note.

Record whether the band was reachable and announced before the first message
was sent, with the transcript empty, on each stack, and where in the reading
order it came. Cite Article 50 of Regulation (EU) 2024/1689 in the record, both
the first-interaction timing obligation and the accessibility-requirements
clause.

### A6. Is the copy toast announced, and does auto-dismiss cut it off?

`Toast` renders a visually hidden `role="status"` / `aria-live="polite"`
region. The demo sets a 4000 ms duration; the package default is 2000 ms.

Copying produces three signals at once, and the row is about the third: the
copy button's own accessible name flips from `"Copy message"` to `"Copied"`, a
visible `Copied!` caption mounts beside it for two seconds, and the toast's
live region receives `"The reply was copied to the clipboard."`. Quote all
three if they were spoken, and say which one the `status` role word belonged
to.

1. Move to any assistant entry. Its action row is visually hidden until the
   entry has focus: Tab into the entry (or reach the button with the virtual
   cursor - it is present, only transparent), then activate the copy button
   (`"Copy message"`).
2. Listen for the toast text.
3. **Local-only, optional.** In the temp copy, set `duration={2000}` on the
   demo's `Toast` in `src/App.tsx`, reload, and repeat step 2 against the
   package default. On the published site this step cannot be run; give the
   row its verdict from steps 1 and 2 and say in the body that step 3 was not
   run.

Record whether the toast was announced at all, and - where step 3 was run -
explicitly whether the two-second auto-dismiss cut the announcement short on
either stack.

### A7. Is each entry's author distinguishable without sight?

Avatars are `aria-hidden`, so the only authorship a screen reader gets is the
article's accessible name - `"Your message"` / `"Assistant response"` - and, when
the consumer supplies attribution, the rendered name line and
`assistantMessageFrom(name)` label (`"Response from <name>"`) that
`ChatMessage` ships.

**A7a, as shipped.** Read the whole of `Delivery change for MB-4821-XQ` top to
bottom with the virtual cursor, alternating user and assistant entries. Record
whether you could tell who wrote each entry without looking; the `article` role
word plus its name is what distinguishes them.

**A7b, two personas - local-only, optional.** The committed demo passes no
`attribution` map, so it renders one voice. In the temp copy, pass
`attribution={{ orders: { name: "Orders" }, billing: { name: "Billing" } }}` to
`ChatMessageList` in `src/App.tsx`, and add `persona: "orders"` to one
assistant entry and `persona: "billing"` to another in `src/fixtures.ts`.
Reload, read the conversation again, and record whether the two authors were
distinguishable. On the published site A7b cannot be run; give the row its
verdict from A7a and say in the body that A7b was not run.

Because A7 is answered against `ChatMessage` and `ChatMessageList`, the record's
`covers` list must include both.

## The record

The pass writes `docs/accessibility/at-pass-<date>.md`, where `<date>` is the
record's `date` field, `YYYY-MM-DD`, and `date` is the day the NVDA listening
finished. If VoiceOver was run on another day, say so in the body; the file
carries one date. The newest file by name is the one `check-at-pass.mjs`
validates, so two records never share a date.

### Front matter

The front matter is machine-read by a deliberately small parser: top-level
scalars, a list of paths, and lists of flat maps; two-space indentation, no
tabs, no nesting beyond one level, no `...` or other elision lines. This block
is complete and copy-pasteable once the values are yours:

```
---
date: 2026-09-15
runner: A Named Person
commit: 0123456789abcdef0123456789abcdef01234567
package: "@re-cinq/bowman-ui@0.1.0"
covers:
  - src/components/ChatMessage.tsx
  - src/components/ChatMessageList.tsx
  - src/components/ThinkingIndicator.tsx
  - src/components/ChatComposer.tsx
  - src/components/Toast.tsx
  - src/components/ThinkingTrace.tsx
  - src/components/ToolActivity.tsx
stacks:
  - screenReader: NVDA 2025.2
    browser: Firefox 142.0
    platform: Windows 11 24H2
    voice: eSpeak NG en-GB
  - screenReader: VoiceOver
    not-run: no macOS device was available in this window
rows:
  - id: A1
    stack: nvda
    verdict: pass
  - id: A1
    stack: voiceover
    verdict: not-run
  - id: A2
    stack: nvda
    verdict: pass
  - id: A2
    stack: voiceover
    verdict: not-run
  - id: A3
    stack: nvda
    verdict: pass
  - id: A3
    stack: voiceover
    verdict: not-run
  - id: A4
    stack: nvda
    verdict: pass
  - id: A4
    stack: voiceover
    verdict: not-run
  - id: A5
    stack: nvda
    verdict: pass
  - id: A5
    stack: voiceover
    verdict: not-run
  - id: A6
    stack: nvda
    verdict: fail
    fixing-issue: re-cinq/bowman-ui#0
  - id: A6
    stack: voiceover
    verdict: not-run
  - id: A7
    stack: nvda
    verdict: pass
  - id: A7
    stack: voiceover
    verdict: not-run
---
```

A VoiceOver stack that was run replaces its `not-run` line with `browser`,
`platform` and `voice`, and its rows carry real verdicts.

Required fields:

| Field     | Rule                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`    | `YYYY-MM-DD`; equal to the filename's date                                                                                                                                                                                |
| `runner`  | The person who listened, as a plain name. No email address and no angle brackets - the placeholder check rejects `<...>`                                                                                                  |
| `commit`  | Lowercase 40-hex sha of the commit the surface was built from ([Which commit](#which-commit)); `--freshness` also requires it to exist in the repository                                                                  |
| `package` | The package and version listened to, `@re-cinq/bowman-ui@<version>` from `package.json` at that commit                                                                                                                    |
| `covers`  | Path list; every component a row exercises - see below                                                                                                                                                                    |
| `stacks`  | Exactly two entries: one whose `screenReader` starts with `NVDA`, with `browser`, `platform` and `voice` as run; one whose `screenReader` starts with `VoiceOver`, with the same three fields or `not-run: <why>` instead |
| `rows`    | One entry per row per stack: `id` (`A1`..`A7`), `stack` (`nvda` / `voiceover`), `verdict`                                                                                                                                 |

No placeholder may survive into the front matter. The gate rejects the words
`TBD`, `TODO`, `FIXME` and `XXX` - whole words, any case, in any value, a
`reason` included - and any `<angle-bracket>` marker.

### `covers`

`covers` is what makes the record perishable. `check-at-pass.mjs --freshness`
takes the last commit touching each listed path and fails when it is not an
ancestor of the record's `commit`: editing `ChatMessageList.tsx` mechanically
invalidates the pass that certified it, and the next release is blocked until
someone listens again.

List every component the rows exercise, which today means all seven above -
`ChatMessage.tsx` and `ChatMessageList.tsx` (A1, A7), `ThinkingIndicator.tsx`
(A2, A3), `ChatComposer.tsx` (A4), `Toast.tsx` (A6), and `ThinkingTrace.tsx`
and `ToolActivity.tsx`, which render inside the same transcript the virtual
cursor walks in A1 and A7. The gate checks the list's shape, not its
membership; the seven are this document's rule. A path no commit touches - a
typo - fails `--freshness` on release day, so copy the paths from the block
above.

### Verdicts

Every row A1 to A7 carries a verdict on every stack, from `pass`, `fail`,
`waived` and `not-run`.

- **`fail`** must name either the issue that will fix it (`fixing-issue`, as
  `re-cinq/bowman-ui#<number>` - open it first) or the maintainer who accepted
  the behaviour as shipped (`accepted-by`, a plain name). Fixing what a row
  finds is a separate pull request against the component that shipped the
  behaviour, never this one.
- **`waived`** must carry `waived-by` (a maintainer's plain name) and `expires`
  (`YYYY-MM-DD`, a real date later than today; `never` is rejected). An expired
  waiver fails with the same exit code as a stale record, so a first release is
  not hostage to VM access but a waiver cannot quietly become permanent.
- **`not-run`** is legal only on a `voiceover` row. On a VoiceOver stack that
  was run it must carry its own `reason`; on a VoiceOver stack declared
  `not-run` it is required on every row and carries no `reason` of its own.

### The body

Below the front matter, one section per row, headed `## A1` to `## A7` (the
spec links to those anchors), carrying what was actually heard: verbatim
Speech Viewer lines in quotation marks, the reading order where it matters, the
stack that produced each, and a plain sentence for any optional sub-step that
was not run. The front matter is the gate's input; the body is the evidence a
human reads.

## GDPR

This repository is public, so a committed record is a publication. Records in
this directory contain no customer data: no real name of any customer, no real
booking reference, no email address, no phone number, and no screenshot or
audio recording carrying any of those. The `runner` field is the one real
name a record carries, by design. Everything the pass touches is invented
fixture data from the demo catalogue, and the verbatim transcriptions are of
that fixture data being read aloud. Before pasting Speech Viewer lines, strip
anything that is not the page: window titles, the Windows account name, other
applications' announcements. If a pass is ever run against a real deployment,
the record still carries only invented inputs and redacted transcriptions.

## The gate, and checking your record before the pull request

```
node scripts/check-at-pass.mjs --structure    # every pull request, via ci.yml
node scripts/check-at-pass.mjs --freshness    # before npm publish, via publish.yml
```

`--structure` validates the newest record when one exists and passes with a
warning when none does. `--freshness` fails when no record exists at all, and
fails on a stale record or an expired waiver. Both exit 1 on a violation and 2
on a usage or environment error.

Run both locally before opening the pull request - `--freshness` needs the full
history, so a shallow clone reports every record stale - and then the two
formatters CI will also run on the new file:

```
npm run prettier
npm run lint
```

`npm run lint` includes a dead-link check over every markdown file, so any
repository-relative link in the body must resolve. Open the pull request from a
`docs/<description>` branch with a `docs(at-pass): ...` commit, as
[CONTRIBUTING.md](../../CONTRIBUTING.md) describes.
