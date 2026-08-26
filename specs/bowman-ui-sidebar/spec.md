# bowman-ui sidebar

Issue: re-cinq/Otto#81 (`031-bowman-ui-sidebar`)

`AppSidebar` is the one presentational sidebar the source app wrote twice -
brand row, navigation map, chat history, language row, user-controls row,
duplicated across a desktop and a mobile component that hard-import an auth
SDK, an i18n library and a router - extracted as
`src/components/AppSidebar.tsx` (`AppSidebar`, `AppSidebarProps`,
`SidebarNavItem`, `SidebarNavLinkProps`, `AppSidebarLabels`,
`defaultAppSidebarLabels`). Brand, middle region and footer are slots,
navigation is data, and the frame that places it - desktop rail vs. mobile
drawer, drawer mechanics - is `030-bowman-ui-app-shell`; this component owns
only what's inside. No file in the source repo changes.

## The public surface

The component renders one `<aside>` whose accessible name is the resolved
`sidebar` label, containing at most one `<nav>` whose accessible name is the
resolved `mainNavigation` label
([validated by](../../tests/AppSidebar.test.tsx#L15),
[L24](../../tests/AppSidebar.test.tsx#L24)). `AppSidebarLabels` has exactly
those two defaulted keys ("Sidebar", "Main navigation"); the source's two
hardcoded aria-labels plus the mobile copy's third, duplicate landmark name
("Mobile navigation") collapse into them - 030's shell wrappers are
non-landmark `div`s (CONTRACT.md § AppShell), and although the shell mounts
the sidebar twice, `hidden`/`md:hidden` on the positions and `inert` on the
closed drawer keep one exposed at a time; a bare render contains exactly one
`<nav>` ([validated by](../../tests/AppSidebar.test.tsx#L15)). `AppSidebar`
sits in the `labelsProp` partition bucket
([partition](../../tests/labelled-exports.test.tsx#L46)) and passes the
sentinel render with both labels set to sentinels
([harness](../../tests/labelled-exports.test.tsx#L264),
[coverage](../../tests/labelled-exports.test.tsx#L340)).

## The decisions

1. **The exported name is `AppSidebar`, not `Sidebar`.** A different,
   superseded component already owns `Sidebar` in the source app and is
   explicitly marked "do not port"; the name keeps the two unconfusable
   ([validated by](../../tests/public-api.test.ts#L40)).
2. **Active state is a per-item `isActive` boolean, not a path comparison.**
   The org has more than one router, so the component assumes neither. Three
   `navItems` render three items in order, each showing its `label`; the one
   with `isActive: true` alone carries `aria-current="page"` - announced, not
   just background-coloured as in the source - and with no item marked, none
   does ([validated by](../../tests/AppSidebar.test.tsx#L56),
   [L67](../../tests/AppSidebar.test.tsx#L67)). Rows are keyed by `item.key`:
   reordering moves the same DOM nodes
   ([validated by](../../tests/AppSidebar.test.tsx#L82)). `navItems` omitted
   or `[]` renders no `<nav>` element at all
   ([validated by](../../tests/AppSidebar.test.tsx#L94),
   [L100](../../tests/AppSidebar.test.tsx#L100)).
3. **`renderNavLink(item, props)` is the routing seam; the default is
   `<button type="button" {...props} />`.** A nav item carries its resolved
   `label`, not a translation key, and no `href` - `SidebarNavItem` has no
   `href` field, pinned by a `@ts-expect-error` fixture compiled against the
   built package ([validated by](../../tests/types/app-sidebar-type-assertions.tsx#L26),
   [compiled by](../../tests/app-sidebar-dist.test.ts#L47)). The consumer's
   element must spread every prop it is handed - CONTRACT.md § renderNavLink
   states it, pinned together with the anchor round-trip and the
   dropped-`onClick` failure mode
   ([validated by](../../tests/AppSidebar.test.tsx#L124),
   [L145](../../tests/AppSidebar.test.tsx#L145),
   [L162](../../tests/AppSidebar.test.tsx#L162)). Clicking an item calls
   `onNavigate` once with that item's `key`; `onNavigate` omitted, clicking
   throws nothing ([validated by](../../tests/AppSidebar.test.tsx#L106),
   [L116](../../tests/AppSidebar.test.tsx#L116)). `icon` is an optional
   `ComponentType<{ className?: string }>` rendered at `h-5 w-5`; an item
   without one renders its label and no `<svg>` - the component imports no
   icon itself ([validated by](../../tests/AppSidebar.test.tsx#L171),
   [L180](../../tests/AppSidebar.test.tsx#L180)).
4. **The middle region is `children`, wrapped in
   `flex min-h-0 flex-1 flex-col overflow-y-auto`.** The sidebar supplies
   growth and scrolling regardless of what's passed in - an unsized child is
   the one that grows, pinned by the wrapper's class list
   ([validated by](../../tests/AppSidebar.test.tsx#L189)).
5. **The footer is one `footer?: ReactNode` slot inside a single `border-t`
   region, not four named slots.** User menu, org switcher, language picker
   and sign-in are all consumer-specific; a support customer has none of
   them. `footer` present renders exactly one `border-t` region; omitted,
   no such region ([validated by](../../tests/AppSidebar.test.tsx#L202),
   [L210](../../tests/AppSidebar.test.tsx#L210)).
6. **The brand is a slot inside the bordered top row; omitted, no row
   renders at all** - no `h-14` row and no `border-b` above the navigation
   ([validated by](../../tests/AppSidebar.test.tsx#L216),
   [L225](../../tests/AppSidebar.test.tsx#L225)). One consequence carried
   over from 030 as shipped: in the mobile drawer the shell renders its own
   bordered 56px close-button row as a sibling above this component, so a
   `brand` row stacks a second bordered 56px row directly beneath it - two
   horizontal rules of chrome. Documented, not solved: the sidebar doesn't
   know which position it's in, and the drawer's row belongs to 030.
7. **One class list serves both 030 positions.** Below `md` the only
   position is the drawer - a column flex beside a 56px close row - where
   `flex-1 min-h-0` fills the remaining height and the drawer supplies width
   and border. At `md`+ the only position is the row-flex rail, where the
   aside pins its own `md:h-full md:w-64 md:flex-none md:border-r lg:w-72`
   ([validated by](../../tests/AppSidebar.test.tsx#L36)).

## GDPR

The sidebar hosts a conversation list whose titles carry booking identifiers
and customer names (`003-support-conversation-data-flow-record`). The
component calls no `console.*`, no `fetch`, no `navigator.sendBeacon` and no
`localStorage` or `sessionStorage`, and stores nothing outside React state -
asserted by a source grep
([validated by](../../tests/AppSidebar.test.tsx#L238)) and the suite-wide
console spy at zero calls ([spy](../../tests/setup.ts#L29)).

## Build contract

The file imports nothing from `@clerk`, `swr`, `next-intl`, `next/`,
`@discovery`, `@/` or `lucide-react`, and every relative import ends in `.js`
([validated by](../../tests/AppSidebar.test.tsx#L244)).
`dist/components/AppSidebar.js` carries `"use client"` as its first statement
and ships with its `.d.ts`
([validated by](../../tests/app-sidebar-dist.test.ts#L30),
[L36](../../tests/app-sidebar-dist.test.ts#L36)). A key added to
`AppSidebarLabels` without a default cannot satisfy
`Readonly<Required<AppSidebarLabels>>`
([validated by](../../tests/types/app-sidebar-type-assertions.tsx#L19)).

## Out of scope

The frame that places this component - desktop rail, mobile drawer, backdrop,
mobile header, close button, focus trap, scroll lock (all 030); the
conversation list itself (029 ships it, this sidebar takes a node); the
search box, org-filter dropdown and new-conversation link (left to the
consumer as part of `children`); the language selector, user button, org
switcher and sign-in button (left for `footer`); collapse and the collapse
toggle (no shipped sidebar is collapsible - see 030's Out of scope); Danish
label values (the support-agent app supplies them); deleting the two old
sidebar components from the source app (the adoption issue).
