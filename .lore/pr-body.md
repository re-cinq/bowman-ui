The `brand={null}` test in `tests/AppShell.test.tsx` was passing for the wrong reason.
The old test called `container.querySelectorAll("header > div")` on both a `brand={null}`
render and a brand-omitted render, then compared the counts. Because AppShell's mobile
header is a `<div>`, not a `<header>`, that selector finds nothing in either tree —
so it was asserting `0 === 0` and claiming equivalence without ever touching the spacer
the spec actually cares about. The behavior it was meant to pin (no centering spacer when
`brand` is absent or null) was not being tested at all.

The fix replaces the vacuous test with one that queries the real structure: it reaches
the mobile header row through `getHamburger().parentElement` and checks that no
`div.h-10.w-10` element exists inside it. That is the centering spacer class, so a pass
here means the spacer genuinely absent — not merely that a structurally wrong selector
returned nothing. A guard assertion then reads the test file itself and fails if
`querySelectorAll("header > div")` reappears, making the fix self-enforcing.

The two commits on this branch followed the red-green-refactor order the DoD prescribed:
the acceptance test (behavioral check + guard) was committed first as a failing test, then
the old vacuous test was removed, turning both assertions green.

No production code changed. The component already behaved correctly — `brand != null`
gates the spacer, so `brand={null}` produces no spacer just as omitting the prop does.
The only seam was the test.

`specs/bowman-ui-app-shell/spec.md` documents this at lines 174–182: the section on
`brand={null}` now records both the old vacuous selector and the correct characterization,
with anchors pointing to the replacement test at `tests/AppShell.test.tsx#L454` and to
the guard section at `#L468`.

The acceptance test that defines done is:

    AppShell > GDPR and import hygiene > review fixes (issue 030) >
    brand={null} renders no centring spacer — correctly characterized with header-row selector

It has two assertions: the behavioral one (no `div.h-10.w-10` in the hamburger's parent)
and the guard (the file contains no `querySelectorAll("header > div")`). Both pass. The
full suite is 817 tests across 50 files, all green, with coverage at 100% lines/functions/
statements and 99.73% branches (above the 90% branch floor in `vitest.config.ts`).
