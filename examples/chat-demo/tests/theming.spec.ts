// The theming tokens (issue 210), proved in a real Chromium: a consumer
// that sets nothing gets the palette colour the library shipped with, a consumer that sets every
// --bowman-* property on a wrapper (src/custom-theme.css) gets the wrapper's colours, and both are
// measured at a visible site of the chat screen for every token the installed stylesheet declares,
// under the light and the dark scheme, in WebKit too. A colour is never compared to a pinned oklch
// string: a probe painted with the expected value gives the engine's own serialisation
// (tests/helpers/colors.ts), and every read polls past transition-colors.

import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  chatComposerLabels,
  chatMessageListLabels,
  conversationListLabels,
  navSettingsLabel,
} from "../src/labels";
import { conversations, initialEntriesByConversation } from "../src/fixtures";
import {
  backgroundOf,
  borderColorOf,
  computedPaletteColor,
  serialisedColor,
} from "./helpers/colors";
import {
  click,
  copperlineValues,
  declaredFallbacks,
  declaredValue,
  expectSite,
  focus,
  hover,
  pollWindowMs,
  tokensMeasuredBy,
  type ThemeRun,
  type TokenSite,
} from "./helpers/tokens";

// Kept as literals rather than imported from src/themes.tsx: Playwright's transform resolves
// modules the way Node does, and would choke on the JSX.
const defaultThemeName = "Marginalia Books";
const copperlineThemeName = "Copperline Bicycles";

const themedChatUrl = "/?view=chat&theme=copperline";

const composerOf = (scope: Page | Locator): Locator =>
  scope.getByRole("textbox", { name: chatComposerLabels.composerInput });

const composerFrame = (page: Page): Locator => composerOf(page).locator("..");

const sendButtonOf = (scope: Page | Locator): Locator =>
  scope.getByRole("button", { name: chatComposerLabels.send });

const conversationRows = (page: Page): Locator =>
  page.getByRole("list", { name: conversationListLabels.conversations }).getByRole("listitem");

const activeConversationRow = (page: Page): Locator =>
  conversationRows(page).filter({ has: page.locator('[aria-current="page"]') });

const activeRowLink = (page: Page): Locator =>
  activeConversationRow(page).locator('[aria-current="page"]');

const lastAssistantArticle = (page: Page): Locator =>
  page.getByRole("article", { name: chatMessageListLabels.assistantMessage }).last();

const copyButtonOf = (page: Page): Locator =>
  lastAssistantArticle(page).getByRole("button", { name: chatMessageListLabels.copy });

const feedbackButton = (page: Page, label: string): Locator =>
  lastAssistantArticle(page).getByRole("button", { name: label });

const streamingCircle = (page: Page): Locator =>
  lastAssistantArticle(page).locator(".bowman-pulse-subtle");

// The send button is disabled until there is a draft.
const enabledSendButton = async (scope: Page | Locator): Promise<Locator> => {
  await composerOf(scope).fill("An invented draft");
  const sendButton = sendButtonOf(scope);

  await expect(sendButton).toBeEnabled();

  return sendButton;
};

const sendMessage = async (circle: Locator, page: Page): Promise<void> => {
  const composer = composerOf(page);

  await composer.fill("Can I move my delivery to next week?");
  await composer.press("Enter");
  await expect(circle).toBeVisible({ timeout: pollWindowMs });
};

// The reply commits after streamStartDelayMs + (streamStepCount + 1) * streamStepIntervalMs and
// the circle unmounts with it, so every streaming site sends again rather than racing one stream.
const ensureStreaming = async (circle: Locator, page: Page): Promise<void> => {
  if ((await circle.count()) > 0) {
    return;
  }

  await sendMessage(circle, page);
};

// Pause the keyframe at its 50% stop, where the outline and shadow carry the tokens exactly.
const pauseAtHalf = (circle: Locator): Promise<void> =>
  circle.evaluate((element) => {
    const [animation] = element.getAnimations();

    if (animation === undefined) {
      throw new Error("the streaming circle carries no animation to pause");
    }
    animation.pause();
    animation.currentTime = 750;
  });

// A re-sent stream paints a fresh, unpaused circle, so the 50% stop is re-applied per site.
const ensurePausedAtHalf = async (circle: Locator, page: Page): Promise<void> => {
  await ensureStreaming(circle, page);
  await pauseAtHalf(circle);
};

