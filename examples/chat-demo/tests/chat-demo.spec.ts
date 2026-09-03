import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  appShellLabels,
  chatComposerLabels,
  chatMessageListLabels,
  toastCopiedMessage,
} from "../src/labels";
import { streamedReplyText } from "../src/fixtures";
import { streamStepCount } from "../src/streaming";
import { staticDemoNote } from "../src/staticDemoNote";

const aiDisclosure = chatMessageListLabels.aiDisclosure;
const fixtureReplyText = "This is a canned demo reply from a fixture.";
const streamCommitTimeoutMs = 20_000;

const lastAssistantArticle = (page: Page): Locator =>
  page.getByRole("article", { name: chatMessageListLabels.assistantMessage }).last();

const send = async (page: Page, question: string): Promise<void> => {
  const composer = page.getByRole("textbox", { name: chatComposerLabels.composerInput });

  await composer.fill(question);
  await composer.press("Enter");
};

test.describe("full screen structure", () => {
  test("renders sidebar, navigation, conversations, transcript and composer by role", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    await expect(page.getByRole("complementary")).toHaveCount(1);
    const navigation = page.getByRole("navigation", { name: "Main navigation" });

    await expect(navigation).toHaveCount(1);
    await expect(navigation.getByRole("button")).toHaveCount(2);

    const conversationList = page.getByRole("list", { name: "Conversations" });

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
    await page.goto("/?view=chat");

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
    await page.goto("/?view=chat");

    const question = "Can I get a receipt for the delivery change?";

    await send(page, question);

    const userArticles = page.getByRole("article", { name: chatMessageListLabels.userMessage });

    await expect(userArticles).toHaveCount(5);
    await expect(userArticles.last()).toContainText(question);

    await expect(
      page.getByRole("article", { name: chatMessageListLabels.assistantMessage })
    ).toHaveCount(5);
    await expect(page.getByText(fixtureReplyText)).toBeVisible({ timeout: streamCommitTimeoutMs });
  });
});

// re-cinq/Otto#97: the reply the assistive-technology pass listens to. The
// demo grows the last entry over 24 timed steps, so a screen reader has a
// real streaming answer to announce (or not) rather than one array push.
test.describe("streamed assistant reply", () => {
  test("the reply text is longer at 2.6s than at 0.9s and the full canned reply arrives", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    await send(page, "Can I move my delivery to next week?");

    const reply = lastAssistantArticle(page);

    await expect(reply).toBeVisible();

    await page.waitForTimeout(900);
    const firstSample = (await reply.innerText()).length;

    await page.waitForTimeout(1700);
    const secondSample = (await reply.innerText()).length;

    expect(firstSample).toBeGreaterThan(0);
    expect(firstSample).toBeLessThan(streamedReplyText.length);
    expect(secondSample).toBeGreaterThan(firstSample);

    await expect(page.getByText(fixtureReplyText)).toBeVisible({ timeout: streamCommitTimeoutMs });
    await expect(reply).toContainText(streamedReplyText);
  });

  // Sampled inside the page, not across the wire: a slow round trip would
  // merge two steps into one observation and under-count a stream that really
  // did emit 24.
  test("the reply grows in at least 20 distinct steps spanning at least 3 seconds", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    await send(page, "How much does gift wrapping cost?");

    await expect(
      page.getByRole("article", { name: chatMessageListLabels.assistantMessage })
    ).toHaveCount(5);

    const observed = await page.evaluate(
      ({ selector, fullLength, timeoutMs }) =>
        new Promise<{ steps: number; spanMs: number }>((resolve) => {
          const lengths: number[] = [];
          const times: number[] = [];
          const finish = () => {
            clearInterval(interval);
            resolve({ steps: lengths.length, spanMs: (times.at(-1) ?? 0) - (times[0] ?? 0) });
          };
          const started = performance.now();
          const interval = setInterval(() => {
            const articles = document.querySelectorAll(selector);
            const article = articles[articles.length - 1];
            const length = (article?.textContent ?? "").length;
            const previous = lengths.at(-1);

            if (previous === undefined || length > previous) {
              lengths.push(length);
              times.push(performance.now());
            }

            if (length >= fullLength || performance.now() - started > timeoutMs) {
              finish();
            }
          }, 25);
        }),
      {
        selector: `article[aria-label="${chatMessageListLabels.assistantMessage}"]`,
        fullLength: streamedReplyText.length,
        timeoutMs: streamCommitTimeoutMs,
      }
    );

    expect(observed.steps).toBeGreaterThanOrEqual(20);
    expect(observed.steps).toBeLessThanOrEqual(streamStepCount + 2);
    expect(observed.spanMs).toBeGreaterThanOrEqual(3000);
  });
});

test.describe("copy toast", () => {
  test("copying an assistant entry shows the toast and it disappears on its own", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    await page.getByRole("button", { name: chatMessageListLabels.copy }).first().click();

    const toastPill = page
      .locator("div[aria-hidden='true']")
      .filter({ hasText: toastCopiedMessage });

    await expect(toastPill).toBeVisible();

    await expect(page.getByText(toastCopiedMessage)).toHaveCount(0, { timeout: 10_000 });
  });
});

test.describe("EU AI Act disclosure", () => {
  test("the disclosure is visible with entries present and cannot be scrolled away", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

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

  test("the disclosure is visible in the empty state", async ({ page }) => {
    await page.goto("/?view=chat");

    await page.getByRole("button", { name: "New conversation" }).click();
    await expect(page.getByText("How can we help you today?")).toBeVisible();
    await expect(page.getByText(aiDisclosure, { exact: true })).toBeVisible();
  });
});

test.describe("static demo note", () => {
  test("the static demo note is visible under the composer", async ({ page }) => {
    await page.goto("/?view=chat");

    await expect(page.locator("[data-static-demo-note]")).toContainText(staticDemoNote);
  });
});

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the drawer starts closed, traps focus and closes on Escape", async ({ page }) => {
    await page.goto("/?view=chat");

    await expect(page.getByRole("dialog")).toHaveCount(0);

    const hamburger = page.getByRole("button", { name: appShellLabels.openSidebar });

    await hamburger.click();
    const drawer = page.getByRole("dialog", { name: appShellLabels.sidebarDialog });

    await expect(drawer).toBeVisible();

    const lastFocusable = drawer.getByRole("button", { name: "Sign out of the demo" });

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
    Array.from({ length: count }, (_, index) => `Invented line ${index + 1} of ${count}`).join(
      "\n"
    );

  test("the empty composer measures above 0 and below the 200px cap", async ({ page }) => {
    await page.goto("/?view=chat");

    const baseline = await measuredHeight(composerOf(page));

    expect(
      baseline,
      "the empty composer on the Marginalia Books demo screen rendered with no measurable height"
    ).toBeGreaterThan(0);
    expect(baseline).toBeLessThan(200);
  });

  test("three Shift+Enter presses keep the draft, append no entry and grow the box", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    const composer = composerOf(page);
    const baseline = await measuredHeight(composer);

    const draft = "An invented draft about a delivery change";

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
    await page.goto("/?view=chat");
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
    await expect(userArticles.last()).toContainText("Invented line 24 of 24");
    await expect(composer).toHaveValue("");
    await expect.poll(() => measuredHeight(composer)).toBe(baseline);
  });
});
