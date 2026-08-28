import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  defaultAppShellLabels,
  defaultAppSidebarLabels,
  defaultChatComposerLabels,
  defaultChatMessageListLabels,
  defaultConversationListLabels,
} from "@re-cinq/bowman-ui";
import {
  appShellLabels,
  chatComposerLabels,
  chatMessageListLabels,
  toastCopiedMessage,
} from "../src/labels";

const aiDisclosure = chatMessageListLabels.aiDisclosure;
const fixtureReplyText = "Dette er et fast demosvar fra en fixture.";

const englishDefaultStrings = (): string[] => {
  const labelObjects: ReadonlyArray<Record<string, unknown>> = [
    defaultAppShellLabels,
    defaultAppSidebarLabels,
    defaultChatComposerLabels,
    defaultChatMessageListLabels,
    defaultConversationListLabels,
  ];
  const values: string[] = [];
  for (const labelObject of labelObjects) {
    for (const value of Object.values(labelObject)) {
      if (typeof value === "string") {
        values.push(value);
      }
      if (typeof value === "function") {
        values.push(String(value("")).trim());
      }
    }
  }
  return values;
};

const renderedStringCorpus = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const parts: string[] = [document.body.textContent ?? ""];
    const sweptAttributes = ["aria-label", "title", "alt", "placeholder"];
    for (const element of Array.from(document.querySelectorAll("*"))) {
      for (const attributeName of sweptAttributes) {
        const value = element.getAttribute(attributeName);
        if (value !== null) {
          parts.push(value);
        }
      }
    }
    return parts.join("\n");
  });

test.describe("full screen structure", () => {
  test("renders sidebar, navigation, conversations, transcript and composer by role", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("complementary")).toHaveCount(1);
    const navigation = page.getByRole("navigation", { name: "Hovednavigation" });
    await expect(navigation).toHaveCount(1);
    await expect(navigation.getByRole("button")).toHaveCount(2);

    const conversationList = page.getByRole("list", { name: "Samtaler" });
    await expect(conversationList.getByRole("listitem")).toHaveCount(3);

    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(
      page.getByRole("article", { name: chatMessageListLabels.userMessage })
    ).toHaveCount(4);
    await expect(
      page.getByRole("article", { name: chatMessageListLabels.assistantMessage })
    ).toHaveCount(4);
    await expect(
      page.getByRole("textbox", { name: chatComposerLabels.composerInput })
    ).toBeVisible();
  });

  test("the consumer Tailwind build scanned the installed dist", async ({ page }) => {
    await page.goto("/");

    const asideWidth = await page
      .getByRole("complementary")
      .evaluate((aside) => getComputedStyle(aside).width);
    expect(asideWidth).toBe("288px");
  });
});

test.describe("composing and replying", () => {
  test("Enter appends the typed user entry and the fixture assistant reply follows", async ({
    page,
  }) => {
    await page.goto("/");

    const question = "Kan jeg få en kvittering på ombookingen?";
    const composer = page.getByRole("textbox", { name: chatComposerLabels.composerInput });
    await composer.fill(question);
    await composer.press("Enter");

    const userArticles = page.getByRole("article", { name: chatMessageListLabels.userMessage });
    await expect(userArticles).toHaveCount(5);
    await expect(userArticles.last()).toContainText(question);

    await expect(
      page.getByRole("article", { name: chatMessageListLabels.assistantMessage })
    ).toHaveCount(5);
    await expect(page.getByText(fixtureReplyText)).toBeVisible();
  });
});

test.describe("copy toast", () => {
  test("copying an assistant entry shows the toast and it disappears on its own", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: chatMessageListLabels.copy }).first().click();

    const toastPill = page
      .locator("div[aria-hidden='true']")
      .filter({ hasText: toastCopiedMessage });
    await expect(toastPill).toBeVisible();

    await expect(page.getByText(toastCopiedMessage)).toHaveCount(0, { timeout: 10_000 });
  });
});

