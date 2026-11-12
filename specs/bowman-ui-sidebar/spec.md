# bowman-ui sidebar

| Field  | Value                              |
| ------ | ---------------------------------- |
| Issue  | issue 81 (`031-bowman-ui-sidebar`) |
| Status | In Progress                        |

`AppSidebar` is the package's one presentational sidebar - brand row,
navigation map, chat history, language row, user-controls row - written
once, serving both the desktop rail and the mobile drawer, with no
auth-SDK, i18n-runtime or router import. It ships as
`src/components/AppSidebar.tsx` (`AppSidebar`, `AppSidebarProps`,
`SidebarNavItem`, `SidebarNavLinkProps`, `AppSidebarLabels`,
`defaultAppSidebarLabels`). Brand, middle region and footer are slots,
navigation is data, and the frame that places it - desktop rail vs. mobile
drawer, drawer mechanics - is `030-bowman-ui-app-shell`; this component owns
only what's inside.

## The public surface

The component renders one `<aside>` whose accessible name is the resolved
`sidebar` label, containing at most one `<nav>` whose accessible name is the
resolved `mainNavigation` label. `AppSidebarLabels` has exactly
those two defaulted keys ("Sidebar", "Main navigation"); no third,
duplicate landmark name
("Mobile navigation") exists - 030's shell wrappers are
non-landmark `div`s (docs/design-notes.md § AppShell), and although the shell mounts
the sidebar twice, `hidden`/`md:hidden` on the positions and `inert` on the
closed drawer keep one exposed at a time; a bare render contains exactly one
`<nav>`. `AppSidebar`
sits in the `labelsProp` partition bucket
([partition@40501f6f](../../tests/labelled-exports.test.tsx#L105),
[validated by `renders one <aside> named "Sidebar" containing one <nav> named "Main navigation" by default` @a02735d4](../../tests/AppSidebar.test.tsx#L22),
[validated by labels={{sidebar: "Panel lateral", mainNavigation: "Navegación principal"}} names both landmarks](../../tests/AppSidebar.test.tsx#L33)). It passes the
sentinel render with both labels set to sentinels
([harness@40501f6f](../../tests/labelled-exports.test.tsx#L571),
[coverage@277e0968](../../tests/labelled-exports.test.tsx#L759)).

## The decisions

1. **The exported name is `AppSidebar`, not `Sidebar`.** The prefixed name
   states that this is the app frame's sidebar and stays clear of the
   generic `Sidebar` name a consumer app is likely to own already
   ([validated by @d5931828](../../tests/public-api.test.ts#L43),
   [types@55dd1594](../../tests/public-api.test.ts#L47)).
2. **Active state is a per-item `isActive` boolean, not a path comparison.**
   The org has more than one router, so the component assumes neither.
   - Three `navItems` render three items in order, each showing its `label`;
     the one with `isActive: true` alone carries `aria-current="page"` -
     announced, not merely background-coloured - and with no
     item marked, none does
     ([validated by three navItems render three items in order, each showing its label, and the isActive one alone carries aria-current="page" @f00267b9](../../tests/AppSidebar.test.tsx#L66),
     [validated by with no item marked isActive, none carries aria-current @60d096f8](../../tests/AppSidebar.test.tsx#L78)).
   - Rows are keyed by `item.key`: reordering moves the same DOM nodes
     ([validated by items are keyed by item.key: reversing navItems moves the same DOM nodes instead of remounting them @decbce56](../../tests/AppSidebar.test.tsx#L93)).
   - `navItems` omitted or `[]` renders no `<nav>` element at all
     ([validated by `navItems omitted renders no <nav> element at all` @0ea4fe99](../../tests/AppSidebar.test.tsx#L106),
     [L112@b6605386](../../tests/AppSidebar.test.tsx#L112)).
3. **`renderNavLink(item, props)` is the routing seam; the default is
   `<button type="button" {...props} />`.**
   - A nav item carries its resolved `label`, not a translation key, and no
     `href` - `SidebarNavItem` has no `href` field, pinned by a
     `@ts-expect-error` fixture compiled against the built package
     ([validated by @fc2de010](../../tests/types/app-sidebar-type-assertions.tsx#L26),
     [compiled by @549e62dd](../../tests/app-sidebar-dist.test.ts#L18)).
   - The consumer's element must spread every prop it is handed -
     docs/design-notes.md § renderNavLink states it, pinned together with the anchor
     round-trip and the dropped-`onClick` failure mode
     ([validated by anchors carry the component's className and aria-current, and clicking one calls onNavigate with that key @9832b858](../../tests/AppSidebar.test.tsx#L152),
     [validated by a renderNavLink that spreads everything except onClick calls onNavigate zero times @79d0100a](../../tests/AppSidebar.test.tsx#L175),
     [validated by the design notes' renderNavLink section requires the consumer to spread every prop @db74274b](../../tests/AppSidebar.test.tsx#L194)).
   - Clicking an item calls `onNavigate` once with that item's `key`;
     `onNavigate` omitted, clicking throws nothing
     ([validated by clicking an item calls onNavigate once with "settings" @a20adf9d](../../tests/AppSidebar.test.tsx#L118),
     [validated by with onNavigate omitted, clicking an item throws nothing @a391e952](../../tests/AppSidebar.test.tsx#L129)).
   - `icon` is an optional `ComponentType<{ className?: string }>` rendered at
     `h-5 w-5`; an item without one renders its label and no `<svg>` - the
     component imports no icon itself
     ([validated by an item with icon: ChatIcon renders that component with className "h-5 w-5" @1f6ba148](../../tests/AppSidebar.test.tsx#L202),
     [validated by `an item without icon renders its label and no <svg>` @10a21262](../../tests/AppSidebar.test.tsx#L212)).
4. **The middle region is `children`, wrapped in
   `flex min-h-0 flex-1 flex-col overflow-y-auto`.** The sidebar supplies
   growth and scrolling regardless of what's passed in - an unsized child is
   the one that grows, pinned by the wrapper's class list
   ([validated by children render inside a wrapper carrying flex min-h-0 flex-1 flex-col overflow-y-auto, so an unsized child is the one that grows @cdab0c76](../../tests/AppSidebar.test.tsx#L221)).

   The region owns its text colour: it reads `--bowman-text-body`, so
   plain-string children read on the dark surface instead of inheriting the
   page colour ([validated by the children scroll region carries the body text token, so plain-string children read on the dark surface @b45219a8](../../tests/AppSidebar.test.tsx#L277)).

5. **The footer is one `footer?: ReactNode` slot inside a single `border-t`
   region, not four named slots.** User menu, org switcher, language picker
   and sign-in are all consumer-specific; a support customer has none of
   them. `footer` present renders exactly one `border-t` region; omitted,
   no such region ([validated by `footer={<button>Log ud</button>} renders that node inside exactly one border-t region` @15f8b795](../../tests/AppSidebar.test.tsx#L236),
   [validated by footer omitted renders no border-t region @15515f62](../../tests/AppSidebar.test.tsx#L245)).

   The region owns its text colour: it reads `--bowman-text-body`, so a
   plain-string footer reads on the dark surface instead of inheriting the page
   colour ([validated by the footer region carries the body text token, so a plain-string footer reads on the dark surface @b0f9ec6f](../../tests/AppSidebar.test.tsx#L286)).

6. **The brand is a slot inside the bordered top row; omitted, no row
   renders at all** - no `h-14` row and no `border-b` above the navigation
   ([validated by `brand={<span>Acme Support</span>} renders it inside the bordered top row` @aff85efc](../../tests/AppSidebar.test.tsx#L251),
   [validated by brand omitted renders no top row and no border-b above the navigation @79aa1ee1](../../tests/AppSidebar.test.tsx#L261)).

   The row owns its text colour: it reads `--bowman-text-body`, so a
   plain-string brand reads on the dark surface instead of inheriting the page
   colour ([validated by the brand row carries the body text token, so a plain-string brand reads on the dark surface @f8556e9e](../../tests/AppSidebar.test.tsx#L268)).

   The active nav item reads `--bowman-text-strong` for its label and an inactive
   item takes the role's `hover:` variant (docs/design-notes.md § Theming decision 6),
   so a consumer recolours the strong nav text with the theme
   ([validated by the isActive item reads --bowman-active with the strong text token, an inactive item takes the strong hover token, and every item keeps focus:ring-2 beside the --bowman-focus-ring colour @7228460a](../../tests/AppSidebar.test.tsx#L137)).

   One consequence carried over from 030 as shipped: in the mobile drawer the
   shell renders its own bordered 56px close-button row as a sibling above
   this component, so a `brand` row stacks a second bordered 56px row directly
   beneath it - two horizontal rules of chrome. Documented, not solved: the
   sidebar doesn't know which position it's in, and the drawer's row belongs
   to 030.

7. **One class list serves both 030 positions.** Below `md` the only
   position is the drawer - a column flex beside a 56px close row - where
   `flex-1 min-h-0` fills the remaining height and the drawer supplies width
   and border. At `md`+ the only position is the row-flex rail, where the
   aside pins its own `md:h-full md:w-64 md:flex-none md:border-r lg:w-72`
   ([validated by the aside grows in the 030 drawer and sizes itself in the rail: flex-1 min-h-0 below md, md:h-full md:w-64 md:flex-none md:border-r lg:w-72 @aa963a6e](../../tests/AppSidebar.test.tsx#L44)).

## GDPR

The sidebar hosts a conversation list whose titles carry booking identifiers
and customer names (`003-support-conversation-data-flow-record`). The
component calls no `console.*`, no `fetch`, no `navigator.sendBeacon` and no
`localStorage` or `sessionStorage`, and stores nothing outside React state -
asserted by a source grep
([validated by `GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics` @5cccffbb](../../tests/AppSidebar.test.tsx#L301)). The suite-wide
console spy stays at zero calls ([spy@9d11c821](../../tests/setup.ts#L58)).

## Build contract

The file imports nothing from `@clerk`, `swr`, `next-intl`, `next/`,
`@/` or `lucide-react`, and every relative import ends in `.js`.
`dist/components/AppSidebar.js` carries `"use client"` as its first statement
and ships with its `.d.ts`
([validated by dist/components/AppSidebar.js opens with "use client"; as its first statement @c78a01a5](../../tests/app-sidebar-dist.test.ts#L10),
[validated by npm pack --dry-run ships dist/components/AppSidebar.js with its d.ts @6625bda3](../../tests/app-sidebar-dist.test.ts#L14),
[validated by no @clerk, swr, next-intl, next/, @/ or lucide-react import, and every relative import ends in .js @9265fdb1](../../tests/AppSidebar.test.tsx#L305)). A key added to
`AppSidebarLabels` without a default cannot satisfy
`Readonly<Required<AppSidebarLabels>>`
([validated by @48e50be3](../../tests/types/app-sidebar-type-assertions.tsx#L19)).

## Out of scope

The frame that places this component - desktop rail, mobile drawer, backdrop,
mobile header, close button, focus trap, scroll lock (all 030); the
conversation list itself (029 ships it, this sidebar takes a node); the
search box, org-filter dropdown and new-conversation link (left to the
consumer as part of `children`); the language selector, user button, org
switcher and sign-in button (left for `footer`); collapse and the collapse
toggle (no shipped sidebar is collapsible - see 030's Out of scope); and
translated label values (the consumer app supplies them).
