// The documentation view at "?view=docs". Deliberately thin: the chat screen's
// own suite in chat-demo.spec.ts is the behavioural proof, and this one asserts
// the second view mounts, that every documented component has a reachable page
// carrying the six sections, that the usage listing really is the example's own
// source, and that none of it leaks into the default screen.

import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  defaultAppShellLabels,
  defaultChatMessageLabels,
  defaultConfirmDialogLabels,
  defaultConversationListLabels,
  defaultNoticeLabels,
  defaultSearchFieldLabels,
  defaultThinkingIndicatorLabels,
  defaultToolActivityLabels,
} from "@re-cinq/bowman-ui";
import { chatComposerLabels, searchFieldLabels } from "../src/labels";
import { docsLabels } from "../src/docs-labels";
import { staticDemoNote } from "../src/staticDemoNote";
import { styleOf } from "./helpers/colors";
import {
  docsRun,
  docsThemedPages,
  docsTokenPages,
  docsUrl,
  exampleListOf,
  exampleNavOf,
  throwButtons,
  variantOf,
  type DocsTokenPage,
} from "./helpers/docsTokenPages";
import {
  copperlineValues,
  declaredFallbacks,
  expectSite,
  pollWindowMs,
  type ColorScheme,
  type TokenValues,
} from "./helpers/tokens";

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
  "search-field",
  "text-field",
  "dialog",
  "confirm-dialog",
  "notice",
  "key-value-list",
  "card",
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

const expectIndexRendered = async (page: Page): Promise<void> => {
  await expect(page.getByRole("heading", { name: docsLabels.title, level: 1 })).toBeVisible();

  for (const componentId of componentIds) {
    await expect(page.locator(`[data-doc-index-entry="${componentId}"]`)).toHaveCount(1);
  }
};

test.describe("documentation index", () => {
  test("bare / renders the index with the hero image and every component link", async ({
    page,
  }) => {
    await page.goto("/");

    const hero = page.locator("[data-hero-image]");

    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute("alt", /caching/i);
    const heroSrc = await hero.getAttribute("src");

    expect(
      heroSrc,
      "the hero src must be the Vite-hashed asset, proving it was imported not hardcoded"
    ).toMatch(/\/assets\/chat-hero[.-][\w-]+\.png$/);

    await expectIndexRendered(page);

    await expect(page.locator("[data-static-demo-note]")).toContainText(staticDemoNote);
  });

  test("?view=docs is an alias for the index and links each component to its own page", async ({
    page,
  }) => {
    await page.goto("/?view=docs");

    await expectIndexRendered(page);

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
    await expect(
      page.getByRole("article", { name: "Response from Marginalia Support" })
    ).toBeVisible();
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
  test("bare / renders the documentation and no chat composer", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("[data-doc-index-entry]").first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: chatComposerLabels.composerInput })).toHaveCount(
      0
    );
  });

  test("?view=chat reaches the chat fixture and renders no documentation", async ({ page }) => {
    await page.goto("/?view=chat");

    await expect(page.locator("[data-doc-index-entry]")).toHaveCount(0);
    await expect(page.locator("[data-doc-variant]")).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: chatComposerLabels.composerInput })).toHaveCount(
      1
    );
  });
});

// issue 151: the search field in a browser, where type="search" brings the engine's native
// clear control - a click on it must reach the controlled onChange with "". Escape does too in
// Chromium; WebKit's search input has no Escape-to-clear (issue 218), so there the value stays.
test.describe("the search field page", () => {
  test("typing narrows the example's count, the native clear control empties the field through onChange, and Escape does so in Chromium only", async ({
    page,
    browserName,
  }) => {
    await page.goto("/?view=docs&component=search-field");

    // The variants below the usage section render the same field; the example's is the one
    // sharing a wrapper with its summary line.
    const summary = page.getByText(/^Matching \d of 3 conversations$/);
    const input = summary
      .locator("..")
      .getByRole("searchbox", { name: searchFieldLabels.searchInput });

    await expect(summary).toHaveText("Matching 3 of 3 conversations");

    await input.fill("atlas");
    await expect(summary).toHaveText("Matching 1 of 3 conversations");

    // The cancel control sits at the end of the content box, about one em wide.
    const clearControl = await input.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        x: element.clientWidth - parseFloat(style.paddingRight) - parseFloat(style.fontSize) / 2,
        y: element.clientHeight / 2,
      };
    });

    await input.click({ position: clearControl });
    await expect(input, "the click must land on the engine's native cancel control").toHaveValue(
      ""
    );
    await expect(summary).toHaveText("Matching 3 of 3 conversations");

    await input.fill("first edition");
    await expect(summary).toHaveText("Matching 1 of 3 conversations");

    // WebKit's search input has no Escape-to-clear and the library adds none (issue 218).
    const escapeClears = browserName !== "webkit";

    await input.press("Escape");
    await expect(input).toHaveValue(escapeClears ? "" : "first edition");
    await expect(summary).toHaveText(
      escapeClears ? "Matching 3 of 3 conversations" : "Matching 1 of 3 conversations"
    );
  });
});