const restSites: ReadonlyArray<TokenSite> = [
  {
    token: "--bowman-active",
    site: "the active conversation row",
    property: "backgroundColor",
    locate: activeConversationRow,
  },
  {
    token: "--bowman-surface",
    site: "the composer frame",
    property: "backgroundColor",
    locate: composerFrame,
  },
  {
    token: "--bowman-border",
    site: "the composer frame",
    property: "borderColor",
    locate: composerFrame,
  },
  {
    token: "--bowman-text-strong",
    site: "the composer text",
    property: "color",
    locate: composerOf,
  },
  {
    token: "--bowman-text-body",
    site: "the sidebar brand row",
    property: "color",
    locate: (page, run) => page.getByRole("complementary").getByText(run.themeName),
  },
  {
    token: "--bowman-text-secondary",
    site: "the inactive nav item",
    property: "color",
    locate: (page) => page.getByRole("navigation").getByRole("button", { name: navSettingsLabel }),
  },
  {
    token: "--bowman-text-muted",
    site: "the disclosure band",
    property: "color",
    locate: (page) => page.getByText(chatMessageListLabels.aiDisclosure, { exact: true }),
  },
  {
    token: "--bowman-text-subtle",
    site: "the copy button at rest",
    property: "color",
    locate: copyButtonOf,
  },
];

const sendButtonSites: ReadonlyArray<TokenSite> = [
  {
    token: "--bowman-active",
    site: "the disabled send button",
    property: "backgroundColor",
    locate: sendButtonOf,
  },
  {
    token: "--bowman-text-subtle",
    site: "the disabled send button",
    property: "color",
    locate: sendButtonOf,
  },
  {
    token: "--bowman-accent",
    site: "the enabled send button",
    property: "backgroundColor",
    locate: sendButtonOf,
    act: async (_sendButton, page) => {
      await enabledSendButton(page);
    },
  },
  {
    token: "--bowman-text-on-accent",
    site: "the enabled send button",
    property: "color",
    locate: sendButtonOf,
  },
  {
    token: "--bowman-accent-hover",
    site: "the hovered send button",
    property: "backgroundColor",
    locate: sendButtonOf,
    act: hover,
  },
];

const hoverSites: ReadonlyArray<TokenSite> = [
  {
    token: "--bowman-surface-hover",
    site: "the hovered inactive row",
    property: "backgroundColor",
    locate: (page) => conversationRows(page).filter({ hasText: conversations[1].title }),
    act: hover,
  },
  {
    token: "--bowman-control-hover",
    site: "the hovered copy button",
    property: "backgroundColor",
    locate: copyButtonOf,
    act: hover,
  },
  {
    token: "--bowman-text-secondary",
    site: "the hovered copy button",
    property: "color",
    locate: copyButtonOf,
  },
  {
    token: "--bowman-danger",
    site: "the hovered delete button",
    property: "color",
    locate: (page) =>
      activeConversationRow(page).getByRole("button", {
        name: conversationListLabels.deleteConversation(conversations[0].title),
      }),
    act: hover,
  },
];

const focusSites: ReadonlyArray<TokenSite> = [
  {
    token: "--bowman-focus-ring",
    site: "the focused row link's ring",
    property: "boxShadow",
    locate: activeRowLink,
    act: focus,
  },
  {
    token: "--bowman-ring-offset",
    site: "the focused row link's ring offset",
    property: "boxShadow",
    locate: activeRowLink,
  },
  {
    token: "--bowman-accent-glow",
    site: "the focused composer's glow",
    property: "boxShadow",
    locate: composerFrame,
    act: (_frame, page) => composerOf(page).focus(),
  },
];

const streamingSites: ReadonlyArray<TokenSite> = [
  {
    token: "--bowman-accent-border",
    site: "the streaming avatar circle",
    property: "borderColor",
    locate: streamingCircle,
    act: ensureStreaming,
  },
  {
    token: "--bowman-accent-soft",
    site: "the streaming avatar circle",
    property: "backgroundColor",
    locate: streamingCircle,
    act: ensureStreaming,
  },
  {
    token: "--bowman-pulse-outline",
    site: "the pulse keyframe's 50% outline",
    property: "outlineColor",
    locate: streamingCircle,
    act: ensurePausedAtHalf,
  },
  {
    token: "--bowman-accent-glow",
    site: "the pulse keyframe's 50% shadow",
    property: "boxShadow",
    locate: streamingCircle,
    act: ensurePausedAtHalf,
    ignoresScheme: true,
  },
];

const feedbackSites: ReadonlyArray<TokenSite> = [
  {
    token: "--bowman-success",
    site: "the selected thumbs-up",
    property: "color",
    locate: (page) => feedbackButton(page, chatMessageListLabels.feedbackPositive),
    act: click,
  },
  {
    token: "--bowman-success-soft",
    site: "the selected thumbs-up",
    property: "backgroundColor",
    locate: (page) => feedbackButton(page, chatMessageListLabels.feedbackPositive),
  },
  {
    token: "--bowman-danger",
    site: "the selected thumbs-down",
    property: "color",
    locate: (page) => feedbackButton(page, chatMessageListLabels.feedbackNegative),
    act: click,
  },
  {
    token: "--bowman-danger-soft",
    site: "the selected thumbs-down",
    property: "backgroundColor",
    locate: (page) => feedbackButton(page, chatMessageListLabels.feedbackNegative),
  },
  {
    token: "--bowman-success",
    site: "the copied check mark",
    property: "color",
    locate: (page) =>
      lastAssistantArticle(page)
        .getByRole("button", { name: chatMessageListLabels.copied })
        .locator("svg"),
    act: (_check, page) => copyButtonOf(page).click(),
  },
];

