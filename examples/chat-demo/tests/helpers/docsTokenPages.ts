// The documentation pages' token sites, shared by docs.spec.ts, which measures them on their pages
// under both schemes, and theming.spec.ts, whose coverage test counts them with the chat matrix.
// The locators here are the docs pages' own, so the two suites cannot disagree about a site.

import type { Locator, Page } from "@playwright/test";
import {
  defaultAppSidebarLabels,
  defaultChatMessageLabels,
  defaultConversationListLabels,
  defaultErrorBoundaryLabels,
  defaultThinkingIndicatorLabels,
  defaultToolActivityLabels,
} from "@re-cinq/bowman-ui";
import { docsLabels } from "../../src/docs-labels";
import { searchFieldLabels } from "../../src/labels";
import {
  declaredFallbacks,
  focus,
  hover,
  type ColorScheme,
  type ThemeRun,
  type TokenSite,
  type TokenValues,
} from "./tokens";

export const docsUrl = (componentId: string): string => `/?view=docs&component=${componentId}`;

export const variantOf = (page: Page, id: string): Locator =>
  page.locator(`[data-doc-variant="${id}"]`);

const alertOf = (page: Page): Locator => page.getByRole("alert").first();

// The example's field is the first searchbox on its page; the variants follow it.
const searchInputOf = (page: Page): Locator =>
  page.getByRole("searchbox", { name: searchFieldLabels.searchInput }).first();

// The docs shell carries a nav of its own, so the example's is the one inside main.
export const exampleNavOf = (page: Page): Locator =>
  page.getByRole("main").getByRole("navigation", { name: defaultAppSidebarLabels.mainNavigation });

export const exampleListOf = (page: Page): Locator =>
  page.getByRole("list", { name: defaultConversationListLabels.conversations }).first();

export const throwButtons = (page: Page): Locator =>
  page.getByRole("button", { name: "Throw during render" });

export interface DocsTokenPage {
  componentId: string;
  sites: ReadonlyArray<TokenSite>;
}

// A danger fill at rest, its text, and the fill again once hovered: one act serves the two after it.
const dangerFillSites = (site: string, locate: TokenSite["locate"]): TokenSite[] => [
  { token: "--bowman-danger-fill", site, property: "backgroundColor", locate },
  { token: "--bowman-text-on-danger", site: `${site}'s text`, property: "color", locate },
  {
    token: "--bowman-danger-fill-hover",
    site: `the hovered ${site.replace(/^the /, "")}`,
    property: "backgroundColor",
    locate,
    act: hover,
  },
];

// A Notice tone colours its icon through currentColor and its left border; the other three sides
// keep --bowman-border, so the container's borderColor lists four colours and the left one is read.
const toneSites = (variant: string, token: string, role: "status" | "alert"): TokenSite[] => {
  const live = (page: Page): Locator => variantOf(page, variant).getByRole(role).first();

  return [
    {
      token,
      site: `the ${variant} figure's ${role} icon`,
      property: "color",
      locate: (page) => live(page).locator("svg"),
    },
    {
      token,
      site: `the ${variant} figure's ${role} left border`,
      property: "borderLeftColor",
      locate: (page) => live(page).locator(".."),
    },
  ];
};

const themedWrapperOf = (page: Page): Locator =>
  variantOf(page, "themed").locator("[data-theme-wrapper]");

// Located inside the wrapper, so a panel that portalled past it is never found.
const themedPanelOf = (page: Page): Locator => themedWrapperOf(page).getByRole("alertdialog");

