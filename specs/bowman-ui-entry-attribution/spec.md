# bowman-ui entry attribution

Issue: issue 121 (`121-bowman-ui-entry-attribution`)

Two assistant answers in one conversation can now show two different faces
and two different names, the way a group chat shows a changing speaker.
`028`'s `assistantAvatar` stays exactly what it was - the single default face
of the conversation - and gains a per-entry override resolved from data the
consumer already holds: `AssistantChatEntry.persona`, an opaque id, looked up
in `ChatMessageList`'s new `attribution` table. Nothing here decides who the
personas are (`KU-16`), and nothing here produces the field: `100` ships the
producer, `056` ships the voice.

## The public surface

`AssistantChatEntry` gains `persona?: string` and no other role does. The
field is caller-supplied - the same precedent as `toolStatus`, which has no
counterpart in the HAL protocol either - and is documented as the counterpart
to `hal-engine`'s `AssistantEntry.persona`; no import of `@re-cinq/hal-engine`
appears anywhere in `src/`. `UserChatEntry`, `ThinkingChatEntry` and
`ToolChatEntry` reject it as a compile error, pinned by three
`@ts-expect-error` fixtures
([validated by](../../tests/types/chat-type-assertions.ts#L22),
[thinking](../../tests/types/chat-type-assertions.ts#L30),
[tool](../../tests/types/chat-type-assertions.ts#L39)); an assistant entry
carrying one compiles
([validated by](../../tests/types/chat-type-assertions.ts#L56)).

`ChatAttribution` is `{ name?: string; avatar?: ReactNode }` and nothing
else - a third member would be a second place authorship is decided. It is
declared in `src/components/ChatMessageList.tsx`, beside the prop that
consumes it (the same placement as `ConversationListItem` and
`SidebarNavItem`), and re-exported as a type from `src/index.ts`, so the
public-API snapshot records it. The built shape is asserted member by member
([validated by](../../tests/chat-message-list-dist.test.ts#L55)), the barrel's
type export by name
([validated by](../../tests/chat-message-list-dist.test.ts#L46)), and a fourth
member is a compile error from outside the package
([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L40)).

Deviation from the issue's wording, recorded rather than papered over: the
criterion asks for a test that "greps `dist/index.d.ts` and fails on any third
member". `tsc`'s declaration emit re-exports names from a barrel and never
inlines a body - no interface body appears in `dist/index.d.ts` for any type
in this package - so the member list is read from
`dist/components/ChatMessageList.d.ts`, the file that declares it, and
`dist/index.d.ts` is asserted separately to export the name. The criterion's
other half, that `dist/index.d.ts` carries no `describeAssistant`,
`renderAttribution` or `renderEntry`, is asserted literally on both files
([validated by](../../tests/chat-message-list-dist.test.ts#L78)).

`ChatMessageListProps` gains `attribution?: Readonly<Record<string, ChatAttribution>>`
and nothing else; the built member list is pinned in full order, so a second
prop smuggled in with it fails
([validated by](../../tests/chat-message-list-dist.test.ts#L59)). `ChatMessage`
gains exactly one prop, `assistantName?: string`.

## The decisions

1. **A lookup table, never a render function.** `078`'s measured finding is
   that a React server component cannot pass a function across the client
   boundary, so `attribution` is a plain object literal - the shape a server
   component _can_ pass, avatar elements included. It also fits the producer
   better: the projection from id to chrome is data the consumer's persona
   registry already holds, not a function it has to write. The RSC fixture's
   server page now passes exactly that literal (below), and
   `tests/types/chat-message-list-type-assertions.tsx` compiles the same shape
   against `dist/`
   ([validated by](../../tests/types/chat-message-list-type-assertions.tsx#L35),
   [the prop](../../tests/types/chat-message-list-type-assertions.tsx#L91),
   compiled by
   [chat-message-list-dist](../../tests/chat-message-list-dist.test.ts#L109)).
2. **The list resolves, the message renders.** `ChatMessageList` performs the
   lookup per entry - `entry.persona ? attribution?.[entry.persona] : undefined`,
   written as a pure `attributionFor` helper outside the component because a
   user entry carries no `persona` at all - and passes
   `assistantAvatar={resolved?.avatar ?? assistantAvatar}` and
   `assistantName={resolved?.name}` down. `ChatMessage` knows nothing about
   personas: it takes a name and renders it. Two personas render two names and
   two faces in one conversation
   ([validated by](../../tests/ChatMessageList.test.tsx#L460)); a persona that
   resolves to a name but no avatar keeps the default face
   ([validated by](../../tests/ChatMessageList.test.tsx#L565)).
3. **An unknown id falls back and is never rendered.** A persisted or replayed
   session can name a persona the consumer has since retired, so an id absent
   from the table resolves to the default `assistantAvatar` with no name, and
   the raw id appears nowhere in `container.innerHTML`
   ([validated by](../../tests/ChatMessageList.test.tsx#L482)).
4. **The prop is inert for every existing consumer.** With `attribution`
   supplied and no entry carrying a `persona`, the render is byte-identical to
   the same render with the prop omitted; entries carrying a `persona` with
   `attribution` omitted are byte-identical to the same entries without one.
   Both are asserted as `innerHTML` equality, not as a spot check
   ([validated by](../../tests/ChatMessageList.test.tsx#L499),
   [persona without a table](../../tests/ChatMessageList.test.tsx#L515)).
5. **The `busy` tail keeps the default avatar.** No entry - and therefore no
   persona - exists at the point the thinking indicator renders, so the tail
   takes `assistantAvatar` unchanged even when the last entry carries a
   persona with a matching table row
   ([validated by](../../tests/ChatMessageList.test.tsx#L534)).
6. **No "hide names until there are two personas" logic.** A consumer that
   wants no names omits the map. The package counts nothing and infers
   nothing.
7. **The name line is the only authorship assistive technology gets.** The
   avatar is decorative chrome, so with `assistantName` set the article's
   accessible name becomes `assistantMessageFrom(name)` instead of the default
   `"Assistant response"`
   ([validated by](../../tests/ChatMessage.test.tsx#L495),
   [with an avatar supplied](../../tests/ChatMessage.test.tsx#L545)). Without
   the prop, `023`'s assertion is unchanged - `"Assistant response"` exactly -
   and exactly one element fewer renders
   ([validated by](../../tests/ChatMessage.test.tsx#L502)). `assistantName`
   passed with a `UserChatEntry` renders no name and leaves the user article's
   label alone ([validated by](../../tests/ChatMessage.test.tsx#L536)).

## The label

`ChatMessageLabels` gains `assistantMessageFrom: (name: string) => string`,
default `` (name) => `Response from ${name}` `` - the function form
CONTRACT.md § Labels decision 4 requires of any interpolated label, never a
template string with placeholders. `defaultChatMessageLabels` still typechecks
as `Readonly<Required<ChatMessageLabels>>`
([validated by](../../tests/types/chat-message-type-assertions.tsx#L48),
[the override](../../tests/types/chat-message-type-assertions.tsx#L49)), the
default is a function of one string
([validated by](../../tests/ChatMessage.test.tsx#L529)), and a supplied
`assistantMessageFrom` returning `"Svar fra " + name` produces
`"Svar fra Økonomi"`
([validated by](../../tests/ChatMessage.test.tsx#L516)).

`resolveLabels` needed no change: it is generic over `object` and copies a
function value by reference like any other. The `no-restricted-syntax` labels
rules needed none either - they fire on JSX text and assistive attributes
holding literals, and a function label is neither. `029`'s
`deleteConversation` is the precedent this follows; `assistantMessageFrom` is
the second function-form label in the package, not the first.

`022`'s sentinel harness did need one change. It read each component's
sentinel values as `Object.values(...)`, which is `string[]` only while every
label is a string; with a function label present the harness lists the
computed sentinel beside the plain ones, exactly as `029`'s
`ConversationList` harness already did, through a shared `plainSentinels`
filter ([validated by](../../tests/labelled-exports.test.tsx#L260)). The
`ChatMessage` harness renders an `assistantName`
([validated by](../../tests/labelled-exports.test.tsx#L301)) and the
`ChatMessageList` harness renders a persona'd entry with a matching
`attribution` row
([validated by](../../tests/labelled-exports.test.tsx#L346)), so the label is
covered through both paths and a hardcoded string on either cannot hide from
the Latin-run check
([validated by](../../tests/labelled-exports.test.tsx#L184)).

`ChatAttribution` is a **type-only** export, so it appears in none of the
export-partition buckets: `labelsProp`, `stringPropOnly` and `noStrings`
together must equal the barrel's _value_ exports exactly, and adding a type
name to any bucket fails that test rather than satisfying it. The rule is
recorded where a future reader will look for it
([validated by](../../tests/labelled-exports.test.tsx#L59)).

## The public-API snapshot

`ChatAttribution` is an addition - a minor, never a rename or a removal - so
`tests/fixtures/public-api.json` was regenerated with
`npm run build && node scripts/write-public-api.mjs`, never hand-edited: 53
runtime values unchanged, 41 type exports (was 40)
([validated by](../../tests/public-api.test.ts#L47)).

## The RSC fixture

`examples/rsc-fixture/app/page.tsx` - a server component, asserted directive-free
on every run by `scripts/rsc-fixture.sh` - now renders `ChatMessageList` with a
module-scope `attribution` literal whose one row carries an element-valued
`avatar` (`<CheckIcon />`), keyed by the persona id its fixture entry carries.
That is the counterpart to the compose page's measured rejection: an object
literal crosses the boundary where a closure does not, and `next build` passes
with the map in place. The fixture data stays invented (`078`'s GDPR rule):
the persona id is `"fixture-persona"` and the name `"Økonomi"` - no OLT
customer data, no real persona registry.

Observed while verifying, recorded rather than dressed up: the prerendered
`/` response carries `aria-label="Response from Økonomi"` and the visible name
line, and it also carries the string `fixture-persona` inside the RSC flight
payload - the serialized props of the client component, which include the
entries themselves. That is prop serialization, not rendered chrome; decision
3's "never in the DOM" claim is asserted where it is meaningful, on
`container.innerHTML` in jsdom.

## GDPR and the EU AI Act

CONTRACT.md gains an `## Attribution` section: `persona` is an opaque
identifier, never free text, persisted/replayed/logged wherever the session
is, and must not carry a customer name or a booking number - linked to
`003-support-conversation-data-flow-record`, which records those stores.
`name` and `avatar` are consumer chrome describing who answered, never who
asked. The same section states that a named, avatared persona is still an AI
system under Article 50(1) of the EU AI Act - a human first name and a face
make the disclosure more necessary, not less - and points at
`062-support-agent-ai-disclosure`. A render whose attribution supplies a human
first name still shows `028`'s resolved `aiDisclosure`, and no prop removes it
([validated by](../../tests/ChatMessageList.test.tsx#L551)).

Zero retention holds by source grep and by the suite-wide spy: neither changed
component calls `console.*`, `localStorage`, `sessionStorage`, `fetch` or
`navigator.sendBeacon`
([validated by](../../tests/ChatMessage.test.tsx#L693),
[the list](../../tests/ChatMessageList.test.tsx#L917)), and `tests/setup.ts`
fails any test whose render touched the console or the network.

## Gates

- `npm run lint`, `npm run typecheck`, `npm run test:coverage` and
  `npm run build` all pass from a clean `npm ci`; the `014` coverage floor
  (100/100/100/90 over `src/**`) holds unchanged.
- `examples/chat-demo/src/labels.ts` supplies a complete
  `ChatMessageListLabels` object, so the new key had to be added there in the
  same change or the `consumer` CI job's typecheck would fail (TS2739). It
  reads `(name) => \`Svar fra ${name}\``, matching the demo's illustrative
  Danish register.
- The icon set's `020` guard - "the registry-lookup `{name: string}`
  `IconProps` shape is absent from `src/`" - was a substring sweep for
  `name: string` anywhere under `src/`, which `ChatAttribution.name` and the
  `assistantMessageFrom(name)` signature both trip without being an icon
  registry. It is now two assertions that keep the guard's teeth: no file in
  `src/` declares an `*IconProps` shape with a `name` string member
  ([validated by](../../tests/icons.test.tsx#L83)), and no file under
  `src/icons` declares a `name` string member at all
  ([validated by](../../tests/icons.test.tsx#L91)).

## Premise discrepancies

- The issue cites `src/__tests__/labelled-exports.tsx`. No such path exists;
  the file is `tests/labelled-exports.test.tsx`, and its partition covers
  value exports only - see the type-only note above.
- The issue's `071` criterion says `scripts/check-at-pass.mjs --freshness`
  exits non-zero after this merge. Neither that script nor `docs/accessibility/`
  exists in this tree; a later issue builds them, and this PR deliberately
  creates neither and fabricates no AT-pass record. The criterion's intent is
  recorded instead: the AT-pass record authored later must list
  `ChatMessage.tsx` and `ChatMessageList.tsx` in its `covers` set, and must
  postdate this merge - re-answering A7 with two personas rendered.

## Out of scope

The producer of the field (`100`) and the line that sets `activePersona`; the
consuming end that copies `persona` through and builds the map from `056`'s
registry; who the personas are (`KU-16`); group-chat presentation (threading,
grouping, collapsing avatars); attribution on tool, thinking or user entries;
feeding the persona back to the model; any change to `assistantAvatar`'s
meaning or its streaming treatment; validating the id.
