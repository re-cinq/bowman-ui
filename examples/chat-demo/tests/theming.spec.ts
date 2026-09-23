// The theming tokens (issue 210), proved in a real Chromium: a consumer
// that sets nothing gets the palette colour the library shipped with - measured
// against a probe element, never a pinned oklch serialisation - and a consumer
// that sets every --bowman-* property on a wrapper (src/custom-theme.css)
// recolours the send button, the active row, the streaming avatar circle and
// the composer's focus glow inside that wrapper alone.

import { expect, test, type Locator, type Page } from "@playwright/test";
import { chatComposerLabels, chatMessageListLabels, conversationListLabels } from "../src/labels";

// Kept as literals rather than imported from src/themes.tsx: Playwright's
// transform resolves modules the way Node does, and would choke on the JSX.
const defaultThemeName = "Marginalia Books";
const copperlineThemeName = "Copperline Bicycles";

const themedChatUrl = "/?view=chat&theme=copperline";
const copperAccent = "rgb(183, 65, 14)";
const copperActiveRow = "rgb(253, 235, 220)";
const copperCircleBorder = "rgb(244, 201, 168)";
const copperCircleSurface = "rgb(255, 241, 230)";
const copperGlow = "rgba(183, 65, 14, 0.12)";
const copperTextOnAccent = "rgb(255, 241, 230)";
const copperSurface = "rgb(255, 250, 245)";
const copperBorder = "rgb(234, 219, 205)";
const copperTextStrong = "rgb(51, 36, 26)";
const copperTextSubtle = "rgb(171, 141, 120)";
const copperSuccess = "rgb(46, 125, 79)";
const copperSuccessSoft = "rgb(228, 243, 234)";
const transparent = "rgba(0, 0, 0, 0)";
const streamWindowMs = 10_000;

type ColorProperty = "backgroundColor" | "borderColor" | "color";

// A probe element painted with the palette variable itself: whatever Chromium
// serialises that colour as, the token site must serialise identically. The
// transparent guard catches a dropped variable for a paint property; for a text
// colour that fell back to inherit, the caller's expected-shade assertion catches it.
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

const textColorOf = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => getComputedStyle(element).color);

const boxShadowOf = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => getComputedStyle(element).boxShadow);

const composerOf = (scope: Page | Locator): Locator =>
  scope.getByRole("textbox", { name: chatComposerLabels.composerInput });

// The send button is disabled until there is a draft.
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

// The feedback control carries transition-colors, so poll past the fade into the selected role.
const expectSelectedThumbsUp = async (
  page: Page,
  text: string,
  background: string
): Promise<void> => {
  const thumbsUp = lastAssistantArticle(page).getByRole("button", { name: "Good response" });

  await thumbsUp.click();
  await expect.poll(() => textColorOf(thumbsUp), { timeout: streamWindowMs }).toBe(text);
  await expect.poll(() => backgroundOf(thumbsUp), { timeout: streamWindowMs }).toBe(background);
};

test.describe("the default chat screen", () => {
  test("the send button and the active row resolve to the palette colours the library shipped with", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const blue500 = await computedPaletteColor(page, "--color-blue-500");
    const slate100 = await computedPaletteColor(page, "--color-slate-100");
    const white = await computedPaletteColor(page, "--color-white");

    const sendButton = await enabledSendButton(page);

    expect(await backgroundOf(sendButton)).toBe(blue500);
    expect(await textColorOf(sendButton)).toBe(white);
    expect(await backgroundOf(activeConversationRow(page))).toBe(slate100);
    await expect(page.locator("[data-theme-mark]")).toHaveCount(0);
  });

  test("the composer's surface and border resolve to the palette neutrals the library shipped with", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    const composerFrame = page.getByRole("textbox").locator("..");
    const white = await computedPaletteColor(page, "--color-white");
    const slate200 = await computedPaletteColor(page, "--color-slate-200", "borderColor");

    expect(await backgroundOf(composerFrame)).toBe(white);
    expect(await borderColorOf(composerFrame)).toBe(slate200);
  });

  test("the composer's text resolves to the palette strong colour the library shipped with", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    const slate900 = await computedPaletteColor(page, "--color-slate-900", "color");

    expect(await textColorOf(composerOf(page))).toBe(slate900);
  });

  test("the selected thumbs-up resolves to the palette success colours the library shipped with", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const green600 = await computedPaletteColor(page, "--color-green-600", "color");
    const green100 = await computedPaletteColor(page, "--color-green-100");

    await expectSelectedThumbsUp(page, green600, green100);
  });

  test("a prototype name as the theme value still resolves to the default theme", async ({
    page,
  }) => {
    await page.goto("/?view=chat&theme=constructor");

    await expect(page.getByRole("complementary").getByText(defaultThemeName)).toBeVisible();
    await expect(page.locator("[data-theme-mark]")).toHaveCount(0);
  });
});