// The token sites the documentation pages add to the chat matrix in theming.spec.ts: the danger
// family on the error icon, the thinking dots and every text tier at a site the chat has none of,
// and the danger fill and the info and warning tones, which the chat screen has no honest place for.
export const docsTokenPages: ReadonlyArray<DocsTokenPage> = [
  {
    componentId: "confirm-dialog",
    sites: dangerFillSites("the danger Button", (page) =>
      variantOf(page, "danger-button").getByRole("button")
    ),
  },
  {
    componentId: "notice",
    sites: [
      ...toneSites("default", "--bowman-info", "status"),
      ...toneSites("warning", "--bowman-warning", "alert"),
    ],
  },
  {
    componentId: "error-boundary",
    sites: [
      {
        token: "--bowman-danger",
        site: "the error icon glyph",
        property: "color",
        locate: (page) => alertOf(page).locator("svg"),
        act: (_glyph, page) => throwButtons(page).first().click(),
      },
      {
        token: "--bowman-danger-soft",
        site: "the error icon circle",
        property: "backgroundColor",
        locate: (page) => alertOf(page).locator("svg").locator(".."),
      },
      {
        token: "--bowman-text-strong",
        site: "the error heading",
        property: "color",
        locate: (page) => alertOf(page).getByRole("heading", { level: 2 }),
      },
      {
        token: "--bowman-text-secondary",
        site: "the error description",
        property: "color",
        locate: (page) => alertOf(page).getByText(defaultErrorBoundaryLabels.description),
      },
    ],
  },
  {
    componentId: "thinking-indicator",
    sites: [
      {
        token: "--bowman-accent",
        site: "a thinking dot",
        property: "backgroundColor",
        locate: (page) => page.locator(".bowman-fade-dot").first(),
        ignoresScheme: true,
      },
      {
        token: "--bowman-accent-border",
        site: "the indicator's circle",
        property: "borderColor",
        locate: (page) => page.locator(".bowman-pulse-subtle").first(),
      },
      {
        token: "--bowman-accent-soft",
        site: "the indicator's circle",
        property: "backgroundColor",
        locate: (page) => page.locator(".bowman-pulse-subtle").first(),
      },
      {
        token: "--bowman-text-muted",
        site: "the thinking label",
        property: "color",
        locate: (page) =>
          page
            .getByRole("status", { name: defaultThinkingIndicatorLabels.thinkingRegion })
            .first()
            .getByText(defaultThinkingIndicatorLabels.thinking),
      },
    ],
  },
  {
    componentId: "tool-activity",
    sites: [
      {
        token: "--bowman-text-muted",
        site: "the tool headline",
        property: "color",
        locate: (page) =>
          variantOf(page, "default").getByText(defaultToolActivityLabels.activityDone),
      },
      {
        token: "--bowman-text-secondary",
        site: "the tool name",
        property: "color",
        locate: (page) => variantOf(page, "tool-name").locator("code"),
      },
      {
        token: "--bowman-text-body",
        site: "the expanded arguments",
        property: "color",
        locate: (page) => variantOf(page, "tool-input").locator("pre"),
      },
    ],
  },
  {
    componentId: "thinking-trace",
    sites: [
      {
        token: "--bowman-text-muted",
        site: "the trace summary",
        property: "color",
        locate: (page) => variantOf(page, "expanded").locator("summary"),
      },
      {
        token: "--bowman-text-secondary",
        site: "the expanded trace content",
        property: "color",
        locate: (page) => variantOf(page, "expanded").locator("details > div"),
      },
    ],
  },
  {
    componentId: "search-field",
    sites: [
      {
        token: "--bowman-surface",
        site: "the search input",
        property: "backgroundColor",
        locate: searchInputOf,
      },
      {
        token: "--bowman-border",
        site: "the search input",
        property: "borderColor",
        locate: searchInputOf,
      },
      {
        token: "--bowman-text-strong",
        site: "the search input",
        property: "color",
        locate: searchInputOf,
      },
      {
        token: "--bowman-text-subtle",
        site: "the search icon",
        property: "color",
        locate: (page) => searchInputOf(page).locator("..").locator("svg"),
      },
      {
        token: "--bowman-focus-ring",
        site: "the focused search input's ring",
        property: "boxShadow",
        locate: searchInputOf,
        act: focus,
      },
    ],
  },
  {
    componentId: "conversation-list",
    sites: [
      {
        token: "--bowman-text-body",
        site: "a row title",
        property: "color",
        locate: (page) => exampleListOf(page).locator('[aria-current="page"] span').first(),
      },
      {
        token: "--bowman-text-muted",
        site: "a row timestamp",
        property: "color",
        locate: (page) => exampleListOf(page).getByText("today 09:14"),
      },
      {
        token: "--bowman-text-subtle",
        site: "the empty-state hint",
        property: "color",
        locate: (page) =>
          variantOf(page, "empty").getByText(defaultConversationListLabels.noConversations),
      },
    ],
  },
  {
    componentId: "app-sidebar",
    sites: [
      {
        token: "--bowman-active",
        site: "the active nav item",
        property: "backgroundColor",
        locate: (page) => exampleNavOf(page).getByRole("button", { name: "Chat" }),
      },
      {
        token: "--bowman-text-strong",
        site: "the active nav item",
        property: "color",
        locate: (page) => exampleNavOf(page).getByRole("button", { name: "Chat" }),
      },
      {
        token: "--bowman-text-body",
        site: "the brand row",
        property: "color",
        locate: (page) =>
          page.getByRole("main").getByRole("complementary").first().getByText("Marginalia Books"),
      },
      {
        token: "--bowman-text-secondary",
        site: "the inactive nav item",
        property: "color",
        locate: (page) => exampleNavOf(page).getByRole("button", { name: "Settings" }),
      },
      {
        token: "--bowman-surface-hover",
        site: "the hovered inactive nav item",
        property: "backgroundColor",
        locate: (page) => exampleNavOf(page).getByRole("button", { name: "Settings" }),
        act: hover,
      },
      {
        token: "--bowman-text-strong",
        site: "the hovered inactive nav item",
        property: "color",
        locate: (page) => exampleNavOf(page).getByRole("button", { name: "Settings" }),
      },
    ],
  },
  {
    componentId: "chat-message",
    sites: [
      {
        token: "--bowman-text-strong",
        site: "the message body",
        property: "color",
        locate: (page) => variantOf(page, "markdown").getByRole("article"),
      },
      {
        token: "--bowman-text-secondary",
        site: "the assistant name",
        property: "color",
        locate: (page) => variantOf(page, "named").getByText("Marginalia Orders"),
      },
      {
        token: "--bowman-control-hover",
        site: "the hovered thumbs-up",
        property: "backgroundColor",
        locate: (page) =>
          variantOf(page, "markdown").getByRole("button", {
            name: defaultChatMessageLabels.feedbackPositive,
          }),
        act: hover,
      },
      {
        token: "--bowman-focus-ring",
        site: "the focused article's ring",
        property: "boxShadow",
        locate: (page) => variantOf(page, "markdown").getByRole("article"),
        act: focus,
      },
    ],
  },
];

