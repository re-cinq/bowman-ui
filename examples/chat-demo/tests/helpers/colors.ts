// Colour reads shared by the theming and docs suites. A probe element painted with the value
// under test - a palette variable or a literal - gives this engine's own serialisation of that
// colour, so a token site is compared to what the engine prints, never to a pinned oklch string.

import { expect, type Locator, type Page } from "@playwright/test";

export type ColorProperty = "backgroundColor" | "borderColor" | "color" | "outlineColor";

export type StyleProperty =
  ColorProperty | "boxShadow" | "opacity" | "animationName" | "transitionDuration" | "textOverflow";

export const transparent = "rgba(0, 0, 0, 0)";

export const styleOf = (locator: Locator, property: StyleProperty): Promise<string> =>
  locator.evaluate((element, name) => getComputedStyle(element)[name], property);

const paintProbe = (page: Page, property: StyleProperty, value: string): Promise<string> =>
  page.evaluate(
    ([styleProperty, styleValue]) => {
      const probe = document.createElement("div");

      probe.style[styleProperty] = styleValue;
      document.body.append(probe);
      const computed = getComputedStyle(probe)[styleProperty];

      probe.remove();

      return computed;
    },
    [property, value] as const
  );

// The transparent guard catches a palette variable the consumer build dropped from :root; for a
// text colour that fell back to inherit, the caller's expected-shade assertion catches it.
export const serialisedColor = async (
  page: Page,
  cssValue: string,
  property: ColorProperty = "backgroundColor"
): Promise<string> => {
  const computed = await paintProbe(page, property, cssValue);

  if (cssValue.startsWith("var(")) {
    expect(computed, `the consumer build must emit ${cssValue} into :root`).not.toBe(transparent);
  }

  return computed;
};

export const computedPaletteColor = (
  page: Page,
  variable: string,
  property: ColorProperty = "backgroundColor"
): Promise<string> => serialisedColor(page, `var(${variable})`, property);

// A colour inside a box-shadow list: the probe paints it as a one-pixel ring and the lengths are
// stripped, leaving exactly what the engine prints for that colour inside a shadow.
export const serialisedShadowColor = async (page: Page, cssValue: string): Promise<string> =>
  (await paintProbe(page, "boxShadow", `0 0 0 1px ${cssValue}`))
    .replace(/\s*-?\d+(\.\d+)?px/g, "")
    .trim();

export const backgroundOf = (locator: Locator): Promise<string> =>
  styleOf(locator, "backgroundColor");

export const borderColorOf = (locator: Locator): Promise<string> => styleOf(locator, "borderColor");

export const textColorOf = (locator: Locator): Promise<string> => styleOf(locator, "color");

export const boxShadowOf = (locator: Locator): Promise<string> => styleOf(locator, "boxShadow");
