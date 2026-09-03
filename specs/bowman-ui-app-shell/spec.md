# bowman-ui app shell

Issue: re-cinq/Otto#80 (`030-bowman-ui-app-shell`)

`AppShell` is the application frame - desktop rail, mobile slide-in
drawer, mobile header, `<main>` - shipped as `src/components/AppShell.tsx`
(`AppShell`, `AppShellProps`, `SidebarSlotContext`, `AppShellLabels`,
`defaultAppShellLabels`). The sidebar's own contents are issue 031's; this
component imports none of them and renders whatever `renderSidebar` returns
([validated by](../../tests/AppShell.test.tsx#L72)).

## The public surface

`children` render inside a `<main>` whose `id` defaults to `"main-content"`;
`mainContentId` renames both the `<main>` and the skip link's `href` in the
same file, so the two can no longer drift apart
([validated by](../../tests/AppShell.test.tsx#L22),
[L33](../../tests/AppShell.test.tsx#L34)). The skip link is the
first focusable element in the rendered tree and carries the resolved
`skipToMainContent` label; `skipLink={false}` opts
out for a consumer with its own
([validated by](../../tests/AppShell.test.tsx#L48),
[L58](../../tests/AppShell.test.tsx#L60)).

`AppShellLabels` has four defaulted keys - `openSidebar`, `closeSidebar`,
`skipToMainContent`, and `sidebarDialog` (the open drawer dialog's accessible
name, added by the 2026-08-26 review) - per docs/design-notes.md § Labels
([validated by](../../tests/labelled-exports.test.tsx#L550)). `AppShell`
sits in the `labelsProp` partition bucket and passes the
sentinel render with all four labels set to sentinels; the harness opens the
drawer so the dialog-name sentinel renders
([partition](../../tests/labelled-exports.test.tsx#L76),
[harness](../../tests/labelled-exports.test.tsx#L423)).

`renderSidebar({ variant, close })` is called exactly twice per render - once
per position, `"desktop"` rail and `"mobile"` drawer - and both returned
trees are in the document; omitting it still
renders the frame ([validated by](../../tests/AppShell.test.tsx#L72),
[L83](../../tests/AppShell.test.tsx#L86)). The
mobile copy needs `close` so tapping a nav item closes the drawer - the same
slot idiom as `ConversationList`'s `renderLink`
([validated by](../../tests/AppShell.test.tsx#L129)). `close` is handed to
both variants, not just the drawer: from the desktop rail it re-reports the
already-closed state, which keeps one shared `renderSidebar` safe to wire to
either position.

`brand` renders inside the mobile header row with the centring spacer;
omitted, the header shows the hamburger and no spacer, and the component
imports no logo ([validated by](../../tests/AppShell.test.tsx#L425),
[L412](../../tests/AppShell.test.tsx#L434),
[L419](../../tests/AppShell.test.tsx#L442)).

## Open state

Uncontrolled by default: the hamburger opens the drawer
(`translate-x-0`, no `inert`), and the close button, `Escape`, the backdrop,
and the `"mobile"` slot's `close()` each return it to closed
([validated by](../../tests/AppShell.test.tsx#L94),
[L107](../../tests/AppShell.test.tsx#L111),
[L116](../../tests/AppShell.test.tsx#L120),
[L125](../../tests/AppShell.test.tsx#L129)).

Controlled: with `mobileSidebarOpen={false}`, clicking the hamburger calls
`onMobileSidebarOpenChange` once with `true` and the drawer stays closed;
`mobileSidebarOpen={true}` renders it open with no interaction
([validated by](../../tests/AppShell.test.tsx#L150),
[L162](../../tests/AppShell.test.tsx#L167)). A controlling consumer owns
closing on navigation - recorded in docs/design-notes.md § AppShell, because
closing on a route change is router-specific behaviour that cannot ship here
([validated by](../../tests/AppShell.test.tsx#L167)).

## Dialog semantics

The open drawer is a modal dialog: it carries `role="dialog"`,
`aria-modal="true"`, and an `aria-label` resolved from the `sidebarDialog`
label - `"Menu"` by default, overridable per instance
([validated by](../../tests/AppShell.test.tsx#L189),
[L201](../../tests/AppShell.test.tsx#L210)). The closed drawer carries none of
the three ([validated by](../../tests/AppShell.test.tsx#L200)). The hamburger
names the drawer through `aria-controls` but deliberately carries no
`aria-expanded` - it only opens, so an expanded state would promise a collapse
the button cannot perform ([validated by](../../tests/AppShell.test.tsx#L220)).

## The two accessibility fixes

1. **`inert` replaces `aria-hidden` on the closed drawer.** `aria-hidden`
   over a panel whose focusables stay tabbable lets a screen-reader user
   land on controls
   the tree says do not exist. The closed wrapper carries `inert` (React 19
   boolean prop; the pinned peer is `^19.0.0`), so the subtree leaves both
   the tab order and the accessibility tree; the open wrapper carries none,
   and the string `aria-hidden` appears nowhere in the source file. The rail
   and drawer stay two DOM nodes because `inert` cannot be conditioned on a
   CSS breakpoint ([validated by](../../tests/AppShell.test.tsx#L232),
   [L234](../../tests/AppShell.test.tsx#L245)).
2. **The scroll lock restores the prior overflow value.** Resetting
   `document.body.style.overflow` to `""` on close
   would clobber any other lock on the page.
   With overflow pre-set to `"scroll"`, opening sets `"hidden"`, closing
   restores `"scroll"`, and unmounting while open restores it too
   ([validated by](../../tests/AppShell.test.tsx#L333),
   [L365](../../tests/AppShell.test.tsx#L385)). A
   `matchMedia("(min-width: 768px)")` listener lifts the lock while the
   viewport sits at the desktop breakpoint - where `md:hidden` hides the
   drawer but the open state persists - and re-locks on the way back; the
   `768px` literal mirrors the component's own `md:*` classes
   ([validated by](../../tests/AppShell.test.tsx#L344)).

**Landmark ruling (recorded decision).** The drawer and rail wrappers are
non-landmark `div`s: issue 031's `AppSidebar` supplies the only `aside`/`nav`
landmarks, so the drawer wrapper deliberately carries no `"Mobile
navigation"` `aria-label` of its own - a labelled landmark wrapper around
the sidebar's own
would double up in the rotor. docs/design-notes.md § AppShell records the same ruling.

## Focus and motion

Opening moves focus to the close button - shell chrome, top-right,
`h-10 w-10`, `CloseIcon` from 020 - `Tab` from the last focusable inside
wraps to the first, and closing returns focus to the hamburger
([validated by](../../tests/AppShell.test.tsx#L281),
[L277](../../tests/AppShell.test.tsx#L289),
[L297](../../tests/AppShell.test.tsx#L310)). Escape and tab-cycling come from
021's shared `useFocusTrap`, never a bespoke listener: the source contains no
`"Escape"` string and adds no `document.addEventListener`
([validated by](../../tests/AppShell.test.tsx#L321)).

`reducedMotion={true}` omits `transition-transform` and `transition-opacity`
from the drawer and backdrop; omitted, 021's `useReducedMotion` tracks
`prefers-reduced-motion` and a non-matching `matchMedia` keeps both classes
([validated by](../../tests/AppShell.test.tsx#L398),
[L384](../../tests/AppShell.test.tsx#L405)).

## The characterization suite

The suite stubs nothing: the rail, drawer and header are asserted as real
DOM, and the deliberate decisions below are each pinned by a test.

| #   | Decision                                                                                                                                                                             | Reason                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| a   | Children render in `<main id="main-content">`, and `mainContentId` makes the id a prop ([L22](../../tests/AppShell.test.tsx#L22))                                                    | The landing region stays addressable for skip links without hardcoding the id             |
| b   | The `renderSidebar` slot is called twice (rail and drawer) while the shell owns the header and drawer chrome ([L70](../../tests/AppShell.test.tsx#L72))                              | The slot is the dependency boundary; the shell ships without auth, i18n or router imports |
| c   | The drawer's open/close cycle is asserted on observable DOM state (`translate-x-0`/`inert`) through the menu-click / close-click sequence ([L91](../../tests/AppShell.test.tsx#L94)) | Real DOM state, not a stub attribute, is what a consumer's user experiences               |
| d   | The closed drawer carries `inert` ([L222](../../tests/AppShell.test.tsx#L232))                                                                                                       | `aria-hidden` over still-tabbable content is the defect `inert` exists to prevent         |
| e   | The scroll lock restores the prior `document.body.style.overflow` value ([L320](../../tests/AppShell.test.tsx#L333))                                                                 | Clobbering the value to `""` breaks a consumer that manages body overflow itself          |

## Mechanical invariants

- `MenuIcon`/`CloseIcon` come from 020's set; imports are relative with `.js`
  extensions, and no `@clerk`, `swr`, `next-intl`, `next/`,
  `@/` or `lucide-react` import survives
  ([validated by](../../tests/AppShell.test.tsx#L454)).
- GDPR: the shell wraps a surface carrying customer questions and booking
  identifiers (`003-support-conversation-data-flow-record`). The source
  references no `console.`, `fetch`, `sendBeacon`, `localStorage`,
  `sessionStorage`, `indexedDB` or `analytics`, and the suite-wide
  console trap in `tests/setup.ts` fails any test that triggered a console
  call. Desktop collapse state is out of scope precisely because it is the
  only thing here that would persist anything
  ([validated by](../../tests/AppShell.test.tsx#L448)).
- `dist/components/AppShell.js` opens with `"use client";` as its first
  statement per 018's positional check, and `npm pack`
  ships exactly the built pair
  ([validated by](../../tests/app-shell-dist.test.ts#L7),
  [L36](../../tests/app-shell-dist.test.ts#L14)).

## Recorded deviations

- **Header stacks at `z-40` under the drawer/backdrop's `z-50`** - a third
  deliberate fix: giving the mobile header and the drawer the same
  `z-50` and relying on DOM order would let the header paint over the open
  drawer's top strip. Pinned by a class assertion in the tests
  ([validated by](../../tests/AppShell.test.tsx#L469)).
- **`brand={null}` renders no spacer**, same as omitting the prop - `null` is
  the React idiom for intentionally-nothing, and an empty centring spacer with
  no mark would be a layout surprise. A characterization test pairs the two
  renders, but its `header > div` selector matches nothing - the mobile header
  is a `<div>`, not a `<header>` - so it counts zero spacers under either prop
  and the equivalence is asserted only vacuously
  ([characterization test](../../tests/AppShell.test.tsx#L480)).

- **Test locations.** The issue names `tests/components/AppShell.test.tsx`;
  this repository keeps every test flat under `tests/`, and the partition
  file is `tests/labelled-exports.test.tsx`. The tests land at
  `tests/AppShell.test.tsx` and `tests/app-shell-dist.test.ts`.
- **The `offsetParent` shim is local, not in `tests/setup.ts`.** The issue
  claims `tests/setup.ts` defines the shim; it does not and never has. The
  focus-management block defines it in a local `beforeEach` - prototype
  `offsetParent` getter plus a synchronous `requestAnimationFrame` stub -
  exactly as `tests/useFocusTrap.test.tsx` does, restored in `afterEach`.
  Removing the shim still makes the three focus assertions fail, which is
  the property the issue was after
  ([validated by](../../tests/AppShell.test.tsx#L281)).
- **Coverage floor.** The issue says "the 100 / 100 / 100 thresholds the
  repo-skeleton issue committed"; the committed floor is
  lines/functions/statements 100 with branches 90 (`vitest.config.ts`), and
  it holds.
