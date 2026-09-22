import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  appShellLabels,
  chatComposerLabels,
  chatMessageListLabels,
  conversationListLabels,
  toastCopiedMessage,
} from "../src/labels";
import { conversations, streamedReplyText } from "../src/fixtures";
import { streamStepCount, streamStepIntervalMs } from "../src/streaming";
import { staticDemoNote } from "../src/staticDemoNote";
import { toastDurationMs } from "../src/toastDuration";

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

// issue 97: the reply the assistive-technology pass listens to. The
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

    const clickedAt = Date.now();

    await page.getByRole("button", { name: chatMessageListLabels.copy }).first().click();

    const toastPill = page
      .locator("div[aria-hidden='true']")
      .filter({ hasText: toastCopiedMessage });

    await expect(toastPill).toBeVisible();

    await expect(page.getByText(toastCopiedMessage)).toHaveCount(0, {
      timeout: toastDurationMs + 3000,
    });

    // The countdown starts after the click, so it cannot end before toastDurationMs has
    // elapsed since clickedAt; the slack above bounds it from the other side.
    const shownForMs = Date.now() - clickedAt;

    expect(shownForMs).toBeGreaterThanOrEqual(toastDurationMs);
    expect(shownForMs).toBeLessThan(toastDurationMs + 2500);
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

    const geometry = await transcript.evaluate((region) => ({
      scrollHeight: region.scrollHeight,
      clientHeight: region.clientHeight,
    }));

    expect(
      geometry.scrollHeight,
      "the fixture must overflow the transcript, or the scrollTop writes below move nothing"
    ).toBeGreaterThan(geometry.clientHeight);

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

    // Anchored: the wired delete button's name also contains the title.
    await page.getByRole("button", { name: /^New conversation/ }).click();
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
    // The trap focuses the close button a frame after opening; focusing the last element
    // before that frame lets the trap's own focus land second and the Tab below move on past it.
    await expect(drawer.getByRole("button", { name: appShellLabels.closeSidebar })).toBeFocused();

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

// issue 132: a pasted token with no break opportunity must wrap inside the bubble.
test.describe("long unbroken strings", () => {
  test("a 300-character token sent from the composer does not widen the user article", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    const token = "a1b2c3".repeat(50);

    await send(page, token);
    const article = page.getByRole("article", { name: chatMessageListLabels.userMessage }).last();

    await expect(article).toContainText(token);
    await expect
      .poll(() => article.evaluate((element) => element.scrollWidth - element.clientWidth))
      .toBeLessThanOrEqual(0);
  });
});

// issue 131: a keyboard user who leaves the textarea for the send button must
// not land on body when the button disables itself after the send.
test.describe("focus after send", () => {
  test("Tab to send then Enter or Space appends the entry and returns focus to the textarea", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    const composer = page.getByRole("textbox", { name: chatComposerLabels.composerInput });
    const sendButton = page.getByRole("button", { name: chatComposerLabels.send });
    const userArticles = page.getByRole("article", { name: chatMessageListLabels.userMessage });

    await composer.fill("An invented question sent with Enter");
    await page.keyboard.press("Tab");
    await expect(sendButton).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(userArticles).toHaveCount(5);
    await expect(sendButton).toBeDisabled();
    await expect(composer).toBeFocused();

    await composer.fill("An invented question sent with Space");
    await page.keyboard.press("Tab");
    await expect(sendButton).toBeFocused();
    await page.keyboard.press("Space");

    await expect(userArticles).toHaveCount(6);
    await expect(sendButton).toBeDisabled();
    await expect(composer).toBeFocused();
  });
});

// issue 151: the pinned auto-scroll measured against real layout, not stubbed geometry.
test.describe("sticky scroll", () => {
  const unpinWindowMs = 2000;

  const transcriptOf = (page: Page): Locator => page.getByRole("log");

  const scrollTopOf = (transcript: Locator): Promise<number> =>
    transcript.evaluate((region) => region.scrollTop);

  const distanceFromBottom = (transcript: Locator): Promise<number> =>
    transcript.evaluate((region) => region.scrollHeight - region.scrollTop - region.clientHeight);

  const overflows = (transcript: Locator): Promise<boolean> =>
    transcript.evaluate((region) => region.scrollHeight > region.clientHeight);

  test("a reader who scrolls to the top mid-stream is still at the top when the reply commits", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    await send(page, "Can I move my delivery to next week?");

    const reply = lastAssistantArticle(page);
    const transcript = transcriptOf(page);

    await expect(reply).toBeVisible();
    await expect.poll(async () => (await reply.innerText()).length).toBeGreaterThan(0);
    expect(await overflows(transcript)).toBe(true);

    // A delta landing between the write and its scroll event re-pins the reader, so the
    // write repeats until it has held across two delta intervals - well inside the stream,
    // so the guard below still sees a reply in progress.
    await expect
      .poll(
        async () => {
          await transcript.evaluate((region) => {
            region.scrollTop = 0;
          });
          await page.waitForTimeout(2 * streamStepIntervalMs);

          return scrollTopOf(transcript);
        },
        { timeout: unpinWindowMs }
      )
      .toBe(0);
    expect((await reply.innerText()).length).toBeLessThan(streamedReplyText.length);

    await expect(page.getByText(fixtureReplyText)).toBeVisible({ timeout: streamCommitTimeoutMs });
    await expect(reply).toContainText(streamedReplyText);
    expect(await overflows(transcript)).toBe(true);
    expect(await scrollTopOf(transcript)).toBe(0);
  });

  test("a reader left at the bottom is still at the bottom when the reply commits", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    await send(page, "How much does gift wrapping cost?");

    const transcript = transcriptOf(page);

    await expect(page.getByText(fixtureReplyText)).toBeVisible({ timeout: streamCommitTimeoutMs });
    await expect(lastAssistantArticle(page)).toContainText(streamedReplyText);
    expect(await overflows(transcript)).toBe(true);
    await expect.poll(() => distanceFromBottom(transcript)).toBeLessThanOrEqual(1);
  });
});

