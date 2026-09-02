# Definition of Done

Strategy: direct

Why: AppShell already renders correctly — `brand != null` gates the centring spacer, so
`brand={null}` produces no spacer just like brand omitted. The seam is the test file itself:
the acceptance test can call the real `AppShell` entry point and fail on the guard assertion
that enforces removal of the vacuous `querySelectorAll("header > div")` selector.

Acceptance tests:
  - tests/AppShell.test.tsx::AppShell > review fixes (issue 030) > brand={null} renders no centring spacer — correctly characterized with header-row selector
    — pins that (a) `brand={null}` produces no `div.h-10.w-10` spacer in the mobile header
      row (behavioral, already green), and (b) the file no longer contains the vacuous
      `querySelectorAll("header > div")` call that makes the old characterization test at
      L454 vacuously true (guard, red until the old test is removed).

Facets (the red-green-refactor steps you expect, smallest first):
  - Remove the vacuous test at tests/AppShell.test.tsx L454–466 (the one using `header > div`).
  - Confirm the acceptance test at L468 is now fully green (both behavioral and guard assertions pass).
  - Run `node scripts/repoint-spec-anchors.mjs` to update any shifted #Lnn anchors.

Out of scope: changing the mobile header from `<div>` to `<header>`; making the existing
test at L412 ("brand omitted") cover `brand={null}` explicitly; changing component behaviour.
