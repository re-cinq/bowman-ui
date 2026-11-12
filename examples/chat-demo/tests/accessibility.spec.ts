// The automated accessibility layer for the form, dialog and notice components (issue 415): axe
// under the WCAG 2.2 AA rule tags, zero violations, on every documented state of each new page and
// on the search field's on-submit state, under both colour schemes, in Chromium and WebKit. While
// no dialog is open the scan covers the page's variant figures alone; while one is open, its panel
// alone - the overlay dims the page behind it, and aria-modal takes that page out of the tree - so
// the documentation chrome around the components is never what is measured. axe's color-contrast
// rule measures text only; the non-text minimums rest on the token matrix in docs.spec.ts.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { docsRun, docsUrl, variantOf } from "./helpers/docsTokenPages";
import { expectSite, hover, type TokenSite } from "./helpers/tokens";

const wcag22AaTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const figures = "[data-doc-variant]";

const openPanels = '[role="dialog"], [role="alertdialog"]';

const expectNoViolations = async (page: Page, scope: string): Promise<void> => {
  // A scope that matched nothing would scan nothing and pass.
  await expect(page.locator(scope).first()).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(wcag22AaTags).include(scope).analyze();
  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));

  expect(violations, `axe violations within ${scope}`).toEqual([]);
};

const scannedPages = [
  "text-field",
  "dialog",
  "confirm-dialog",
  "notice",
  "key-value-list",
  "card",
  "search-field",
];

interface OpenState {
  componentId: string;
  variant: string;
  /** Run once the panel is visible, to bring it to the state the scan covers. */
  reach?: (page: Page) => Promise<void>;
  /** A defect outside this change that axe reports in the light scheme, expected to fail until fixed. */
  knownLightDefect?: string;
}

// The primary Button's resting fill is --bowman-accent's blue-500 under white text, 3.68:1 against
// the 4.5:1 text minimum; the variant's classes predate issue 415, which keeps them unchanged.
const primaryButtonContrast =
  "primary Button: white text on the light --bowman-accent fallback (blue-500) is 3.68:1, below 4.5:1";

const busyStatus = (page: Page) => page.locator(openPanels).getByRole("status");

const openStates: ReadonlyArray<OpenState> = [
  { componentId: "dialog", variant: "default" },
  { componentId: "dialog", variant: "overflowing" },
  { componentId: "dialog", variant: "footer-save", knownLightDefect: primaryButtonContrast },
  { componentId: "dialog", variant: "form-in-body", knownLightDefect: primaryButtonContrast },
  { componentId: "dialog", variant: "container" },
  { componentId: "confirm-dialog", variant: "default" },
  {
    componentId: "confirm-dialog",
    variant: "busy",
    reach: async (page) => {
      await page.locator(openPanels).locator('button[type="submit"]').click();
      await expect(busyStatus(page)).not.toBeEmpty();
    },
  },
  {
    componentId: "confirm-dialog",
    variant: "opened-busy",
    reach: (page) => expect(busyStatus(page)).not.toBeEmpty(),
  },
  { componentId: "confirm-dialog", variant: "with-field" },
  { componentId: "confirm-dialog", variant: "confirm-disabled" },
  { componentId: "confirm-dialog", variant: "themed" },
];

// The standalone danger buttons, hovered until the computed fill is the hover token's, then
// scanned again, so axe measures the white-on-hover-fill pair rather than only the table.
const hoveredFigures: ReadonlyArray<{ variant: string; site: TokenSite }> = [
  "danger-button",
  "danger-icon-button",
].map((variant) => ({
  variant,
  site: {
    token: "--bowman-danger-fill-hover",
    site: `the hovered ${variant} figure`,
    property: "backgroundColor",
    locate: (page: Page) => variantOf(page, variant).getByRole("button"),
    act: hover,
  },
}));

for (const scheme of ["light", "dark"] as const) {
  test.describe(`axe under the ${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const componentId of scannedPages) {
      test(`the ${componentId} page's variant figures have no WCAG 2.2 AA violations`, async ({
        page,
      }) => {
        await page.goto(docsUrl(componentId));
        await expect(page.locator(figures).first()).toBeVisible();

        await expectNoViolations(page, figures);
      });
    }

    for (const { componentId, variant, reach, knownLightDefect } of openStates) {
      test(`the ${componentId} page's ${variant} dialog, open, has no WCAG 2.2 AA violations`, async ({
        page,
      }) => {
        test.fail(scheme === "light" && knownLightDefect !== undefined, knownLightDefect);
        await page.goto(docsUrl(componentId));
        await variantOf(page, variant).getByRole("button").first().click();
        await expect(page.locator(openPanels)).toHaveCount(1);
        await reach?.(page);

        await expectNoViolations(page, openPanels);
      });
    }

    for (const { variant, site } of hoveredFigures) {
      test(`the confirm-dialog page's ${variant} figure, hovered, has no WCAG 2.2 AA violations`, async ({
        page,
      }) => {
        const run = docsRun(scheme, docsUrl("confirm-dialog"));

        await page.goto(run.url);
        await expectSite(page, run, site);

        await expectNoViolations(page, `[data-doc-variant="${variant}"]`);
      });
    }
  });
}