const settledTitle = "Gift wrapping for a first edition";

// Two matrices over the same sites helper: the defaults on every docs page, and the Copperline
// Bicycles values inside the ConfirmDialog and Notice pages' page-local .custom-theme wrapper,
// the docs view's stand-in for the chat screen's ?theme= parameter (decision 19 of issue 415).
const docsMatrices: ReadonlyArray<{
  describe: (scheme: ColorScheme) => string;
  title: (componentId: string) => string;
  values: TokenValues;
  pages: ReadonlyArray<DocsTokenPage>;
}> = [
  {
    describe: (scheme) => `the documentation pages' token sites under the ${scheme} scheme`,
    title: (componentId) => `the ${componentId} page paints its tokens`,
    values: declaredFallbacks,
    pages: docsTokenPages,
  },
  {
    describe: (scheme) => `the documentation pages' themed wrappers under the ${scheme} scheme`,
    title: (componentId) =>
      `the ${componentId} page's themed variant paints the wrapper's tokens inside the wrapper`,
    values: copperlineValues,
    pages: docsThemedPages,
  },
];

for (const scheme of ["light", "dark"] as const) {
  for (const matrix of docsMatrices) {
    test.describe(matrix.describe(scheme), () => {
      test.use({ colorScheme: scheme });

      for (const { componentId, sites } of matrix.pages) {
        test(matrix.title(componentId), async ({ page }) => {
          const run = docsRun(scheme, docsUrl(componentId), matrix.values);

          await page.goto(run.url);

          for (const site of sites) {
            await expectSite(page, run, site);
          }
        });
      }
    });
  }
}

