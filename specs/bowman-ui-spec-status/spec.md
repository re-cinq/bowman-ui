# bowman-ui spec status

| Field  | Value                |
| ------ | -------------------- |
| Issue  | re-cinq/bowman-ui#17 |
| Status | Shipped              |

A spec that opens straight into a metadata table gives a reader nothing to orient on, and a
status row a human last touched six sweeps ago says more about that human than about the spec.
This file carries the header table this feature introduces, the lifecycle rule behind its
`Status` value, the ADR exception, and the contract of `npm run check:spec-status`. The
enforcement decision lives in docs/design-notes.md § Lint guardrails decision 11.

The header table is the shape above: the spec's title, then a two-column table carrying an
`Issue` row and a `Status` row, then a lead paragraph before the first `##` section. It is
published in AGENTS.md § Spec Header Table, and the free-text `Issue:` line it replaces folds
into the `Issue` row. ADRs declare their status as YAML frontmatter `status:` instead.

## The rule

- A doc's status is read from the `| Status |` cell for a spec and the frontmatter `status:`
  key for an ADR, and buckets into one of five values: every label in a bucket's row means that
  bucket, the two terminal buckets skip the check whatever the coverage, and a cell no parser
  reads buckets to nothing ([validated by](../../tests/check-spec-status.test.ts#L57),
  [L64](../../tests/check-spec-status.test.ts#L64),
  [L72](../../tests/check-spec-status.test.ts#L72),
  [L79](../../tests/check-spec-status.test.ts#L79)).

| Written into the doc                                             | Bucket                       |
| ---------------------------------------------------------------- | ---------------------------- |
| `Draft`                                                          | `draft`                      |
| `In Progress`, `In Review`, `Planning`, `WIP`, `Proposed`        | `in-progress`                |
| `Shipped`, `Implemented`, `Complete`, `Accepted`, `Done`, `Live` | `shipped`                    |
| `Retired`, `Superseded`, `Removed`, `Deprecated`, `Obsolete`     | `retired` - skips the check  |
| `Rejected`, `Abandoned`                                          | `rejected` - skips the check |

- The bucket every non-terminal doc is entitled to claim is its own link coverage, counted over
  its testable statements alone ([validated by](../../tests/check-spec-status.test.ts#L42)).

| Testable statements linked | Tier      | Entitled to claim |
| -------------------------- | --------- | ----------------- |
| no testable statement      | `vacuous` | anything          |
| none                       | `none`    | `Draft`           |
| some                       | `partial` | `In Progress`     |
| all                        | `full`    | `Shipped`         |

- A spec whose status matches its coverage tier reports nothing
  ([validated by](../../tests/check-spec-status.test.ts#L42)).
- A spec claiming a tier above its coverage is reported against its status row, naming the
  linked count, the testable count and the status the coverage entitles it to
  ([validated by](../../tests/check-spec-status.test.ts#L49)).
- A doc whose status no parser can read is reported as untagged against its status row when it
  has one — a `| Status | Banana |` row is reported at that row's line — and against line 1 only
  when the doc carries no status row at all
  ([validated by](../../tests/check-spec-status.test.ts#L90), and
  [L79](../../tests/check-spec-status.test.ts#L79)).
- A doc that opens straight into a section, with no lead paragraph before the first `##`, is
  reported against line 1 ([validated by](../../tests/check-spec-status.test.ts#L101)).
- An ADR's lead-paragraph finding is reported against the first line after its frontmatter,
  which is the first line a lead paragraph could occupy
  ([validated by](../../tests/check-spec-status.test.ts#L119)).

## The ADR exception

- An ADR with `status: accepted`, a lead paragraph and no test links reports nothing, because
  the coverage tier is a spec-only verdict
  ([validated by](../../tests/check-spec-status.test.ts#L112)).

## The script's contract

- With no path arguments it scans every `specs/<slug>/spec.md` in sorted slug order followed by
  every `adrs/*.md` in sorted name order, which is exactly the list an explicit invocation of
  those paths produces ([validated by](../../tests/check-spec-status.test.ts#L231)).
- Each finding prints one line carrying the doc, the line a human has to edit, and the finding
  itself; the run closes with `spec-status: <N> findings across <M> docs (<D> scanned)` and
  exits 1 when `N` is above zero ([validated by](../../tests/check-spec-status.test.ts#L130)).
- `--coverage` replaces the report with one line per unlinked testable statement under a
  `spec-coverage: <U> unlinked testable statements across <M> docs (<D> scanned)` summary
  ([validated by](../../tests/check-spec-status.test.ts#L151)).
- `--coverage` exits 0 even on a doc the default run fails
  ([validated by](../../tests/check-spec-status.test.ts#L164)).
- `--json` replaces the report with an array alone, each entry carrying `doc`, `line`, `kind`
  and `message` ([validated by](../../tests/check-spec-status.test.ts#L169)).
- Under `--coverage` every entry's `kind` is `unlinked`
  ([validated by](../../tests/check-spec-status.test.ts#L183)).
- An unrecognised flag exits 2 with the usage line rather than scanning anything
  ([validated by](../../tests/check-spec-status.test.ts#L194)).
- A doc path that cannot be read exits 2 naming that path, so a typo is never reported as a
  clean run ([validated by](../../tests/check-spec-status.test.ts#L203)).
- A doc path under neither `specs/` nor `adrs/` exits 2 naming that path rather than being
  scanned with no corpus to judge it by
  ([validated by](../../tests/check-spec-status.test.ts#L210)).
- A relative path means the same doc from any working directory
  ([validated by](../../tests/check-spec-status.test.ts#L217)).
- An absolute path is accepted and reported root-relative
  ([validated by](../../tests/check-spec-status.test.ts#L224)).

## Rationale

**Statement links are a report, not a gate.** 421 testable statements across the corpus carry
no link on the branch this landed on, and the repo lints at zero warnings. A gate on day one
would only mean a disabled gate, so the count lives behind `--coverage`, which always exits 0,
and the backfill is the sweep tasks' work.

**ADRs are exempt from the coverage tier, not from the other two checks.** Lore's parser folds
`accepted` into `shipped`, so an ADR carrying `status: accepted` and no test links would be
told to link every statement it makes, which is the wrong ask of a decision record. ADRs keep
`status: accepted` and are still required to parse a status and to open with a lead paragraph.

**Node 22.6, not 22.** The script runs under `--experimental-strip-types` so it can load the
mirrored TypeScript directly, which puts its floor above `package.json`'s `engines.node` of
`>=22`. That floor stays as it is, and CI's `node-version: "22"` satisfies both.

**Fixtures, not the repo's own docs.** The behavioural pins run against invented specs and ADRs
under `tests/fixtures/spec-status/`, so a sweep that adds a status row to a real spec cannot
turn a pin red. The one test that reads `specs/` and `adrs/` asserts an equality between two
runs rather than a count, so it survives every sweep too.

**Lore's verdict, not a local one.** The lead-paragraph, status-bucket and coverage-tier
verdicts all come from byte-exact mirrors of lore's own modules rather than a reimplementation,
for the reason decision 10 gives: a guess at agreement is the failure mode the gate exists to
close.

**No autofix.** Flipping a status row is mechanical, but only once the links behind it exist,
and choosing which test validates a statement is a judgement the script has no basis to make.
It reports; a person writes the link and then the row follows.