const siteGroups: ReadonlyArray<{ title: string; sites: ReadonlyArray<TokenSite> }> = [
  {
    title:
      "at rest, the active row, the composer, the brand row, the nav item, the disclosure and the copy button paint their tokens",
    sites: restSites,
  },
  {
    title: "the send button paints its tokens disabled, enabled and hovered",
    sites: sendButtonSites,
  },
  {
    title:
      "the hovered row, the hovered copy button and the hovered delete button paint their hover tokens",
    sites: hoverSites,
  },
  {
    title:
      "the focused row link's ring and offset and the focused composer's glow paint their tokens",
    sites: focusSites,
  },
  {
    title: "the streaming avatar circle and its pulse keyframe paint their tokens",
    sites: streamingSites,
  },
  {
    title: "the selected thumbs and the copied check mark paint their semantic tokens",
    sites: feedbackSites,
  },
];

const chatSites = siteGroups.flatMap((group) => group.sites);

const themeRuns: ReadonlyArray<ThemeRun> = [
  {
    title: "the default chat screen",
    url: "/?view=chat",
    themeName: defaultThemeName,
    values: declaredFallbacks,
    scheme: "light",
  },
  {
    title: "the default chat screen under the dark scheme",
    url: "/?view=chat",
    themeName: defaultThemeName,
    values: declaredFallbacks,
    scheme: "dark",
  },
  {
    title: "the Copperline Bicycles chat screen",
    url: themedChatUrl,
    themeName: copperlineThemeName,
    values: copperlineValues,
    scheme: "light",
  },
  {
    title: "the Copperline Bicycles chat screen under the dark scheme",
    url: themedChatUrl,
    themeName: copperlineThemeName,
    values: copperlineValues,
    scheme: "dark",
  },
];

const assistantEntryCount = initialEntriesByConversation[conversations[0].id].filter(
  (entry) => entry.role === "assistant"
).length;

test("the chat matrix reaches every token the installed stylesheet declares, and the wrapper sets the same set", () => {
  const declared = [...declaredFallbacks.keys()].sort();

  expect(tokensMeasuredBy(chatSites)).toEqual(declared);
  expect([...copperlineValues.keys()].sort()).toEqual(declared);
});

for (const run of themeRuns) {
  test.describe(run.title, () => {
    test.use({ colorScheme: run.scheme });

    for (const group of siteGroups) {
      test(group.title, async ({ page }) => {
        await page.goto(run.url);

        for (const site of group.sites) {
          await expectSite(page, run, site);
        }
      });
    }

    test("the sidebar names the theme and the chainring mark fills every assistant circle inside the wrapper alone", async ({
      page,
    }) => {
      await page.goto(run.url);

      await expect(page.getByRole("complementary").getByText(run.themeName)).toBeVisible();
      await expect(page.locator("[data-theme-mark]")).toHaveCount(
        run.values === copperlineValues ? assistantEntryCount : 0
      );
    });
  });
}

test.describe("the theme query", () => {
  test("a prototype name as the theme value still resolves to the default theme", async ({
    page,
  }) => {
    await page.goto("/?view=chat&theme=constructor");

    await expect(page.getByRole("complementary").getByText(defaultThemeName)).toBeVisible();
    await expect(page.locator("[data-theme-mark]")).toHaveCount(0);
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
    const copperAccent = await serialisedColor(
      page,
      declaredValue(copperlineValues, "--bowman-accent")
    );
    // Both buttons carry transition-colors, so every read polls past the fade.
    const defaultButton = await enabledSendButton(defaultPreview);
    const customButton = await enabledSendButton(customPreview);

    await expect.poll(() => backgroundOf(defaultButton), { timeout: pollWindowMs }).toBe(blue500);
    await expect
      .poll(() => backgroundOf(customButton), { timeout: pollWindowMs })
      .toBe(copperAccent);
    expect(blue500).not.toBe(copperAccent);
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
    const copperBorder = await serialisedColor(
      page,
      declaredValue(copperlineValues, "--bowman-accent-border"),
      "borderColor"
    );
    const copperSoft = await serialisedColor(
      page,
      declaredValue(copperlineValues, "--bowman-accent-soft")
    );

    expect(await borderColorOf(defaultCircle)).toBe(blue200);
    expect(await backgroundOf(defaultCircle)).toBe(blue50);
    expect(await borderColorOf(customCircle)).toBe(copperBorder);
    expect(await backgroundOf(customCircle)).toBe(copperSoft);
  });
});