test.describe("component states", () => {
  test("the tool activity variants render the safe headline, the pending tense, the opted-in name, the expanded JSON and the caller's sentences", async ({
    page,
  }) => {
    await page.goto(docsUrl("tool-activity"));

    const expectedTexts: ReadonlyArray<[string, string]> = [
      ["default", defaultToolActivityLabels.activityDone],
      ["pending", defaultToolActivityLabels.activity],
      ["tool-name", "lookup_stock"],
      ["tool-input", '"copies": 2'],
      ["describe-tool", "Looking up stock"],
      ["describe-tool", "Looked up stock"],
    ];

    for (const [variant, text] of expectedTexts) {
      await expect(variantOf(page, variant), variant).toContainText(text);
    }
    await expect(variantOf(page, "default")).not.toContainText("lookup_stock");
    await expect(variantOf(page, "tool-input").locator("details")).toHaveAttribute("open", "");
    await expect(variantOf(page, "tool-input").locator("pre")).toBeVisible();
  });

  test("the thinking trace stays collapsed until its summary is clicked, streams its dots in the summary, and the expanded variant is open", async ({
    page,
  }) => {
    await page.goto(docsUrl("thinking-trace"));

    const committed = variantOf(page, "committed");
    const content = committed.locator("details > div");

    await expect(content).toBeHidden();
    await committed.locator("summary").click();
    await expect(content).toBeVisible();
    await expect(content).toContainText("The customer asked about Friday");

    await expect(variantOf(page, "streaming").locator("summary .bowman-fade-dot")).toHaveCount(3);
    await expect(variantOf(page, "expanded").locator("details > div")).toBeVisible();
  });

  test("the chat message variants render the markdown table, the policy-allowed link, no action row while streaming, the named article and the footer", async ({
    page,
  }) => {
    await page.goto(docsUrl("chat-message"));

    const markdown = variantOf(page, "markdown");
    const link = markdown.getByRole("link", { name: /delivery terms/ });

    await expect(markdown.locator("table")).toContainText("Hardback");
    await expect(markdown.locator("strong")).toHaveText("11:00");
    await expect(link).toHaveAttribute("href", "https://example.invalid/terms");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toContainText(defaultChatMessageLabels.linkOpensInNewTab);
    await expect(markdown.getByRole("button", { name: defaultChatMessageLabels.copy })).toHaveCount(
      1
    );

    await expect(variantOf(page, "streaming").getByRole("button")).toHaveCount(0);
    await expect(
      variantOf(page, "named").getByRole("article", {
        name: defaultChatMessageLabels.assistantMessageFrom("Marginalia Orders"),
      })
    ).toBeVisible();
    await expect(variantOf(page, "footer")).toContainText("Source: an invented delivery term");
  });

  test("the chat message list variants render every role with its persona, the busy status with a pending tool row, and the empty greeting", async ({
    page,
  }) => {
    await page.goto(docsUrl("chat-message-list"));

    const conversation = variantOf(page, "conversation");

    await expect(conversation.getByRole("article")).toHaveCount(3);
    await expect(conversation.locator("details summary")).toHaveText("Reasoning");
    await expect(conversation).toContainText(defaultToolActivityLabels.activityDone);
    await expect(
      conversation.getByRole("article", {
        name: defaultChatMessageLabels.assistantMessageFrom("Marginalia Support"),
      })
    ).toBeVisible();

    const busy = variantOf(page, "busy");

    await expect(
      busy.getByRole("status", { name: defaultThinkingIndicatorLabels.thinkingRegion })
    ).toBeVisible();
    await expect(busy).toContainText(defaultToolActivityLabels.activity);

    await expect(variantOf(page, "empty")).toContainText("How can we help you today?");
    await expect(variantOf(page, "empty").getByRole("article")).toHaveCount(0);
  });

  test("the composer example takes a draft through the ref handle and reports the sent text, and the busy, disabled and grown variants show their states", async ({
    page,
  }) => {
    await page.goto(docsUrl("chat-composer"));

    const exampleComposer = page
      .getByRole("textbox", { name: chatComposerLabels.composerInput })
      .first();

    await page.getByRole("button", { name: "Fill the draft from outside" }).click();
    await expect(exampleComposer).toHaveValue("Move my delivery to Friday");
    await exampleComposer.press("Enter");
    await expect(page.getByText("Last sent: Move my delivery to Friday")).toBeVisible();
    await expect(exampleComposer).toHaveValue("");

    const busyFrame = variantOf(page, "busy").locator('[aria-busy="true"]');

    await expect(busyFrame).toHaveCount(1);
    expect(await styleOf(busyFrame, "animationName")).toBe("bowman-pulse-subtle");
    await expect(
      variantOf(page, "busy").getByRole("button", { name: chatComposerLabels.send })
    ).toBeDisabled();

    const disabledComposer = variantOf(page, "disabled").getByRole("textbox");

    await expect(disabledComposer).toBeDisabled();
    expect(await styleOf(disabledComposer.locator(".."), "animationName")).toBe("none");

    const heightOf = (locator: Locator): Promise<number> =>
      locator.evaluate((textarea) => textarea.getBoundingClientRect().height);
    const emptyHeight = await heightOf(variantOf(page, "empty").getByRole("textbox"));

    expect(await heightOf(variantOf(page, "grown").getByRole("textbox"))).toBeGreaterThan(
      emptyHeight
    );
  });

  test("the conversation list example moves the current mark on select, removes a row on delete, and the loading and empty variants render their states", async ({
    page,
  }) => {
    await page.goto(docsUrl("conversation-list"));

    const list = exampleListOf(page);
    const rows = list.getByRole("listitem");

    await expect(rows).toHaveCount(3);
    await list.getByRole("button", { name: /^Damaged copy/ }).click();
    await expect(rows.nth(1).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(rows.nth(0).locator('[aria-current="page"]')).toHaveCount(0);
    await expect(rows.nth(1)).toContainText("2");

    await list
      .getByRole("button", {
        name: defaultConversationListLabels.deleteConversation("Delivery change for MB-4821-XQ"),
      })
      .click();
    await expect(rows).toHaveCount(2);

    await expect(
      variantOf(page, "loading").getByRole("status", {
        name: defaultConversationListLabels.loadingConversations,
      })
    ).toBeVisible();
    await expect(variantOf(page, "empty")).toContainText(
      defaultConversationListLabels.noConversations
    );
  });

  // The typewriter runs only when a placeholder title is replaced by a real one; the example's
  // button is that producer. AT reads the settled title at once from the hidden span, while the
  // visible span fades the old characters out and the new ones in with text-overflow: clip.
  const settledRow = (page: Page): Locator =>
    exampleListOf(page).getByRole("button", { name: new RegExp(`^${settledTitle}`) });

  const visibleTitleOf = (page: Page): Locator =>
    settledRow(page).locator('span[aria-hidden="true"]');

  const settleTitle = async (page: Page): Promise<void> => {
    await page.getByRole("button", { name: "Give the new conversation its title" }).click();
    await expect(settledRow(page).locator(".bowman-sr-only")).toHaveText(settledTitle);
  };

  const characterOpacities = (visibleTitle: Locator): Promise<string[]> =>
    visibleTitle
      .locator("span")
      .evaluateAll((spans) => spans.map((span) => getComputedStyle(span).opacity));

  test("settling the placeholder title runs the typewriter: the visible title clips mid-animation and ends settled at the new title", async ({
    page,
  }) => {
    await page.goto(docsUrl("conversation-list"));
    await settleTitle(page);

    const visibleTitle = visibleTitleOf(page);

    await expect
      .poll(() => styleOf(visibleTitle, "textOverflow"), { timeout: pollWindowMs })
      .toBe("clip");
    await expect
      .poll(() => styleOf(visibleTitle, "textOverflow"), { timeout: pollWindowMs })
      .toBe("ellipsis");
    await expect(visibleTitle).toHaveText(settledTitle);
    // Each character fades over 100ms and the last one is still in flight when the text settles.
    await expect
      .poll(async () => [...new Set(await characterOpacities(visibleTitle))], {
        timeout: pollWindowMs,
      })
      .toEqual(["1"]);
  });

  test("under prefers-reduced-motion the settled title lands at once, every character opaque and nothing clipped", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(docsUrl("conversation-list"));
    await settleTitle(page);

    const visibleTitle = visibleTitleOf(page);

    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    expect(await visibleTitle.innerText()).toBe(settledTitle);
    expect(await styleOf(visibleTitle, "textOverflow")).toBe("ellipsis");
    expect(new Set(await characterOpacities(visibleTitle))).toEqual(new Set(["1"]));
  });

  test("the search field variants carry the filled value and the disabled state", async ({
    page,
  }) => {
    await page.goto(docsUrl("search-field"));

    await expect(variantOf(page, "filled").getByRole("searchbox")).toHaveValue("atlas");
    await expect(variantOf(page, "disabled").getByRole("searchbox")).toBeDisabled();
  });

  test("the sidebar example moves aria-current to the clicked nav item and draws an icon in each", async ({
    page,
  }) => {
    await page.goto(docsUrl("app-sidebar"));

    const nav = exampleNavOf(page);
    const chat = nav.getByRole("button", { name: "Chat" });
    const settings = nav.getByRole("button", { name: "Settings" });

    await expect(chat).toHaveAttribute("aria-current", "page");
    await expect(chat.locator("svg")).toHaveCount(1);
    await settings.click();
    await expect(settings).toHaveAttribute("aria-current", "page");
    await expect(chat).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Signed in as MV", { exact: true })).toBeVisible();
  });

  test("the shell example renders the desktop copy of its sidebar and the inline thinking indicator its label and dots", async ({
    page,
  }) => {
    await page.goto(docsUrl("app-shell"));
    await expect(page.getByText("this one is the desktop copy")).toBeVisible();
    await expect(page.getByText("this one is the mobile copy")).toBeHidden();

    await page.goto(docsUrl("inline-thinking-indicator"));
    await expect(page.getByText("Thinking").first()).toBeVisible();
    await expect(page.locator(".bowman-fade-dot")).toHaveCount(6);
  });

  test("the toast example shows the pill, announces the message in its live region, and dismisses itself", async ({
    page,
  }) => {
    await page.goto(docsUrl("toast"));

    // The usage listing prints the same string, so the pill and the live region are the targets.
    const message = "The reply was copied to the clipboard.";
    const pill = page.locator("div[aria-hidden='true']").filter({ hasText: message });
    const liveRegion = page.getByRole("status").filter({ hasText: message });

    await page.getByRole("button", { name: "Show a notification" }).click();
    await expect(pill).toBeVisible();
    await expect(liveRegion).toHaveText(message);
    await expect(pill).toHaveCount(0, { timeout: 4000 + 3000 });
    await expect(liveRegion).toHaveCount(0);
  });

  test("the consumer-supplied fallback replaces the built-in alert, retry button included", async ({
    page,
  }) => {
    await page.goto(docsUrl("error-boundary"));

    await throwButtons(page).nth(1).click();
    const fallback = variantOf(page, "custom-fallback").getByRole("alert");

    await expect(fallback).toContainText("A consumer-authored fallback");
    await expect(fallback.getByRole("button")).toHaveCount(0);
    await expect(throwButtons(page)).toHaveCount(1);
  });

  test("the icons page lists the whole set, every glyph aria-hidden beside its name", async ({
    page,
  }) => {
    await page.goto(docsUrl("icons"));

    const items = page.getByRole("main").locator("ul li");

    await expect(items).toHaveCount(24);
    await expect(items.locator("svg[aria-hidden='true']")).toHaveCount(24);
    await expect(items.filter({ hasText: "SendIcon" })).toHaveCount(1);
  });

  test("the back link on a component page returns to the index", async ({ page }) => {
    await page.goto(docsUrl("toast"));

    await page.getByRole("link", { name: docsLabels.backToIndex }).click();
    await expect(page).not.toHaveURL(/component=/);
    await expect(page.getByRole("heading", { name: docsLabels.title, level: 1 })).toBeVisible();
  });
});

