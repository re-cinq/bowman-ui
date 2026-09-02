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

`verdict: not-run` is a legal verdict **only** on a VoiceOver row and **only**
with a `reason` field stating why (no macOS device available, and so on). The
gate rejects `not-run` anywhere else.

## Language and voice

The pass runs against the demo's English catalogue
(`examples/chat-demo/src/labels.ts`), which reuses the library's own English
defaults plus the demo's `aiDisclosure` and screen copy. Run with an English
voice and **record which voice was actually used** in the record's `stacks`
block. The record transcribes what was spoken, verbatim, and never judges
pronunciation.

## Expected runtime

Roughly 60 to 90 minutes per stack for a first run - the seven rows themselves
are about 30 minutes, the rest is stack setup, voice installation and writing
down verbatim announcements. A repeat run against an unchanged surface is about
30 minutes per stack.

## Running the surface under test

The pass is run against the packed library in the standalone Vite demo, not
against a dev build of `src/`, so what is listened to is what a consumer
installs:

```
scripts/consumer-app.sh --keep     # prints the temp directory it built
cd <the printed temp directory>
npm run dev                        # or: npm run build && npm run preview
```

Open the printed URL with `?view=chat` appended in the stack's browser: the
chat is the fixture under test, and the bare URL now serves the component
documentation, not the chat. The demo brand is `Marginalia Books`; the three
conversations are `Delivery change for MB-4821-XQ`,
`Damaged copy of The Cartographer's Atlas` and `New conversation`. All of it
is invented fixture data.

Sending a message streams a canned reply through the same lifecycle HAL
produces - the entry appears empty, grows over 24 timed steps across roughly
3.5 seconds, then commits - so there is a real streaming answer to listen to.

## The rows

### A1. Is a completed streamed answer announced?

`ChatMessageList` marks the transcript `role="log"` with `aria-live="off"`, and
says so plainly. Whether that combination announces anything on completion is
the question.

1. Open the demo on `Delivery change for MB-4821-XQ`.
2. Focus the composer, type any question, press Enter.
3. Listen through the whole stream, from the empty entry to the commit.

Record, **verbatim**, what each stack announced at the moment the answer
finished - including the word `nothing` when nothing was announced. Nothing is
a legitimate finding and the most likely one; do not paraphrase it into
"minimal announcement".

### A2. Is `ThinkingIndicator` announced under an `aria-live="off"` ancestor?

`ThinkingIndicator` carries `role="status"` and `aria-live="polite"`, but it
mounts inside the transcript, whose ancestor sets `aria-live="off"`.

1. Open a conversation that already has entries (`Delivery change for MB-4821-XQ`).
2. Send a message. Between the send and the entry appearing, the demo sets
   `busy` true and the indicator mounts.
3. Listen for an announcement in that window.

Record per stack whether the `role="status"` region was announced despite the
`aria-live="off"` ancestor.

### A3. Which string is spoken for the thinking indicator?

Two strings compete: the visible label (`thinking`, `"Thinking"` in the demo
catalogue) and the region's `aria-label` (`thinkingRegion`,
`"Loading response"`).

1. Trigger the indicator as in A2.
2. Note which of the two strings was spoken.

Record which string each stack spoke.

### A4. Does the composer announce its label, not its placeholder?

The demo's `composerInput` label is `"Your message"` and its
`composerPlaceholder` is `"Reply..."`. Read both from
`examples/chat-demo/src/labels.ts` at the time of the pass rather than from
this document, and record the values you actually saw.

1. Tab to the composer, or click it and then Tab away and back.
2. Note what was announced on focus.

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

1. Select `New conversation`, the conversation whose entries are `[]`.
2. Without typing anything, navigate the page from the top with the virtual
   cursor (NVDA: down arrow in browse mode; VoiceOver: VO + right arrow).
3. Note whether the disclosure band is reached, and at what point in the
   reading order. Its text is
   `"You are talking to an artificial intelligence. Answers can contain mistakes."`

Record whether the band was reachable and announced before the first message
was sent, with the transcript empty, on each stack. Cite Article 50 of
Regulation (EU) 2024/1689 in the record, both the first-interaction timing
obligation and the accessibility-requirements clause.

### A6. Is the copy toast announced, and does auto-dismiss cut it off?

`Toast` renders a visually hidden `role="status"` / `aria-live="polite"`
region. The demo sets a 4000 ms duration; the package default is 2000 ms.

1. Move to any assistant entry, activate its copy button
   (`"Copy message"`).
2. Listen for the toast text (`"The reply was copied to the clipboard."`).
3. Repeat with the package default duration of 2000 ms - set `duration={2000}`
   on the demo's `Toast` locally - and listen again.

Record whether the toast was announced at all, and explicitly whether the
two-second auto-dismiss cut the announcement short on either stack.

### A7. Is each entry's author distinguishable without sight?