// issue 151: the action rows are opacity-0 until the pointer hovers or focus enters the group,
// and the existing copy click succeeds on an invisible button, so the reveal is measured here.
test.describe("hover and focus reveal", () => {
  const opacityOf = (locator: Locator): Promise<string> =>
    locator.evaluate((element) => getComputedStyle(element).opacity);

  test("an assistant entry's action row is invisible at rest and revealed by hover or by focus", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const article = lastAssistantArticle(page);
    const copyButton = article.getByRole("button", { name: chatMessageListLabels.copy });
    const actionRow = copyButton.locator("..");

    await expect(copyButton).toHaveCount(1);
    expect(await opacityOf(actionRow)).toBe("0");

    await article.hover();
    await expect.poll(() => opacityOf(actionRow)).toBe("1");

    await page.mouse.move(0, 0);
    await expect.poll(() => opacityOf(actionRow)).toBe("0");

    await copyButton.focus();
    await expect.poll(() => opacityOf(actionRow)).toBe("1");

    await page.getByRole("textbox", { name: chatComposerLabels.composerInput }).focus();
    await expect.poll(() => opacityOf(actionRow)).toBe("0");
  });

  test("the current conversation's delete button is invisible at rest, revealed on focus, and Enter removes the row and moves the current mark", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const rows = page
      .getByRole("list", { name: conversationListLabels.conversations })
      .getByRole("listitem");
    const deleted = conversations[0];
    const successor = conversations[1];
    const deleteButton = page.getByRole("button", {
      name: conversationListLabels.deleteConversation(deleted.title),
    });

    await expect(rows).toHaveCount(3);
    await expect(
      rows.filter({ hasText: deleted.title }).locator('[aria-current="page"]')
    ).toHaveCount(1);
    expect(await opacityOf(deleteButton)).toBe("0");

    await deleteButton.focus();
    await expect.poll(() => opacityOf(deleteButton)).toBe("1");

    await page.keyboard.press("Enter");
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: deleted.title })).toHaveCount(0);
    await expect(
      rows.filter({ hasText: successor.title }).locator('[aria-current="page"]')
    ).toHaveCount(1);
  });
});

// issue 151: the skip link in a browser - Enter on it moves the sequential focus start into
// main, so <main> needs no tabIndex for the next Tab to land inside it.
test.describe("skip link", () => {
  test("Tab reaches the skip link first, and Enter on it sends the next Tab inside main", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    const skipLink = page.getByRole("link", { name: appShellLabels.skipToMainContent });

    await expect(
      page.getByRole("textbox", { name: chatComposerLabels.composerInput })
    ).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);

    await page.keyboard.press("Tab");
    await expect(skipLink).not.toBeFocused();
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("main")))).toBe(true);
  });
});

// issue 151: the trap's keydown listener outlives a rotate to desktop; with the drawer
// display:none it must let Tab walk the page rather than pull focus into a hidden dialog.
// Chromium keeps the sequential focus start at the hidden drawer, so Tab enters main.
test.describe("drawer open across a rotate to desktop", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  // The active element's position among main's focusable elements; -1 when focus is elsewhere.
  const focusedIndexInMain = (page: Page): Promise<number> =>
    page.evaluate(() => {
      const focusable = Array.from(
        document.querySelector("main")?.querySelectorAll("a, button, textarea, [tabindex]") ?? []
      );

      return focusable.findIndex((element) => element === document.activeElement);
    });

  test("after the viewport grows to desktop, three Tabs advance through main, never the drawer", async ({
    page,
  }) => {
    await page.goto("/?view=chat");
    await page.getByRole("button", { name: appShellLabels.openSidebar }).click();

    const drawer = page.getByRole("dialog", { name: appShellLabels.sidebarDialog });

    await expect(drawer.getByRole("button", { name: appShellLabels.closeSidebar })).toBeFocused();

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("complementary")).toBeVisible();

    let previousIndex = -1;

    for (let step = 0; step < 3; step += 1) {
      await page.keyboard.press("Tab");
      const index = await focusedIndexInMain(page);

      expect(index, `Tab ${step + 1} must move focus forward inside main`).toBeGreaterThan(
        previousIndex
      );
      previousIndex = index;
    }
    await expect(page.getByTestId("app-shell-drawer").locator(":focus")).toHaveCount(0);
  });
});

// issue 151: prefers-reduced-motion rendered, rather than asserted as CSS text or class strings.
test.describe("reduced motion", () => {
  const animationNameOf = (locator: Locator): Promise<string> =>
    locator.evaluate((element) => getComputedStyle(element).animationName);

  const transitionDurationOf = (locator: Locator): Promise<string> =>
    locator.evaluate((element) => getComputedStyle(element).transitionDuration);

  test("the thinking dots animate by default and stop under prefers-reduced-motion", async ({
    page,
  }) => {
    await page.goto("/?view=docs&component=thinking-indicator");

    const dot = page.locator(".bowman-fade-dot").first();

    await expect(dot).toHaveCount(1);
    expect(await animationNameOf(dot)).toBe("bowman-fade-dot");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => animationNameOf(dot)).toBe("none");
  });

  test("the drawer slides over 0.3s by default and has no transition under prefers-reduced-motion", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/?view=chat");

    const drawer = page.getByTestId("app-shell-drawer");

    await expect(drawer).toHaveCount(1);
    expect(await transitionDurationOf(drawer)).toBe("0.3s");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => transitionDurationOf(drawer)).toBe("0s");
  });
});
