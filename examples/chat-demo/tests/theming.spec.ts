// The theming tokens (re-cinq/Otto#210), proved in a real Chromium: a consumer
// that sets nothing gets the palette colour the library shipped with - measured
// against a probe element, never a pinned oklch serialisation - and a consumer
// that sets the fifteen --bowman-* properties on a wrapper (src/client-brand.css)
// recolours the send button, the active row, the streaming avatar circle and
// the composer's focus glow inside that wrapper alone.

import { expect, test, type Locator, type Page } from "@playwright/test";
import { chatComposerLabels, chatMessageListLabels, conversationListLabels } from "../src/labels";

// Kept as literals rather than imported from src/brands.tsx: Playwright's
// transform resolves modules the way Node does, and would choke on the JSX.
const defaultBrandName = "Marginalia Books";
const copperlineBrandName = "Copperline Bicycles";

const brandedChatUrl = "/?view=chat&brand=copperline";
const copperAccent = "rgb(183, 65, 14)";
const copperActiveRow = "rgb(253, 235, 220)";
const copperCircleBorder = "rgb(244, 201, 168)";
const copperCircleSurface = "rgb(255, 241, 230)";
const copperGlow = "rgba(183, 65, 14, 0.12)";
const transparent = "rgba(0, 0, 0, 0)";
const streamWindowMs = 10_000;

type ColorProperty = "backgroundColor" | "borderColor";

// A probe element painted with the palette variable itself: whatever Chromium
// serialises that colour as, the token site must serialise identically. The
// guard keeps the equality from passing vacuously should the consumer build
// stop emitting the variable into :root.
const computedPaletteColor = async (
  page: Page,
  variable: string,
  property: ColorProperty = "backgroundColor"
): Promise<string> => {
  const computed = await page.evaluate(
    ([name, styleProperty]) => {
      const probe = document.createElement("div");

      probe.style[styleProperty] = `var(${name})`;
      document.body.append(probe);
      const value = getComputedStyle(probe)[styleProperty];

      probe.remove();

      return value;
    },
    [variable, property] as const
  );

  expect(computed, `the consumer build must emit ${variable} into :root`).not.toBe(transparent);

  return computed;
};

const backgroundOf = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => getComputedStyle(element).backgroundColor);

const borderColorOf = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => getComputedStyle(element).borderColor);

const boxShadowOf = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => getComputedStyle(element).boxShadow);

const composerOf = (scope: Page | Locator): Locator =>
  scope.getByRole("textbox", { name: chatComposerLabels.composerInput });

// The send button is disabled - and slate - until there is a draft.
const enabledSendButton = async (scope: Page | Locator): Promise<Locator> => {
  await composerOf(scope).fill("An invented draft");
  const sendButton = scope.getByRole("button", { name: chatComposerLabels.send });

  await expect(sendButton).toBeEnabled();

  return sendButton;
};

const activeConversationRow = (page: Page): Locator =>
  page
    .getByRole("list", { name: conversationListLabels.conversations })
    .getByRole("listitem")
    .filter({ has: page.locator('[aria-current="page"]') });

const lastAssistantArticle = (page: Page): Locator =>
  page.getByRole("article", { name: chatMessageListLabels.assistantMessage }).last();

test.describe("the default chat screen", () => {
  test("the send button and the active row resolve to the palette colours the library shipped with", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const blue500 = await computedPaletteColor(page, "--color-blue-500");
    const slate100 = await computedPaletteColor(page, "--color-slate-100");

    expect(await backgroundOf(await enabledSendButton(page))).toBe(blue500);
    expect(await backgroundOf(activeConversationRow(page))).toBe(slate100);
    await expect(page.locator("[data-brand-mark]")).toHaveCount(0);
  });

  test("a prototype name as the brand value still resolves to the default brand", async ({
    page,
  }) => {
    await page.goto("/?view=chat&brand=constructor");

    await expect(page.getByRole("complementary").getByText(defaultBrandName)).toBeVisible();
    await expect(page.locator("[data-brand-mark]")).toHaveCount(0);
  });
});

test.describe("the Copperline Bicycles chat screen", () => {
  test("the send button and the active row take the wrapper's tokens", async ({ page }) => {
    await page.goto(brandedChatUrl);

    expect(await backgroundOf(await enabledSendButton(page))).toBe(copperAccent);
    expect(await backgroundOf(activeConversationRow(page))).toBe(copperActiveRow);
  });

  test("the streaming avatar circle carries the brand's border and its chainring mark", async ({
    page,
  }) => {
    await page.goto(brandedChatUrl);

    const composer = composerOf(page);

    await composer.fill("Can I move my delivery to next week?");
    await composer.press("Enter");

    const streamingCircle = lastAssistantArticle(page).locator(".bowman-pulse-subtle");

    await expect(streamingCircle).toBeVisible({ timeout: streamWindowMs });
    await expect
      .poll(() => borderColorOf(streamingCircle), { timeout: streamWindowMs })
      .toBe(copperCircleBorder);
    await expect(streamingCircle.locator("svg[data-brand-mark]")).toHaveCount(1);
  });

  test("the focused composer glows in the brand's accent", async ({ page }) => {
    await page.goto(brandedChatUrl);

    const composer = composerOf(page);
    const composerWrapper = composer.locator("..");

    await composer.focus();
    await expect
      .poll(() => boxShadowOf(composerWrapper), { timeout: streamWindowMs })
      .toContain(copperGlow);
  });

  test("the sidebar names the brand", async ({ page }) => {
    await page.goto(brandedChatUrl);

    await expect(page.getByRole("complementary").getByText(copperlineBrandName)).toBeVisible();
  });
});

test.describe("the Overview page's Theming section", () => {
  test("the two previews render the same send button in different colours", async ({ page }) => {
    await page.goto("/?view=docs&component=overview");

    const defaultPreview = page.locator('[data-theming-preview="default"]');
    const clientPreview = page.locator('[data-theming-preview="client"]');

    await expect(defaultPreview).toHaveCount(1);
    await expect(clientPreview).toHaveCount(1);

    const blue500 = await computedPaletteColor(page, "--color-blue-500");
    const defaultBackground = await backgroundOf(await enabledSendButton(defaultPreview));
    const clientBackground = await backgroundOf(await enabledSendButton(clientPreview));

    expect(defaultBackground).toBe(blue500);
    expect(clientBackground).toBe(copperAccent);
    expect(defaultBackground).not.toBe(clientBackground);
    await expect(clientPreview.locator("svg[data-brand-mark]")).toHaveCount(1);
    await expect(defaultPreview.locator("[data-brand-mark]")).toHaveCount(0);
  });

  // The preview's entry streams forever, so the circle needs no polling window.
  test("the two previews' streaming circles take their border and surface from the tokens", async ({
    page,
  }) => {
    await page.goto("/?view=docs&component=overview");

    const defaultCircle = page.locator('[data-theming-preview="default"] .bowman-pulse-subtle');
    const clientCircle = page.locator('[data-theming-preview="client"] .bowman-pulse-subtle');

    await expect(defaultCircle).toHaveCount(1);
    await expect(clientCircle).toHaveCount(1);

    const blue200 = await computedPaletteColor(page, "--color-blue-200", "borderColor");
    const blue50 = await computedPaletteColor(page, "--color-blue-50");

    expect(await borderColorOf(defaultCircle)).toBe(blue200);
    expect(await backgroundOf(defaultCircle)).toBe(blue50);
    expect(await borderColorOf(clientCircle)).toBe(copperCircleBorder);
    expect(await backgroundOf(clientCircle)).toBe(copperCircleSurface);
  });
});