// The form, dialog and notice pages (issue 415): what jsdom cannot show - implicit submission on
// Enter, the browser's focus fixup when a focused button turns disabled, and :focus-visible.
const openPanel = (page: Page): Locator => page.locator('[role="dialog"], [role="alertdialog"]');

const openFrom = async (page: Page, variant: string): Promise<Locator> => {
  await variantOf(page, variant).getByRole("button").first().click();
  const panel = openPanel(page);

  await expect(panel).toBeVisible();
  // The trap moves focus in from an effect after the panel paints; wait for it, so a test's own
  // focus move is never overtaken by the initial one.
  await expect
    .poll(() => panel.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);

  return panel;
};

const confirmationsOf = (page: Page, variant: string): Locator =>
  variantOf(page, variant).locator("[data-confirmations]");

test.describe("the form, dialog and notice pages", () => {
  test("Enter in a TextField among a ConfirmDialog's children confirms once and closes it", async ({
    page,
  }) => {
    await page.goto(docsUrl("confirm-dialog"));
    const panel = await openFrom(page, "with-field");
    const field = panel.getByRole("textbox");

    await expect(field).toBeFocused();
    await field.fill("Ordered the wrong edition");
    await field.press("Enter");
    await expect(openPanel(page)).toHaveCount(0);
    await expect(confirmationsOf(page, "with-field")).toHaveAttribute("data-confirmations", "1");
  });

  test("with confirmDisabled, Enter in the TextField does not confirm until the typed reference matches", async ({
    page,
  }) => {
    await page.goto(docsUrl("confirm-dialog"));
    const panel = await openFrom(page, "confirm-disabled");
    const field = panel.getByRole("textbox");

    await expect(field).toBeFocused();
    await field.fill("MB-4821");
    await field.press("Enter");
    await expect(panel.locator('button[type="submit"]')).toBeDisabled();
    await expect(panel).toBeVisible();
    await expect(confirmationsOf(page, "confirm-disabled")).toHaveAttribute(
      "data-confirmations",
      "0"
    );

    await field.fill("MB-4821-XQ");
    await field.press("Enter");
    await expect(openPanel(page)).toHaveCount(0);
    await expect(confirmationsOf(page, "confirm-disabled")).toHaveAttribute(
      "data-confirmations",
      "1"
    );
  });

  // Enter, not a click: WebKit on macOS does not focus a clicked button, so a click could leave
  // focus on the panel without the busy layout effect ever running.
  test("Enter on the focused confirm button turns the dialog busy and moves focus to the panel, never to <body>", async ({
    page,
  }) => {
    await page.goto(docsUrl("confirm-dialog"));
    const panel = await openFrom(page, "busy");
    const confirm = panel.locator('button[type="submit"]');

    await confirm.focus();
    await expect(confirm).toBeFocused();
    // A focusout with no relatedTarget is focus leaving for nothing - the browser's fixup to <body>.
    await page.evaluate(() => {
      const record = window as unknown as { focusLostToBody: number };

      record.focusLostToBody = 0;
      document.addEventListener(
        "focusout",
        (event) => {
          if (event.relatedTarget === null) {
            record.focusLostToBody += 1;
          }
        },
        true
      );
    });
    await page.keyboard.press("Enter");

    await expect(panel.getByRole("status")).toHaveText(defaultConfirmDialogLabels.confirmBusy);
    await expect(confirm).toBeDisabled();
    await expect(panel).toBeFocused();
    expect(
      await page.evaluate(() => (window as unknown as { focusLostToBody: number }).focusLostToBody)
    ).toBe(0);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  });

  test("clicking the default Dialog's prose focuses the panel and draws no ring", async ({
    page,
  }) => {
    await page.goto(docsUrl("dialog"));
    const panel = await openFrom(page, "default");

    await panel.getByText("Orders placed before 14:00").click();
    await expect(panel).toBeFocused();
    expect(await styleOf(panel, "boxShadow")).toBe("none");
  });

  test("the overflowing Dialog body is a named, focusable region that takes initial focus", async ({
    page,
  }) => {
    await page.goto(docsUrl("dialog"));
    const panel = await openFrom(page, "overflowing");
    const body = panel.getByRole("region", { name: "Returns terms" });

    await expect(body).toBeFocused();
    await expect(body).toHaveAttribute("tabindex", "0");
  });

  test("the themed ConfirmDialog portals into its wrapper, and closing returns focus to its trigger", async ({
    page,
  }) => {
    await page.goto(docsUrl("confirm-dialog"));
    const wrapper = variantOf(page, "themed").locator("[data-theme-wrapper]");
    const trigger = wrapper.getByRole("button").first();
    const panel = openPanel(page);

    // Opened from the keyboard: WebKit does not focus a clicked button, so a click leaves the trap
    // nothing to return focus to.
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(wrapper.getByRole("alertdialog")).toHaveCount(1);
    await expect(
      panel.getByRole("button", { name: defaultConfirmDialogLabels.cancelAction })
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(openPanel(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("dismissing the notice moves focus to the button that stays, which shows it again", async ({
    page,
  }) => {
    await page.goto(docsUrl("notice"));
    const figure = variantOf(page, "dismissible");
    const restore = figure.getByRole("button", { name: "Show the notice again" });

    await figure.getByRole("button", { name: defaultNoticeLabels.dismissNotice }).click();
    await expect(figure.getByRole("status")).toHaveCount(0);
    await expect(restore).toBeFocused();
    await restore.click();
    await expect(figure.getByRole("status")).toContainText("Draft saved");
  });

  test("the search field's on-submit variant runs the search on Enter and on its submit button", async ({
    page,
  }) => {
    await page.goto(docsUrl("search-field"));
    const figure = variantOf(page, "on-submit");
    const input = figure.getByRole("searchbox", { name: searchFieldLabels.searchInput });

    await input.press("Enter");
    await expect(figure).toContainText("Last search: atlas");
    await input.fill("first edition");
    await figure.getByRole("button", { name: defaultSearchFieldLabels.submitSearch }).click();
    await expect(figure).toContainText("Last search: first edition");
  });
});

// The docs shell at a phone width: the nav items are anchors through renderNavLink, so the
// drawer's link is a real navigation, not a click handler.
test.describe("the documentation drawer at a phone width", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the hamburger opens the drawer and a nav anchor loads that component's page", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: defaultAppShellLabels.openSidebar }).click();
    const drawer = page.getByRole("dialog", { name: defaultAppShellLabels.sidebarDialog });

    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "ToolActivity" }).click();
    await expect(page).toHaveURL(/component=tool-activity/);
    await expect(page.getByRole("heading", { name: "ToolActivity", level: 1 })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