Avatars are `aria-hidden`, so the only authorship a screen reader gets is the
article's accessible name - `"Your message"` / `"Assistant response"` - and, when
the consumer supplies attribution, the rendered name line and
`assistantMessageFrom(name)` label that `ChatMessage` ships (issue 121).

**A7a, as shipped.** Read the whole of `Delivery change for MB-4821-XQ` top to bottom
with the virtual cursor, alternating user and assistant entries. Record whether
you could tell who wrote each entry without looking.

**A7b, two personas.** The committed demo passes no `attribution` map, so it
renders one voice. Before running A7b, make a **local, uncommitted** edit to
`examples/chat-demo/src/App.tsx`: pass
`attribution={{ orders: { name: "Orders" }, billing: { name: "Billing" } }}` to
`ChatMessageList`, and add `persona: "orders"` to one assistant entry and
`persona: "billing"` to another in `examples/chat-demo/src/fixtures.ts`. Read the
conversation again and record whether the two authors were distinguishable.
Revert the edit afterwards - committing it changes the articles' accessible
names and breaks the demo's Playwright counts.

Because A7 is answered against `ChatMessage` and `ChatMessageList`, the record's
`covers` list **must** include both, and the record's `commit` must postdate the
attribution merge that shipped the name line (issue 121). A record whose
commit predates it has not answered A7 as this document defines it.

## The record

The first pass writes `docs/accessibility/at-pass-<date>.md`, dated
`YYYY-MM-DD`. The newest file by name is the one `check-at-pass.mjs` validates.

### Front matter

The front matter is machine-read. Its shape is exactly this - top-level
scalars, a list of paths, and lists of flat maps; no nesting beyond one level:

```
---
date: 2026-09-15
runner: A Named Person
commit: 0000000000000000000000000000000000000000
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
  - screenReader: VoiceOver macOS 26.1
    browser: Safari 26.1
    platform: macOS 26.1
    voice: Daniel en-GB
rows:
  - id: A1
    stack: nvda
    verdict: pass
  - id: A1
    stack: voiceover
    verdict: not-run
    reason: no macOS device was available in this window
  ...
---
```

Required fields, all of which the gate enforces:

| Field     | Rule                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`    | `YYYY-MM-DD`, the date the listening happened                                                                                                                                                               |
| `runner`  | The person who listened. Required by construction, never inferred                                                                                                                                           |
| `commit`  | 40-hex sha of the commit the surface was built from                                                                                                                                                         |
| `package` | The package and version listened to                                                                                                                                                                         |
| `covers`  | Path list; every component a row exercises                                                                                                                                                                  |
| `stacks`  | Exactly two entries, each with `screenReader`, `browser`, `platform` and `voice`, with versions actually run: one whose `screenReader` starts with `NVDA`, one whose `screenReader` starts with `VoiceOver` |
| `rows`    | One entry per row per stack: `id`, `stack` (`nvda` / `voiceover`), `verdict`                                                                                                                                |

No placeholder may survive into the front matter. The gate rejects `TBD`,
`TODO`, `FIXME`, `XXX` and `<angle-bracket>` markers anywhere in the block.

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
cursor walks in A1 and A7. Listing fewer paths does not make the record more
durable; it makes it less true.

### Verdicts

Every row A1 to A7 carries a verdict on every stack, from `pass`, `fail`,
`waived` and `not-run`.

- **`fail`** must name the issue slug that will fix it (`fixing-issue`) or the
  person who accepted it (`accepted-by`). Fixing what a row finds is a separate
  pull request against the component that shipped the behaviour, never this one.
- **`waived`** must carry `waived-by` and `expires` (`YYYY-MM-DD`). An expired
  waiver fails with the same exit code as a stale record, so a first release is
  not hostage to VM access but a waiver cannot quietly become permanent.
- **`not-run`** is legal only on a `voiceover` row and must carry `reason`.

### The body

Below the front matter, one section per row carrying what was actually heard:
verbatim announcements in quotation marks, the reading order where it matters,
and the stack that produced each. The front matter is the gate's input; the
body is the evidence a human reads.

## GDPR

`014` makes this repository public, so a committed record is a publication.
Records in this directory contain no customer data: no real name, no real
booking reference, no email address, no phone number, and no screenshot or
audio recording carrying any of those. Everything the pass touches is invented
fixture data from the demo catalogue, and the verbatim transcriptions are of
that fixture data being read aloud. If a pass is ever run against a real
deployment, the record still carries only invented inputs and redacted
transcriptions.

## The gate

```
npm run check:at-pass -- --structure    # every pull request, via ci.yml
npm run check:at-pass -- --freshness    # before npm publish, via publish.yml
```

`--structure` validates the newest record when one exists and passes with a
warning when none does. `--freshness` fails when no record exists at all, and
fails on a stale record or an expired waiver. Both exit 1 on a violation and 2
on a usage or environment error.
