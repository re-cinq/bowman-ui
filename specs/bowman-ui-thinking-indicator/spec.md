# bowman-ui thinking indicator

Issue: issue 74 (`024-bowman-ui-thinking-indicator`)

`ThinkingIndicator` is the block loading indicator shown while waiting for a
response - a pulsing avatar circle, the word "Thinking", three fading
dots - rendered by a consumer behind its `!isStreaming`
gate. `src/components/ThinkingDots.tsx` is the
three delayed dots, shared with `InlineThinkingIndicator` so the animation
timing cannot drift between the two forms; `InlineThinkingIndicator` is
refactored onto it with no behavior change.

## The public surface

`ThinkingIndicatorProps` is exactly `assistantAvatar` and `labels` - the
source's `label?: string` is gone.
`defaultThinkingIndicatorLabels` is a frozen
`Readonly<Required<ThinkingIndicatorLabels>>` over `thinking` (`"Thinking"`,
the key name 023 gave the inline form) and `thinkingRegion`
(`"Loading response"`, the `aria-label` on the `role="status"` element)
([validated by](../../tests/ThinkingIndicator.test.tsx#L29),
[L109](../../tests/ThinkingIndicator.test.tsx#L109)). A key added
without a default fails the build, pinned from outside by an
`@ts-expect-error` fixture
([validated by](../../tests/types/thinking-indicator-type-assertions.tsx#L19),
compiled by
[thinking-indicator-dist](../../tests/thinking-indicator-dist.test.ts#L26)).

`ThinkingDots` is deliberately not exported: an `@ts-expect-error` import in
the same fixture pins it out of the public type surface
([validated by](../../tests/types/thinking-indicator-type-assertions.tsx#L10)).
The runtime export set of `dist/index.js` is pinned separately by the
`public-api` exact snapshot of 47 values and 31 types after this issue.
`dist/components/ThinkingDots.{js,d.ts}` packs
with the rest of `dist/`, but `package.json`'s `exports` map exposes only `"."`
and `"./styles.css"`, so no consumer can deep-import the private component
([validated by](../../tests/system-contract.test.ts#L30),
[public-api](../../tests/public-api.test.ts#L43)).

## The decisions

1. **Both strings are overridable.** A hardcoded `aria-label` competes with
   the visible label for what assistive tech announces, so leaving it fixed
   would break translation silently even after `labels` shipped.
   - With no `labels` prop the visible text is `"Thinking"` and the
     `role="status"` element carries `aria-label="Loading response"`
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L12)).
   - With Danish overrides neither English string appears anywhere in the
     rendered output
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L20)).
   - The attribute is kept rather than removed; whether a real screen reader
     announces it over the live-region content is unverified follow-up work
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L12)).
2. **The avatar slot is the glyph, not the circle** (018 decision 3).
   - `assistantAvatar` renders inside the circle
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L42)).
   - With none supplied the circle is empty
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L52)).
   - `LogoIcon` appears nowhere in `src/` or `dist/`
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L142)).
3. **The circle is unconditionally `aria-hidden` and unconditionally
   pulsing.** An announced avatar inside a `role="status"` region would just
   be noise, and this component is itself the loading state, so no prop turns
   either off ([validated by](../../tests/ThinkingIndicator.test.tsx#L61)).

   Recorded asymmetry: `ChatMessage`'s assistant circle carries no
   `aria-hidden`, so a consumer-supplied avatar's accessible name is silenced
   here and not there - correct per the issue (the status region owns the
   name), noted so the next reader finds it decided rather than drifted
   ([validated by](../../tests/ThinkingIndicator.test.tsx#L61)).

4. **One dots implementation, one dots assertion.** `ThinkingDots` owns the
   `flex gap-0.5` wrapper span and the three `bowman-fade-dot` dots at
   `animationDelay` `0s`/`0.2s`/`0.4s` - markup-identical to both source
   forms (`ThinkingIndicator.tsx:21-34` and `48-61`, which duplicate the same
   span).
   - Both components import it
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L126)).
   - One shared test helper
     ([expect-thinking-dots](../../tests/helpers/expect-thinking-dots.ts))
     asserts count, order and delays against both
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L37),
     [inline](../../tests/InlineThinkingIndicator.test.tsx#L20)).
   - `InlineThinkingIndicator` still renders its label and dots with no
     `role="status"` and no avatar circle
     ([validated by](../../tests/ThinkingIndicator.test.tsx#L74)).

## The 015 characterization suite, substituted

No prior characterization suite existed for this surface (issue 9), so the
tests are
written from the behaviors the acceptance criteria pin: the default and
overridden labels, the `role="status"` semantics, the dot count, order,
delays and class, the empty avatar circle, and the unconditional
`aria-hidden`/pulse (`tests/ThinkingIndicator.test.tsx`;
[validated by](../../tests/ThinkingIndicator.test.tsx#L12)).

Two renames inherited from 019 rather than adapted here, since 019 shipped
every package animation class under the `bowman-` prefix - the same recorded
deviation as 023's and 025's. The dots carry `bowman-fade-dot`, not the issue
text's `animate-fade-dot`
([validated by](../../tests/ThinkingIndicator.test.tsx#L37)). The circle
carries `bowman-pulse-subtle`, not `animate-pulse-subtle`
([validated by](../../tests/ThinkingIndicator.test.tsx#L61)). One path correction: the labels partition lives
at `tests/labelled-exports.test.tsx`, not the issue text's
`src/__tests__/labelled-exports.tsx`, and the component tests at
`tests/ThinkingIndicator.test.tsx`, not `tests/components/` - the repo's
shipped layout since 022
([validated by](../../tests/ThinkingIndicator.test.tsx#L37),
[L61](../../tests/ThinkingIndicator.test.tsx#L61)).

## Carried across mechanically

- `ThinkingIndicator` joins the `labelsProp` partition bucket with a sentinel
  harness ([validated by](../../tests/labelled-exports.test.tsx#L77),
  [L395](../../tests/labelled-exports.test.tsx#L395)).
  - The partition test still asserts the full barrel, which `ThinkingDots`
    never enters.
  - The `thinkingRegion` sentinel lands in `aria-label`, one of the seven
    checked attributes
    ([validated by](../../tests/labelled-exports.test.tsx#L469)).
- No `@clerk`, `swr`, `next-intl`, `next/` or `@/` import in
  either new file, and every relative import ends in `.js`
  ([validated by](../../tests/ThinkingIndicator.test.tsx#L115)).
- Both new files carry `"use client"` as the first statement of their `dist/`
  output, per 018 decision 1's positional check and
  `scripts/check-client-directives.mjs`
  ([validated by](../../tests/thinking-indicator-dist.test.ts#L8)).
- Neither file references a client-only API today; docs/design-notes.md decision 1's
  recorded exception ([docs/design-notes.md](../../docs/design-notes.md#L83), amended in this
  issue) covers the chat surface's presentational components and the private
  subcomponents they compose, extending 023's shipped `InlineThinkingIndicator`
  precedent ([validated by](../../tests/thinking-indicator-dist.test.ts#L8)).
- **GDPR.** The component renders only its own labels - no customer data
  reaches it.
  - Neither file references `console.`, `localStorage`, `sessionStorage`,
    `fetch` or `sendBeacon`
    ([validated by](../../tests/ThinkingIndicator.test.tsx#L136)).
  - The suite-wide console trap 023 installed in `tests/setup.ts` fails any
    test that writes to the console
    ([validated by](../../tests/ThinkingIndicator.test.tsx#L136)).
- `npm pack --dry-run` ships both built files with their `d.ts` counterparts
  ([validated by](../../tests/thinking-indicator-dist.test.ts#L17)).

## Amended by 078

The `role="status"` element now carries an explicit `aria-live="polite"` -
the ARIA-canonical spelling of the role's implicit value - so
`ChatMessageList` can query the live-region override as an attribute inside
its `aria-live="off"` transcript
([validated by](../../tests/ThinkingIndicator.test.tsx#L153)).
