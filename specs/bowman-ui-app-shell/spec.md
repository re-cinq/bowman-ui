# bowman-ui app shell

Issue: issue 80 (`030-bowman-ui-app-shell`)

`AppShell` is the source app's 48-line frame - desktop rail, mobile slide-in
drawer, mobile header, `<main>` - extracted as `src/components/AppShell.tsx`
(`AppShell`, `AppShellProps`, `SidebarSlotContext`, `AppShellLabels`,
`defaultAppShellLabels`). The sidebar's own contents are issue 031's; this
component imports none of them and renders whatever `renderSidebar` returns
([validated by](../../tests/AppShell.test.tsx#L70)).
No file in `discovery` changes.

## The public surface

`children` render inside a `<main>` whose `id` defaults to `"main-content"`
([validated by](../../tests/AppShell.test.tsx#L22)); `mainContentId` renames
both the `<main>` and the skip link's `href` in the same file, so the two can
no longer drift apart
([validated by](../../tests/AppShell.test.tsx#L33)). The skip link is the
first focusable element in the rendered tree and carries the resolved
`skipToMainContent` label
([validated by](../../tests/AppShell.test.tsx#L47)); `skipLink={false}` opts
out for a consumer with its own
([validated by](../../tests/AppShell.test.tsx#L58)).

`AppShellLabels` has four defaulted keys - `openSidebar`, `closeSidebar`,
`skipToMainContent`, and `sidebarDialog` (the open drawer dialog's accessible
name, added by the 2026-08-26 review) - per CONTRACT.md § Labels
([validated by](../../tests/labelled-exports.test.tsx#L437)). `AppShell`
sits in the `labelsProp` partition bucket
([partition](../../tests/labelled-exports.test.tsx#L63)) and passes the
sentinel render with all four labels set to sentinels; the harness opens the
drawer so the dialog-name sentinel renders
([harness](../../tests/labelled-exports.test.tsx#L324)).

`renderSidebar({ variant, close })` is called exactly twice per render - once
per position, `"desktop"` rail and `"mobile"` drawer - and both returned
trees are in the document
([validated by](../../tests/AppShell.test.tsx#L70)); omitting it still
renders the frame ([validated by](../../tests/AppShell.test.tsx#L83)). The
mobile copy needs `close` so tapping a nav item closes the drawer - the same
slot idiom as `ConversationList`'s `renderLink`
([validated by](../../tests/AppShell.test.tsx#L125)).

`brand` renders inside the mobile header row with the centring spacer;
omitted, the header shows the hamburger and no spacer, and the component
imports no logo ([validated by](../../tests/AppShell.test.tsx#L322),
[L326](../../tests/AppShell.test.tsx#L326),
[L409](../../tests/AppShell.test.tsx#L409)).

## Open state

Uncontrolled by default: the hamburger opens the drawer
(`translate-x-0`, no `inert`), and the close button, `Escape`, the backdrop,
and the `"mobile"` slot's `close()` each return it to closed
([validated by](../../tests/AppShell.test.tsx#L91),
[L107](../../tests/AppShell.test.tsx#L107),
[L116](../../tests/AppShell.test.tsx#L116),
[L125](../../tests/AppShell.test.tsx#L125)).

Controlled: with `mobileSidebarOpen={false}`, clicking the hamburger calls
`onMobileSidebarOpenChange` once with `true` and the drawer stays closed;
`mobileSidebarOpen={true}` renders it open with no interaction
([validated by](../../tests/AppShell.test.tsx#L146),
[L162](../../tests/AppShell.test.tsx#L162)). A controlling consumer owns
closing on navigation - recorded in CONTRACT.md § AppShell, because the
source's `usePathname` effect is app-router-specific and cannot ship here
([validated by](../../tests/AppShell.test.tsx#L162)).

## The two accessibility fixes

1. **`inert` replaces `aria-hidden` on the closed drawer.** The source kept
   the closed panel's focusables tabbable under `aria-hidden={!isOpen}`
   (`AppMobileSidebar.tsx:79`) - a screen-reader user could land on controls
   the tree said did not exist. The closed wrapper carries `inert` (React 19
   boolean prop; the pinned peer is `^19.0.0`), so the subtree leaves both
   the tab order and the accessibility tree; the open wrapper carries none,
   and the string `aria-hidden` appears nowhere in the source file
   ([validated by](../../tests/AppShell.test.tsx#L222),
   [L234](../../tests/AppShell.test.tsx#L234)). The rail and drawer stay two
   DOM nodes because `inert` cannot be conditioned on a CSS breakpoint
   ([validated by](../../tests/AppShell.test.tsx#L222)).
2. **The scroll lock restores the prior overflow value.** The source reset
   `document.body.style.overflow` to `""` on close
   (`AppMobileSidebar.tsx:51-60`), clobbering any other lock on the page.
   With overflow pre-set to `"scroll"`, opening sets `"hidden"`, closing
   restores `"scroll"`, and unmounting while open restores it too
   ([validated by](../../tests/AppShell.test.tsx#L309),
   [L321](../../tests/AppShell.test.tsx#L321)).

**Landmark ruling (recorded decision).** The drawer and rail wrappers are
non-landmark `div`s: issue 031's `AppSidebar` supplies the only `aside`/`nav`
landmarks, so Discovery's third `"Mobile navigation"` `aria-label` string is
deliberately dropped - a labelled landmark wrapper around the sidebar's own
would double up in the rotor. CONTRACT.md § AppShell records the same ruling.

## Focus and motion

Opening moves focus to the close button - shell chrome, top-right,
`h-10 w-10`, `CloseIcon` from 020 - `Tab` from the last focusable inside
wraps to the first, and closing returns focus to the hamburger
([validated by](../../tests/AppShell.test.tsx#L269),
[L277](../../tests/AppShell.test.tsx#L277),
[L287](../../tests/AppShell.test.tsx#L287)). Escape and tab-cycling come from
021's shared `useFocusTrap`, never a bespoke listener: the source contains no
`"Escape"` string and adds no `document.addEventListener`
([validated by](../../tests/AppShell.test.tsx#L270)).

`reducedMotion={true}` omits `transition-transform` and `transition-opacity`
from the drawer and backdrop; omitted, 021's `useReducedMotion` tracks
`prefers-reduced-motion` and a non-matching `matchMedia` keeps both classes
([validated by](../../tests/AppShell.test.tsx#L367),
[L305](../../tests/AppShell.test.tsx#L380)).

## The 015 characterization suite, ported

015's three `AppShell` tests stubbed the three children (`AppSidebar`,
`AppMobileSidebar`, `AppMobileHeader`) as the C-1/C-2/C-4 boundary. Every
assertion with a counterpart on the extracted surface passes after the flips
below.

| #   | Flip                                                                                                                                                                                                                                          | Reason                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| a   | Children rendered in `<main id="main-content">` → unchanged, plus `mainContentId` makes the id a prop ([L22](../../tests/AppShell.test.tsx#L22))                                                                                              | Direct port of 015's first test                                                               |
| b   | The three-children-as-props structure (stubbed `AppSidebar`/`AppMobileSidebar`/`AppMobileHeader`) → the `renderSidebar` slot called twice plus shell-owned header and drawer chrome ([L70](../../tests/AppShell.test.tsx#L70))                | The children were the dependency boundary; slots ship without Clerk, next-intl or `next/link` |
| c   | 015's open/close cycle (`data-is-open` false → true after `onMenuClick` → false after `onClose`) → the drawer wrapper's observable state (`translate-x-0`/`inert`) through the same click sequence ([L91](../../tests/AppShell.test.tsx#L91)) | The observable cycle survives; the stub attribute becomes real DOM state                      |
| d   | `inert` on the closed drawer - NET-NEW fix with no 015 baseline ([L222](../../tests/AppShell.test.tsx#L222))                                                                                                                                  | 015 stubbed `AppMobileSidebar`, so the `aria-hidden` defect was never pinned                  |
| e   | Scroll-lock restore - NET-NEW fix with no 015 baseline ([L309](../../tests/AppShell.test.tsx#L309))                                                                                                                                           | Same: the lock lived in the stubbed child                                                     |

## Carried across mechanically

- `MenuIcon`/`CloseIcon` come from 020's set; imports are relative with `.js`
  extensions, and no `@clerk`, `swr`, `next-intl`, `next/`, `@discovery`,
  `@/` or `lucide-react` import survives
  ([validated by](../../tests/AppShell.test.tsx#L404)).
- GDPR: the shell wraps a surface carrying customer questions and booking
  identifiers (`003-support-conversation-data-flow-record`). The source
  references no `console.`, `fetch`, `sendBeacon`, `localStorage`,
  `sessionStorage`, `indexedDB` or `analytics`
  ([validated by](../../tests/AppShell.test.tsx#L407)), and the suite-wide
  console trap in `tests/setup.ts` fails any test that triggered a console
  call. Desktop collapse state is out of scope precisely because it is the
  only thing here that would persist anything
  ([validated by](../../tests/AppShell.test.tsx#L425)).
- `dist/components/AppShell.js` opens with `"use client";` as its first
  statement per 018's positional check
  ([validated by](../../tests/app-shell-dist.test.ts#L30)), and `npm pack`
  ships exactly the built pair
  ([validated by](../../tests/app-shell-dist.test.ts#L36)).

## Recorded deviations

- **Header stacks at `z-40` under the drawer/backdrop's `z-50`** - a third
  deliberate fix: the source gave the mobile header and the drawer the same
  `z-50` and relied on DOM order, so the header could paint over the open
  drawer's top strip. Pinned by a class assertion in the tests
  ([validated by](../../tests/AppShell.test.tsx#L444)).
- **`brand={null}` renders no spacer**, same as omitting the prop - `null` is
  the React idiom for intentionally-nothing, and an empty centring spacer with
  no mark would be a layout surprise. Pinned by test
  ([validated by](../../tests/AppShell.test.tsx#L454)).
  from the issue text

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
  ([validated by](../../tests/AppShell.test.tsx#L269)).
- **Coverage floor.** The issue says "the 100 / 100 / 100 thresholds the
  repo-skeleton issue committed"; the committed floor is
  lines/functions/statements 100 with branches 90 (`vitest.config.ts`), and
  it holds.
