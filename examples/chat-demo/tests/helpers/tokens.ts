// The theming-token matrix: which --bowman-* property a demo site paints, and what value the
// engine must print for it under a theme and a colour scheme. The expected values are read from
// the stylesheets themselves - the installed package's declaration block for the defaults and
// src/custom-theme.css for the Copperline Bicycles wrapper - so neither can drift from the test.

import { existsSync, readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";
import {
  boxShadowOf,
  serialisedColor,
  serialisedShadowColor,
  styleOf,
  type ColorProperty,
} from "./colors";

export type TokenValues = ReadonlyMap<string, string>;

const readTokenDeclarations = (path: URL, pattern: RegExp): TokenValues => {
  if (!existsSync(path)) {
    // The installed package is what the sweep measures against: run the suite through
    // `npm run consumer`, which packs and installs it, not `npx playwright test` on its own.
    throw new Error(`token declarations not found at ${path.pathname}; run npm run consumer`);
  }

  return new Map(
    Array.from(readFileSync(path, "utf8").matchAll(pattern), ([, name, value]) => [name, value])
  );
};

// One comment line per token in the installed dist/styles.css, its fallback before the " - ".
export const declaredFallbacks = readTokenDeclarations(
  new URL("../../node_modules/@re-cinq/bowman-ui/dist/styles.css", import.meta.url),
  /^\/\* (--bowman-[a-z-]+): (.+?) - /gm
);

export const copperlineValues = readTokenDeclarations(
  new URL("../../src/custom-theme.css", import.meta.url),
  /^\s*(--bowman-[a-z-]+): (.+);$/gm
);

export const declaredValue = (values: TokenValues, token: string): string => {
  const value = values.get(token);

  if (value === undefined) {
    throw new Error(`${token} is not declared`);
  }

  return value;
};

export type ColorScheme = "light" | "dark";

export interface ThemeRun {
  title: string;
  url: string;
  themeName: string;
  values: TokenValues;
  scheme: ColorScheme;
}

export interface TokenSite {
  token: string;
  site: string;
  property: ColorProperty | "boxShadow";
  locate: (page: Page, run: ThemeRun) => Locator;
  /** Hover, focus, click or send before the read; sites in a group run in order, so one act serves the sites after it. */
  act?: (locator: Locator, page: Page) => Promise<void>;
  /** The pulse keyframe and the thinking dots read the light token under both schemes: no dark: variant reaches them. */
  ignoresScheme?: boolean;
}

// Interaction-gated sites carry transition-colors and read mid-fade, so every read polls.
export const pollWindowMs = 10_000;

const schemeValue = (run: ThemeRun, site: TokenSite): string => {
  if (run.scheme === "light" || site.ignoresScheme) {
    return declaredValue(run.values, site.token);
  }

  return run.values.get(`${site.token}-dark`) ?? declaredValue(run.values, site.token);
};

const serialise = (page: Page, site: TokenSite, value: string): Promise<string> =>
  site.property === "boxShadow"
    ? serialisedShadowColor(page, value)
    : serialisedColor(page, value, site.property);

export const expectSite = async (page: Page, run: ThemeRun, site: TokenSite): Promise<void> => {
  const locator = site.locate(page, run);

  await site.act?.(locator, page);
  const light = declaredValue(run.values, site.token);
  const value = schemeValue(run, site);
  const expected = await serialise(page, site, value);
  const message = `${site.token} at ${site.site}`;

  if (value !== light) {
    expect(expected, `${message}: the -dark shade must differ from the light one`).not.toBe(
      await serialise(page, site, light)
    );
  }

  if (site.property === "boxShadow") {
    await expect
      .poll(() => boxShadowOf(locator), { message, timeout: pollWindowMs })
      .toContain(expected);

    return;
  }
  await expect
    .poll(() => styleOf(locator, site.property), { message, timeout: pollWindowMs })
    .toBe(expected);
};

export const hover = (locator: Locator): Promise<void> => locator.hover();

export const focus = (locator: Locator): Promise<void> => locator.focus();

export const click = (locator: Locator): Promise<void> => locator.click();

// The tokens a site list reaches: each light token, and its -dark twin where the scheme reaches it.
export const tokensMeasuredBy = (sites: ReadonlyArray<TokenSite>): string[] => {
  const measured = new Set<string>();

  for (const site of sites) {
    measured.add(site.token);

    if (!site.ignoresScheme && declaredFallbacks.has(`${site.token}-dark`)) {
      measured.add(`${site.token}-dark`);
    }
  }

  return [...measured].sort();
};