export const docsRun = (
  scheme: ColorScheme,
  url: string,
  values: TokenValues = declaredFallbacks
): ThemeRun => ({
  title: "the documentation pages",
  url,
  themeName: docsLabels.title,
  values,
  scheme,
});

// The wrapper-theme run: the themed variants sit in a page-local .custom-theme wrapper, and the
// ConfirmDialog portals into it through container, so its panel paints the wrapper's tokens.
export const docsThemedPages: ReadonlyArray<DocsTokenPage> = [
  {
    componentId: "confirm-dialog",
    sites: [
      {
        token: "--bowman-surface",
        site: "the themed panel",
        property: "backgroundColor",
        locate: themedPanelOf,
        act: (_panel, page) => themedWrapperOf(page).getByRole("button").first().click(),
      },
      {
        token: "--bowman-text-body",
        site: "the themed panel's description",
        property: "color",
        locate: (page) => themedPanelOf(page).locator("p"),
      },
      {
        token: "--bowman-text-strong",
        site: "the themed panel's heading",
        property: "color",
        locate: (page) => themedPanelOf(page).getByRole("heading"),
      },
      ...dangerFillSites("the themed confirm button", (page) =>
        themedPanelOf(page).locator('button[type="submit"]')
      ),
    ],
  },
  {
    componentId: "notice",
    sites: [
      ...toneSites("themed", "--bowman-info", "status"),
      ...toneSites("themed", "--bowman-warning", "alert"),
    ],
  },
];