test.describe("the Copperline Bicycles chat screen", () => {
  test("the send button and the active row take the wrapper's tokens", async ({ page }) => {
    await page.goto(themedChatUrl);

    const sendButton = await enabledSendButton(page);

    expect(await backgroundOf(sendButton)).toBe(copperAccent);
    expect(await textColorOf(sendButton)).toBe(copperTextOnAccent);
    expect(await backgroundOf(activeConversationRow(page))).toBe(copperActiveRow);
  });

  test("the streaming avatar circle carries the theme's border and its chainring mark", async ({
    page,
  }) => {
    await page.goto(themedChatUrl);

    const composer = composerOf(page);

    await composer.fill("Can I move my delivery to next week?");
    await composer.press("Enter");

    const streamingCircle = lastAssistantArticle(page).locator(".bowman-pulse-subtle");

    await expect(streamingCircle).toBeVisible({ timeout: streamWindowMs });
    await expect
      .poll(() => borderColorOf(streamingCircle), { timeout: streamWindowMs })
      .toBe(copperCircleBorder);
    await expect(streamingCircle.locator("svg[data-theme-mark]")).toHaveCount(1);
  });

  test("the composer's surface and border take the wrapper's neutral role tokens", async ({
    page,
  }) => {
    await page.goto(themedChatUrl);
    const composerFrame = page.getByRole("textbox").locator("..");

    expect(await backgroundOf(composerFrame)).toBe(copperSurface);
    expect(await borderColorOf(composerFrame)).toBe(copperBorder);
  });

  test("the composer's text takes the wrapper's strong text token", async ({ page }) => {
    await page.goto(themedChatUrl);

    expect(await textColorOf(composerOf(page))).toBe(copperTextStrong);
  });

  test("the copy button's rest text takes the wrapper's subtle text token", async ({ page }) => {
    await page.goto(themedChatUrl);

    const copyButton = lastAssistantArticle(page).getByRole("button", { name: "Copy message" });

    await expect(copyButton).toHaveCount(1);
    expect(await textColorOf(copyButton)).toBe(copperTextSubtle);
  });

  test("the disabled send button takes the wrapper's active surface and subtle text tokens", async ({
    page,
  }) => {
    await page.goto(themedChatUrl);

    const sendButton = page.getByRole("button", { name: chatComposerLabels.send });

    await expect(sendButton).toBeDisabled();
    expect(await backgroundOf(sendButton)).toBe(copperActiveRow);
    expect(await textColorOf(sendButton)).toBe(copperTextSubtle);
  });

  test("the focused composer glows in the theme's accent", async ({ page }) => {
    await page.goto(themedChatUrl);

    const composer = composerOf(page);
    const composerWrapper = composer.locator("..");

    await composer.focus();
    await expect
      .poll(() => boxShadowOf(composerWrapper), { timeout: streamWindowMs })
      .toContain(copperGlow);
  });

  test("the selected thumbs-up takes the wrapper's success tokens", async ({ page }) => {
    await page.goto(themedChatUrl);

    await expectSelectedThumbsUp(page, copperSuccess, copperSuccessSoft);
  });

  test("the sidebar names the theme", async ({ page }) => {
    await page.goto(themedChatUrl);

    await expect(page.getByRole("complementary").getByText(copperlineThemeName)).toBeVisible();
  });
});

test.describe("the Overview page's Theming section", () => {
  test("the two previews render the same send button in different colours", async ({ page }) => {
    await page.goto("/?view=docs&component=overview");

    const defaultPreview = page.locator('[data-theming-preview="default"]');
    const customPreview = page.locator('[data-theming-preview="custom"]');

    await expect(defaultPreview).toHaveCount(1);
    await expect(customPreview).toHaveCount(1);

    const blue500 = await computedPaletteColor(page, "--color-blue-500");
    const defaultBackground = await backgroundOf(await enabledSendButton(defaultPreview));
    const customBackground = await backgroundOf(await enabledSendButton(customPreview));

    expect(defaultBackground).toBe(blue500);
    expect(customBackground).toBe(copperAccent);
    expect(defaultBackground).not.toBe(customBackground);
    await expect(customPreview.locator("svg[data-theme-mark]")).toHaveCount(1);
    await expect(defaultPreview.locator("[data-theme-mark]")).toHaveCount(0);
  });

  // The preview's entry streams forever, so the circle needs no polling window.
  test("the two previews' streaming circles take their border and surface from the tokens", async ({
    page,
  }) => {
    await page.goto("/?view=docs&component=overview");

    const defaultCircle = page.locator('[data-theming-preview="default"] .bowman-pulse-subtle');
    const customCircle = page.locator('[data-theming-preview="custom"] .bowman-pulse-subtle');

    await expect(defaultCircle).toHaveCount(1);
    await expect(customCircle).toHaveCount(1);

    const blue200 = await computedPaletteColor(page, "--color-blue-200", "borderColor");
    const blue50 = await computedPaletteColor(page, "--color-blue-50");

    expect(await borderColorOf(defaultCircle)).toBe(blue200);
    expect(await backgroundOf(defaultCircle)).toBe(blue50);
    expect(await borderColorOf(customCircle)).toBe(copperCircleBorder);
    expect(await backgroundOf(customCircle)).toBe(copperCircleSurface);
  });
});

// issue 151: the dark scheme rendered, so two -dark fallbacks are measured rather than pinned
// as class strings, and shown to differ from the light shades the tests above read.
test.describe("the default chat screen under the dark scheme", () => {
  test.use({ colorScheme: "dark" });

  test("the send button and the composer's surface resolve to the dark palette fallbacks", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const blue500 = await computedPaletteColor(page, "--color-blue-500");
    const blue600 = await computedPaletteColor(page, "--color-blue-600");
    const white = await computedPaletteColor(page, "--color-white");
    const slate900 = await computedPaletteColor(page, "--color-slate-900");
    const composerFrame = page.getByRole("textbox").locator("..");
    const sendButton = await enabledSendButton(page);

    await expect.poll(() => backgroundOf(sendButton), { timeout: streamWindowMs }).toBe(blue600);
    expect(blue600).not.toBe(blue500);
    expect(await backgroundOf(composerFrame)).toBe(slate900);
    expect(slate900).not.toBe(white);
  });
});
