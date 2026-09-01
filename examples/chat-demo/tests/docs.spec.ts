// The documentation view at "?view=docs". Deliberately thin: the chat screen's
// own suite in chat-demo.spec.ts is the behavioural proof, and this one asserts
// the second view mounts, that every documented component has a reachable page
// carrying the six sections, that the usage listing really is the example's own
// source, and that none of it leaks into the default screen.

import { expect, test, type Page } from "@playwright/test";
import { chatComposerLabels, docsLabels } from "../src/labels";

// Kept as a literal rather than imported: importing the docs registry would
// pull Vite's "?raw" specifiers into Playwright's transform, which resolves
// modules the way Node does.
const componentIds = [
  "chat-message",
  "chat-message-list",
  "tool-activity",
  "thinking-trace",
  "chat-composer",
  "thinking-indicator",
  "inline-thinking-indicator",
  "toast",
  "error-boundary",
  "conversation-list",
  "app-sidebar",
  "app-shell",
  "icons",
];

// The headings are uppercased in CSS, so innerText reports them uppercased and
// the comparison has to be case-insensitive.
const sectionTitles = async (page: Page): Promise<string[]> => {
  const titles = await page.locator("main h2").allInnerTexts();
  return titles.map((title) => title.toLowerCase());
};

test.describe("documentation index", () => {
  test("lists every component and links each one to its own page", async ({ page }) => {
    await page.goto("/?view=docs");

    await expect(page.getByRole("heading", { name: docsLabels.title, level: 1 })).toBeVisible();
    for (const componentId of componentIds) {
      await expect(page.locator(`[data-doc-index-entry="${componentId}"]`)).toHaveCount(1);
    }

    await page.locator('[data-doc-index-entry="tool-activity"]').click();
    await expect(page).toHaveURL(/component=tool-activity/);
    await expect(page.getByRole("heading", { name: "ToolActivity", level: 1 })).toBeVisible();
  });

  test("the overview page documents the hooks, markdown, labels and types", async ({ page }) => {
    await page.goto("/?view=docs&component=overview");

    await expect(page.locator("[data-doc-note]")).toHaveCount(11);
    await expect(page.locator('[data-doc-note="use-focus-trap"]')).toBeVisible();
    await expect(page.locator('[data-doc-note="chat-entry"]')).toBeVisible();
  });
});

test.describe("component pages", () => {
  test("every component page renders its purpose, import, usage, props and states", async ({
    page,
  }) => {
    for (const componentId of componentIds) {
      await page.goto(`/?view=docs&component=${componentId}`);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const titles = await sectionTitles(page);
      expect(titles, componentId).toContain(docsLabels.importHeading.toLowerCase());
      expect(titles, componentId).toContain(docsLabels.usage.toLowerCase());
      expect(titles, componentId).toContain(docsLabels.props.toLowerCase());
      await expect(page.locator("main table").first()).toBeVisible();
    }
  });

  // The point of the ?raw import: the listing under the live render is the
  // example file itself, not a hand-copied approximation of it.
  test("the usage listing is the example file's own source", async ({ page }) => {
    await page.goto("/?view=docs&component=chat-message");

    const listing = page.locator("main pre").nth(1);
    await expect(listing).toContainText('import { ChatMessage } from "@re-cinq/bowman-ui";');
    await expect(listing).toContainText("export function ChatMessageExample()");
    await expect(page.getByRole("article", { name: "Response from Havkat Support" })).toBeVisible();
  });

  test("the labels table renders the exported defaults, and the missing key is marked", async ({
    page,
  }) => {
    await page.goto("/?view=docs&component=chat-message-list");

    const labels = page.locator("main table").last();
    await expect(labels).toContainText("aiDisclosure");
    await expect(labels).toContainText(docsLabels.noDefault);
    await expect(labels).toContainText("Conversation");
  });

  test("the error boundary example catches the throw and the retry restores the child", async ({
    page,
  }) => {
    await page.goto("/?view=docs&component=error-boundary");

    const throwButtons = page.getByRole("button", { name: "Throw during render" });
    await throwButtons.first().click();

    const alert = page.getByRole("alert").first();
    await expect(alert).toBeVisible();
    await alert.getByRole("button").click();
    await expect(throwButtons.first()).toBeVisible();
  });
});

test.describe("the default screen", () => {
  test("no query parameter keeps the chat screen and renders no documentation", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("[data-doc-index-entry]")).toHaveCount(0);
    await expect(page.locator("[data-doc-variant]")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: chatComposerLabels.composerInput })).toHaveCount(
      1
    );
  });
});
