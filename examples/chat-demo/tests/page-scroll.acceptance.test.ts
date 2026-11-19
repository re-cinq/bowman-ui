import { expect, test, type Page } from "@playwright/test";

async function assertPageDoesNotScroll(page: Page): Promise<void> {
  const isPageScrollable = await page.evaluate(() => {
    return document.documentElement.scrollHeight > document.documentElement.clientHeight;
  });

  expect(isPageScrollable).toBe(false);
}

test.describe("Page scroll leak", () => {
  test("ConversationList does not stretch the page when overflowing the sidebar", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    await expect(page.getByRole("navigation")).toBeVisible();

    // The demo has a known conversation list. We duplicate elements to overflow the sidebar.
    await page.evaluate(() => {
      const list = document.querySelector('ul[role="list"]');

      if (list && list.firstElementChild) {
        for (let i = 0; i < 30; i++) {
          const clone = list.firstElementChild.cloneNode(true);

          list.appendChild(clone);
        }
      }
    });

    await assertPageDoesNotScroll(page);
  });

  test("ChatMessageList does not stretch the page when overflowing the viewport", async ({
    page,
  }) => {
    await page.goto("/?view=chat");

    await expect(page.getByRole("log")).toBeVisible();

    // Duplicate chat messages to overflow the viewport
    await page.evaluate(() => {
      const log = document.querySelector('[role="log"]');

      if (log && log.lastElementChild) {
        for (let i = 0; i < 20; i++) {
          const clone = log.lastElementChild.cloneNode(true);

          log.appendChild(clone);
        }
      }
    });

    await assertPageDoesNotScroll(page);
  });
});
