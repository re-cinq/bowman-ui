# bowman-ui app shell

| Field  | Value                                |
| ------ | ------------------------------------ |
| Issue  | issue 80 (`030-bowman-ui-app-shell`) |
| Status | In Progress                          |

`AppShell` is the application frame - desktop rail, mobile slide-in
drawer, mobile header, `<main>` - shipped as `src/components/AppShell.tsx`
(`AppShell`, `AppShellProps`, `SidebarSlotContext`, `AppShellLabels`,
`defaultAppShellLabels`). The sidebar's own contents are issue 031's; this
component imports none of them and renders whatever `renderSidebar` returns
([validated by renderSidebar is called exactly twice per render, once with variant "desktop" and once with "mobile", and both trees are in the document](../../tests/AppShell.test.tsx#L78)).

## The public surface

`children` render inside a `<main>` whose `id` defaults to `"main-content"`;
`mainContentId` renames both the `<main>` and the skip link's `href` in the
same file, so the two can no longer drift apart
([validated by `renders children inside <main id="main-content"> by default`](../../tests/AppShell.test.tsx#L28),
[validated by `mainContentId="olt-main" renders <main id="olt-main"> and a skip link with href "#olt-main"`](../../tests/AppShell.test.tsx#L40)). The skip link is the
first focusable element in the rendered tree and carries the resolved
`skipToMainContent` label; `skipLink={false}` opts
out for a consumer with its own
([validated by the skip link is the first focusable element in the rendered tree](../../tests/AppShell.test.tsx#L54),
[validated by skipLink={false} renders no anchor pointing at mainContentId](../../tests/AppShell.test.tsx#L66)). In Chromium, and in WebKit with
`Alt+Tab` standing in for its link-skipping `Tab` (issue 200), `Tab` on a fresh load
reaches the skip link first and `Enter` on it moves the sequential focus start
to `main`, so the next `Tab` lands inside `main` with no `tabIndex` on it
(issue 151) ([validated by Tab reaches the skip link first, and Enter on it sends the next Tab inside main](../../examples/chat-demo/tests/chat-demo.spec.ts#L564)).

`AppShellLabels` has four defaulted keys - `openSidebar`, `closeSidebar`,
`skipToMainContent`, and `sidebarDialog` (the open drawer dialog's accessible
name, added by the 2026-08-26 review) - per docs/design-notes.md § Labels.
`AppShell` sits in the `labelsProp` partition bucket and passes the
sentinel render with all four labels set to sentinels; the harness opens the
drawer so the dialog-name sentinel renders
([partition](../../tests/labelled-exports.test.tsx#L86),
[harness](../../tests/labelled-exports.test.tsx#L458),
[validated by AppShell's sentinel labels cover every defaultAppShellLabels key](../../tests/labelled-exports.test.tsx#L603)).

`renderSidebar({ variant, close })` is called exactly twice per render - once
per position, `"desktop"` rail and `"mobile"` drawer - and both returned
trees are in the document; omitting it still
renders the frame ([validated by renderSidebar is called exactly twice per render, once with variant "desktop" and once with "mobile", and both trees are in the document](../../tests/AppShell.test.tsx#L78),
[validated by renderSidebar omitted still renders the frame with its drawer chrome](../../tests/AppShell.test.tsx#L92)). The
mobile copy needs `close` so tapping a nav item closes the drawer - the same
slot idiom as `ConversationList`'s `renderLink`. `close` is handed to
both variants, not just the drawer: from the desktop rail it re-reports the
already-closed state - `onMobileSidebarOpenChange` receives `false` once and
the drawer stays `inert` - which keeps one shared `renderSidebar` safe to wire
to either position ([validated by](../../tests/AppShell.test.tsx#L135),
[desktop](../../tests/AppShell.test.tsx#L154)).

`brand` renders inside the mobile header row with the centring spacer;
omitted, the header shows the hamburger and no spacer, and the component
imports no logo ([validated by brand renders inside the mobile header row with the centring spacer](../../tests/AppShell.test.tsx#L444),
[validated by brand omitted renders the hamburger and no centring spacer](../../tests/AppShell.test.tsx#L453),
[validated by the component imports no logo](../../tests/AppShell.test.tsx#L461)).

The mobile header row owns its text colour: it reads `--bowman-text-body`, so a
plain-string `brand` reads on the dark surface instead of inheriting the page
colour ([validated by the mobile header row carries the body text token, so a plain-string brand reads on the dark surface](../../tests/AppShell.test.tsx#L465)).

The drawer close-button row owns its text colour the same way: it reads
`--bowman-text-body`, so plain-string content the shell lays out in the drawer
reads on the dark surface ([validated by the drawer close-button row carries the body text token, so plain-string drawer content reads on the dark surface](../../tests/AppShell.test.tsx#L531)).

The two wrappers around `renderSidebar` output - the desktop rail and the mobile
drawer container - read `--bowman-text-body` as well, so content a consumer
returns directly from `renderSidebar` reads on the dark surface instead of
inheriting the page colour (docs/design-notes.md § Theming decision 6, issue 109)
([validated by the desktop rail and the mobile drawer wrappers carry the body text token, so plain-string renderSidebar content reads on the dark surface](../../tests/AppShell.test.tsx#L548)).

The main region reads `--bowman-text-body` on the element that wraps
`children`, so a plain string reads on the dark surface instead of inheriting
the page colour; only the text is painted - the `bg-white` /
`dark:bg-slate-950` background stays palette-mapped
([validated by the main region carries the body text token, so plain-string content reads on the dark surface](../../tests/AppShell.test.tsx#L539)).

The focused skip link reads `--bowman-text-strong` (docs/design-notes.md § Theming
decision 6), so a consumer recolours it with the theme rather than the fixed slate
it carried before ([validated by the focused skip link reads the strong text token, so a consumer recolours it with the theme](../../tests/AppShell.test.tsx#L436)).

## Open state

Uncontrolled by default: the hamburger opens the drawer
(`translate-x-0`, no `inert`), and the close button, `Escape`, the backdrop,
and the `"mobile"` slot's `close()` each return it to closed
([validated by clicking the openSidebar button puts the drawer in the open state and the closeSidebar button returns it to closed](../../tests/AppShell.test.tsx#L100),
[validated by pressing Escape closes the open drawer](../../tests/AppShell.test.tsx#L117),
[validated by clicking the backdrop closes the open drawer](../../tests/AppShell.test.tsx#L126),
[L135](../../tests/AppShell.test.tsx#L135)).

Controlled: with `mobileSidebarOpen={false}`, clicking the hamburger calls
`onMobileSidebarOpenChange` once with `true` and the drawer stays closed;
`mobileSidebarOpen={true}` renders it open with no interaction
([validated by mobileSidebarOpen={false}: clicking the hamburger calls onMobileSidebarOpenChange once with true and the drawer stays closed](../../tests/AppShell.test.tsx#L176),
[validated by mobileSidebarOpen={true} renders the drawer open with no interaction, and closing only reports false](../../tests/AppShell.test.tsx#L193)). A controlling consumer owns
closing on navigation - recorded in docs/design-notes.md § AppShell, because
closing on a route change is router-specific behaviour that cannot ship here
([validated by mobileSidebarOpen={true} renders the drawer open with no interaction, and closing only reports false](../../tests/AppShell.test.tsx#L193)).

## Dialog semantics

The open drawer is a modal dialog: it carries `role="dialog"`,
`aria-modal="true"`, and an `aria-label` resolved from the `sidebarDialog`
label - `"Menu"` by default, overridable per instance
([validated by the open drawer is a modal dialog named "Menu" by default: role="dialog", aria-modal="true", aria-label](../../tests/AppShell.test.tsx#L215),
[validated by labels={{sidebarDialog: "Menu 4711"}} names the open dialog](../../tests/AppShell.test.tsx#L236)). The closed drawer carries none of
the three ([validated by the closed drawer carries no dialog semantics](../../tests/AppShell.test.tsx#L226)). The hamburger
names the drawer through `aria-controls` but deliberately carries no
`aria-expanded` - it only opens, so an expanded state would promise a collapse
the button cannot perform ([validated by the hamburger names the drawer through aria-controls and carries no aria-expanded](../../tests/AppShell.test.tsx#L246)).

## The two accessibility fixes

1. **`inert` replaces `aria-hidden` on the closed drawer.** `aria-hidden`
   over a panel whose focusables stay tabbable lets a screen-reader user
   land on controls
   the tree says do not exist. The closed wrapper carries `inert` (React 19
   boolean prop; the pinned peer is `^19.0.0`), so the subtree leaves both
   the tab order and the accessibility tree; the open wrapper carries none,
   and the string `aria-hidden` appears nowhere in the source file. The rail
   and drawer stay two DOM nodes because `inert` cannot be conditioned on a
   CSS breakpoint ([validated by the closed drawer wrapper carries inert so its focusables are out of the tab order; the open wrapper carries none](../../tests/AppShell.test.tsx#L258),
   [validated by the string aria-hidden appears nowhere in src/components/AppShell.tsx](../../tests/AppShell.test.tsx#L271)).
2. **The scroll lock restores the prior overflow value.** Resetting
   `document.body.style.overflow` to `""` on close
   would clobber any other lock on the page.
   With overflow pre-set to `"scroll"`, opening sets `"hidden"`, closing
   restores `"scroll"`, and unmounting while open restores it too. A
   `matchMedia("(min-width: 768px)")` listener lifts the lock while the
   viewport sits at the desktop breakpoint - where `md:hidden` hides the
   drawer but the open state persists - and re-locks on the way back; the
   `768px` literal mirrors the component's own `md:*` classes
   ([validated by crossing to the desktop breakpoint while open releases the lock, and crossing back re-locks](../../tests/AppShell.test.tsx#L343),
   [validated by with body overflow pre-set to "scroll", opening sets "hidden" and closing restores "scroll"](../../tests/AppShell.test.tsx#L332),
   [validated by unmounting while open restores the prior "scroll" value](../../tests/AppShell.test.tsx#L384)).

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
([validated by opening the drawer moves focus to the close button](../../tests/AppShell.test.tsx#L280),
[validated by Tab from the last focusable element inside the drawer wraps to the first](../../tests/AppShell.test.tsx#L288),
[validated by closing the drawer returns focus to the hamburger](../../tests/AppShell.test.tsx#L309)). Escape and tab-cycling come from
021's shared `useFocusTrap`, never a bespoke listener: the source contains no
`"Escape"` string and adds no `document.addEventListener`
([validated by src/components/AppShell.tsx contains no "Escape" string and adds no document.addEventListener of its own](../../tests/AppShell.test.tsx#L320)). With the drawer left
open across a rotate to desktop - `md:hidden` hides it while the trap's
listener stays mounted - each `Tab` moves focus forward through `main` and
never into the hidden drawer (issue 151)
([validated by after the viewport grows to desktop, three Tabs advance through main, never the drawer](../../examples/chat-demo/tests/chat-demo.spec.ts#L602)).

`reducedMotion={true}` omits `transition-transform` and `transition-opacity`
from the drawer and backdrop; omitted, 021's `useReducedMotion` tracks
`prefers-reduced-motion` and a non-matching `matchMedia` keeps both classes
([validated by reducedMotion={true} renders the drawer and the backdrop with no transition classes](../../tests/AppShell.test.tsx#L397),
[validated by reducedMotion omitted with matchMedia matching nothing renders both transition classes](../../tests/AppShell.test.tsx#L404)). Rendered in Chromium and WebKit under
`prefers-reduced-motion: reduce`, the drawer's computed `transition-duration`
is `0s`, against `0.3s` without the emulation (issue 151)
([validated by](../../examples/chat-demo/tests/chat-demo.spec.ts#L653)).

## The characterization suite

The suite stubs nothing: the rail, drawer and header are asserted as real
DOM, and the deliberate decisions below are each pinned by a test.

| #   | Decision                                                                                                                                                                                                                                                                                                          | Reason                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| a   | Children render in `<main id="main-content">`, and `mainContentId` makes the id a prop ([validated by `renders children inside <main id="main-content"> by default`](../../tests/AppShell.test.tsx#L28))                                                                                                          | The landing region stays addressable for skip links without hardcoding the id             |
| b   | The `renderSidebar` slot is called twice (rail and drawer) while the shell owns the header and drawer chrome ([validated by renderSidebar is called exactly twice per render, once with variant "desktop" and once with "mobile", and both trees are in the document](../../tests/AppShell.test.tsx#L78))         | The slot is the dependency boundary; the shell ships without auth, i18n or router imports |
| c   | The drawer's open/close cycle is asserted on observable DOM state (`translate-x-0`/`inert`) through the menu-click / close-click sequence ([validated by clicking the openSidebar button puts the drawer in the open state and the closeSidebar button returns it to closed](../../tests/AppShell.test.tsx#L100)) | Real DOM state, not a stub attribute, is what a consumer's user experiences               |
| d   | The closed drawer carries `inert` ([validated by the closed drawer wrapper carries inert so its focusables are out of the tab order; the open wrapper carries none](../../tests/AppShell.test.tsx#L258))                                                                                                          | `aria-hidden` over still-tabbable content is the defect `inert` exists to prevent         |
| e   | The scroll lock restores the prior `document.body.style.overflow` value ([validated by with body overflow pre-set to "scroll", opening sets "hidden" and closing restores "scroll"](../../tests/AppShell.test.tsx#L332))                                                                                          | Clobbering the value to `""` breaks a consumer that manages body overflow itself          |

## Mechanical invariants

- `MenuIcon`/`CloseIcon` come from 020's set; imports are relative with `.js`
  extensions, and no `@clerk`, `swr`, `next-intl`, `next/`,
  `@/` or `lucide-react` import survives
  ([validated by no framework, auth, i18n or aliased import survives, and every relative import ends in .js](../../tests/AppShell.test.tsx#L481)).
- GDPR: the shell wraps a surface carrying customer questions and booking
  identifiers (`003-support-conversation-data-flow-record`). The source
  references no `console.`, `fetch`, `sendBeacon`, `localStorage`,
  `sessionStorage`, `indexedDB` or `analytics`, and the suite-wide
  console trap in `tests/setup.ts` fails any test that triggered a console
  call. Desktop collapse state is out of scope precisely because it is the
  only thing here that would persist anything
  ([validated by the source references no console, fetch, sendBeacon or Web Storage API](../../tests/AppShell.test.tsx#L475)).
- `dist/components/AppShell.js` opens with `"use client";` as its first
  statement per 018's positional check, and `npm pack`
  ships exactly the built pair
  ([validated by dist/components/AppShell.js opens with "use client"; as its first statement](../../tests/app-shell-dist.test.ts#L6),
  [validated by npm pack --dry-run ships dist/components/AppShell.js with its d.ts](../../tests/app-shell-dist.test.ts#L10)).

## Recorded deviations

- **Header stacks at `z-40` under the drawer/backdrop's `z-50`** - a third
  deliberate fix: giving the mobile header and the drawer the same
  `z-50` and relying on DOM order would let the header paint over the open
  drawer's top strip. Pinned by a class assertion in the tests
  ([validated by the mobile header stacks under the drawer: z-40 header, z-50 drawer](../../tests/AppShell.test.tsx#L496)).
- **`brand={null}` renders no spacer**, same as omitting the prop - `null` is
  the React idiom for intentionally-nothing, and an empty centring spacer with
  no mark would be a layout surprise. A characterization test pairs the two
  renders, finds each mobile header row through its hamburger's parent, and
  asserts zero spacers in the `null` render and the same count in the omitted
  one ([validated by brand={null} renders no brand spacer, same as omitting the prop](../../tests/AppShell.test.tsx#L507)).

- **Test locations.** The issue names `tests/components/AppShell.test.tsx`;
  this repository keeps every test flat under `tests/`, and the partition
  file is `tests/labelled-exports.test.tsx`. The tests land at
  `tests/AppShell.test.tsx` and `tests/app-shell-dist.test.ts`.
- **The `offsetParent` shim is a shared test helper, not in `tests/setup.ts`.**
  The issue claims `tests/setup.ts` defines the shim; it does not and never
  has. The focus-management block calls `stubFocusEnvironment()` from
  `tests/helpers/focus-environment.ts` - a `beforeEach` that installs a
  prototype `offsetParent` getter plus a synchronous `requestAnimationFrame`
  stub, restored in `afterEach` - the same helper `tests/useFocusTrap.test.tsx`
  calls. Removing the shim still makes two of the four focus tests fail - the
  open-moves-focus and Tab-wrap ones, the two that read the focusable list -
  which is the property the issue was after
  ([validated by opening the drawer moves focus to the close button](../../tests/AppShell.test.tsx#L280),
  [validated by Tab from the last focusable element inside the drawer wraps to the first](../../tests/AppShell.test.tsx#L288)).
- **Coverage floor.** The issue says "the 100 / 100 / 100 thresholds the
  repo-skeleton issue committed"; the floor was lines/functions/statements
  100 with branches 90 when this landed (100 on all four since issue 152,
  `vitest.config.ts`), and it holds.