test.describe("EU AI Act disclosure", () => {
  test("the Danish disclosure is visible with entries present and cannot be scrolled away", async ({
    page,
  }) => {
    await page.goto("/");

    const disclosure = page.getByText(aiDisclosure, { exact: true });
    await expect(disclosure).toBeVisible();

    const transcript = page.getByRole("log");
    await expect(transcript).not.toContainText(aiDisclosure);

    await transcript.evaluate((region) => {
      region.scrollTop = region.scrollHeight;
    });
    await expect(disclosure).toBeInViewport();

    await transcript.evaluate((region) => {
      region.scrollTop = 0;
    });
    await expect(disclosure).toBeInViewport();
  });

  test("the Danish disclosure is visible in the empty state", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Ny samtale" }).click();
    await expect(page.getByText("Hvordan kan vi hjælpe dig i dag?")).toBeVisible();
    await expect(page.getByText(aiDisclosure, { exact: true })).toBeVisible();
  });
});

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("zero English: no default label string survives into the rendered document", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: appShellLabels.openSidebar }).click();
    await expect(page.getByRole("dialog", { name: appShellLabels.sidebarDialog })).toBeVisible();

    const corpus = await renderedStringCorpus(page);
    for (const englishDefault of englishDefaultStrings()) {
      expect(corpus, `English default "${englishDefault}" must not render`).not.toContain(
        englishDefault
      );
    }
  });

  test("the drawer starts closed, traps focus and closes on Escape", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("dialog")).toHaveCount(0);

    const hamburger = page.getByRole("button", { name: appShellLabels.openSidebar });
    await hamburger.click();
    const drawer = page.getByRole("dialog", { name: appShellLabels.sidebarDialog });
    await expect(drawer).toBeVisible();

    const lastFocusable = drawer.getByRole("button", { name: "Log ud af demoen" });
    await lastFocusable.focus();
    await page.keyboard.press("Tab");
    await expect(drawer.getByRole("button", { name: appShellLabels.closeSidebar })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(hamburger).toBeFocused();
  });
});

test.describe("composer auto-resize", () => {
  const composerOf = (page: Page): Locator =>
    page.getByRole("textbox", { name: chatComposerLabels.composerInput });

  const measuredHeight = (composer: Locator): Promise<number> =>
    composer.evaluate((textarea) => textarea.getBoundingClientRect().height);

  const inventedLines = (count: number): string =>
    Array.from({ length: count }, (_, index) => `Opdigtet linje ${index + 1} af ${count}`).join(
      "\n"
    );

  test("the empty composer measures above 0 and below the 200px cap", async ({ page }) => {
    await page.goto("/");

    const baseline = await measuredHeight(composerOf(page));
    expect(
      baseline,
      "the empty composer on the Havkat Rejser demo screen rendered with no measurable height"
    ).toBeGreaterThan(0);
    expect(baseline).toBeLessThan(200);
  });

  test("three Shift+Enter presses keep the draft, append no entry and grow the box", async ({
    page,
  }) => {
    await page.goto("/");
    const composer = composerOf(page);
    const baseline = await measuredHeight(composer);

    const draft = "En opdigtet kladde om en ombooking";
    await composer.fill(draft);
    await expect(page.getByRole("button", { name: chatComposerLabels.send })).toBeEnabled();
    await composer.press("Shift+Enter");
    await composer.press("Shift+Enter");
    await composer.press("Shift+Enter");

    await expect(composer).toHaveValue(`${draft}\n\n\n`);
    await expect(
      page.getByRole("article", { name: chatMessageListLabels.userMessage })
    ).toHaveCount(4);
    expect(await measuredHeight(composer)).toBeGreaterThan(baseline);
  });

  test("a twelve-line fill caps the box at exactly 200px, the draft scrolls, and Enter sends and restores the baseline", async ({
    page,
  }) => {
    await page.goto("/");
    const composer = composerOf(page);
    const sendButton = page.getByRole("button", { name: chatComposerLabels.send });
    const baseline = await measuredHeight(composer);

    await composer.fill(inventedLines(12));
    await expect(sendButton).toBeEnabled();
    expect(await measuredHeight(composer)).toBe(200);

    await composer.fill(inventedLines(24));
    await expect(sendButton).toBeEnabled();
    expect(await measuredHeight(composer)).toBe(200);

    await composer.press("Shift+Enter");
    expect(await measuredHeight(composer)).toBe(200);
    const scrollState = await composer.evaluate((textarea) => ({
      scrollHeight: textarea.scrollHeight,
      clientHeight: textarea.clientHeight,
      scrollTop: textarea.scrollTop,
    }));
    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
    expect(scrollState.scrollTop).toBeGreaterThan(0);

    await composer.press("Enter");
    const userArticles = page.getByRole("article", { name: chatMessageListLabels.userMessage });
    await expect(userArticles).toHaveCount(5);
    await expect(userArticles.last()).toContainText("Opdigtet linje 24 af 24");
    await expect(composer).toHaveValue("");
    await expect.poll(() => measuredHeight(composer)).toBe(baseline);
  });
});
