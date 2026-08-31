import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ComponentType } from "react";

import * as icons from "../src/icons/index.js";
import type { IconProps } from "../src/icons/index.js";
import { getAccessibleIconProps } from "../src/icons/index.js";
import * as premove from "./fixtures/premove-icons.js";

const uniformIconNames = [
  "ArtifactsIcon",
  "ChatIcon",
  "CheckIcon",
  "ChevronDownIcon",
  "ChevronUpIcon",
  "CloseIcon",
  "CompareIcon",
  "CopyIcon",
  "DashboardIcon",
  "DatabaseIcon",
  "ErrorIcon",
  "InfoIcon",
  "MenuIcon",
  "PlusIcon",
  "RefreshIcon",
  "SearchIcon",
  "SendIcon",
  "SettingsIcon",
  "ThumbsDownIcon",
  "ThumbsUpIcon",
  "TrashIcon",
  "WarningIcon",
] as const;

const iconNames = [...uniformIconNames, "LoadingIcon"] as const;

type IconName = (typeof iconNames)[number];

const renderRootSvg = (Icon: ComponentType<IconProps>, props: IconProps = {}): SVGSVGElement => {
  const { container } = render(<Icon {...props} />);
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("no <svg> rendered");
  }
  return svg;
};

const attributeMap = (element: Element): Record<string, string> =>
  Object.fromEntries([...element.attributes].map((attr) => [attr.name, attr.value]));

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : [join(dir, entry.name)]
  );

describe("the icon set inventory", () => {
  it("exports exactly the 23 icon components plus IconWrapper and getAccessibleIconProps", () => {
    expect(Object.keys(icons).sort()).toEqual(
      [...iconNames, "IconWrapper", "getAccessibleIconProps"].sort()
    );
  });

  it("declares the 22 uniform icons as createUniformIcon calls over one IconWrapper site and only LoadingIcon as a raw <svg> - re-pinned from 22 repeated IconWrapper shells by the #50 path-table factory", () => {
    const source = readFileSync(resolve(process.cwd(), "src/icons/index.tsx"), "utf8");
    expect(source.match(/= createUniformIcon\(/g)).toHaveLength(22);
    expect(source.match(/<IconWrapper /g)).toHaveLength(1);
    expect(source.match(/<svg/g)).toHaveLength(1);
  });

  it('grep for "LogoIcon" in src/ returns nothing', () => {
    const hits = sourceFiles(resolve(process.cwd(), "src")).filter((file) =>
      readFileSync(file, "utf8").includes("LogoIcon")
    );
    expect(hits).toEqual([]);
  });

  it("the registry-lookup {name: string} IconProps shape is absent from src/", () => {
    const declaresIconNameLookup = /Icon\w*Props\b[^}]*\bname\??:\s*string/;
    const hits = sourceFiles(resolve(process.cwd(), "src")).filter((file) =>
      declaresIconNameLookup.test(readFileSync(file, "utf8"))
    );
    expect(hits).toEqual([]);
  });

  // The sweep stays src-wide, not scoped to src/icons: a file matching under
  // any other path must be named here deliberately, not silently exempted.
  it("no file outside an explicit allowlist declares a name string member", () => {
    const allowedNameFieldFiles = [
      resolve(process.cwd(), "src/components/ChatMessage.tsx"),
      resolve(process.cwd(), "src/components/ChatMessageList.tsx"),
    ].sort();
    const hits = sourceFiles(resolve(process.cwd(), "src"))
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return source.includes("name: string") || source.includes("name?: string");
      })
      .sort();
    expect(hits).toEqual(allowedNameFieldFiles);
  });

  it("README points a consumer wanting a brand mark at the assistantAvatar slot", () => {
    const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
    expect(readme).toContain("assistantAvatar");
    expect(readme).not.toContain("LogoIcon");
  });

  it('every relative import under src/icons ends in .js and no file contains "@/', () => {
    for (const file of sourceFiles(resolve(process.cwd(), "src/icons"))) {
      const source = readFileSync(file, "utf8");
      const relativeImports = [...source.matchAll(/from "(\.[^"]*)"/g)].map((match) => match[1]);
      for (const specifier of relativeImports) {
        expect(specifier).toMatch(/\.js$/);
      }
      expect(source).not.toContain('"@/');
    }
  });

  it('no file under src/icons carries "use client"', () => {
    for (const file of sourceFiles(resolve(process.cwd(), "src/icons"))) {
      expect(readFileSync(file, "utf8")).not.toContain("use client");
    }
  });

  it("src/styles.css gains no rule for animate-spin - it is Tailwind's core utility", () => {
    expect(readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8")).not.toContain(
      "animate-spin"
    );
  });
});

describe("root <svg> contract", () => {
  it.each([...iconNames])(
    '%s renders a root <svg> with fill="none" and viewBox="0 0 24 24"',
    (name) => {
      const svg = renderRootSvg(icons[name]);
      expect(svg.tagName.toLowerCase()).toBe("svg");
      expect(attributeMap(svg)).toMatchObject({ fill: "none", viewBox: "0 0 24 24" });
    }
  );

  it.each([...uniformIconNames])('%s carries stroke="currentColor" on the root', (name) => {
    expect(renderRootSvg(icons[name]).getAttribute("stroke")).toBe("currentColor");
  });
});

const propScenarios: [string, IconProps][] = [
  ["no props", {}],
  [
    "className, ariaLabel and strokeWidth",
    { className: "h-4 w-4", ariaLabel: "Labelled", strokeWidth: 1.75 },
  ],
];

describe.each(propScenarios)("equivalence with the pre-move output, given %s", (_label, props) => {
  it.each([...iconNames])(
    "%s matches attribute-by-attribute and in child markup",
    (name: IconName) => {
      const current = renderRootSvg(icons[name], props);
      const previous = renderRootSvg(premove[name], props);
      expect(attributeMap(current)).toEqual(attributeMap(previous));
      expect(current.innerHTML).toBe(previous.innerHTML);
    }
  );
});

describe("getAccessibleIconProps", () => {
  it("returns aria-hidden for decorative icons (no label)", () => {
    const props = getAccessibleIconProps();
    expect(props).toEqual({ "aria-hidden": true });
  });

  it("returns role=img and aria-label for meaningful icons", () => {
    const props = getAccessibleIconProps("Search conversations");
    expect(props).toEqual({
      "aria-hidden": false,
      role: "img",
      "aria-label": "Search conversations",
    });
  });
});

describe("SearchIcon", () => {
  it("is decorative (aria-hidden) by default", () => {
    const svg = renderRootSvg(icons.SearchIcon, { className: "h-4 w-4" });
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("is accessible when ariaLabel is provided", () => {
    render(<icons.SearchIcon className="h-4 w-4" ariaLabel="Search conversations" />);
    const svg = screen.getByRole("img", { name: "Search conversations" });
    expect(svg).toHaveAttribute("aria-hidden", "false");
  });
});

describe("ChatIcon", () => {
  it("is decorative by default", () => {
    expect(renderRootSvg(icons.ChatIcon)).toHaveAttribute("aria-hidden", "true");
  });

  it("is accessible when ariaLabel is provided", () => {
    render(<icons.ChatIcon ariaLabel="Open chat" />);
    expect(screen.getByRole("img", { name: "Open chat" })).toBeInTheDocument();
  });
});

describe("DashboardIcon", () => {
  it("is decorative by default", () => {
    expect(renderRootSvg(icons.DashboardIcon)).toHaveAttribute("aria-hidden", "true");
  });

  it("is accessible when ariaLabel is provided", () => {
    render(<icons.DashboardIcon ariaLabel="Go to dashboard" />);
    expect(screen.getByRole("img", { name: "Go to dashboard" })).toBeInTheDocument();
  });
});

describe("MenuIcon", () => {
  it("is decorative by default", () => {
    expect(renderRootSvg(icons.MenuIcon)).toHaveAttribute("aria-hidden", "true");
  });

  it("is accessible when ariaLabel is provided", () => {
    render(<icons.MenuIcon ariaLabel="Open menu" />);
    expect(screen.getByRole("img", { name: "Open menu" })).toBeInTheDocument();
  });
});

describe("CloseIcon", () => {
  it("is decorative by default", () => {
    expect(renderRootSvg(icons.CloseIcon)).toHaveAttribute("aria-hidden", "true");
  });

  it("is accessible when ariaLabel is provided", () => {
    render(<icons.CloseIcon ariaLabel="Close dialog" />);
    expect(screen.getByRole("img", { name: "Close dialog" })).toBeInTheDocument();
  });
});

describe("LoadingIcon", () => {
  it("has default ariaLabel 'Loading'", () => {
    render(<icons.LoadingIcon />);
    expect(screen.getByRole("img", { name: "Loading" })).toBeInTheDocument();
  });

  it("accepts custom ariaLabel", () => {
    render(<icons.LoadingIcon ariaLabel="Processing request" />);
    expect(screen.getByRole("img", { name: "Processing request" })).toBeInTheDocument();
  });

  it('ariaLabel="Indlæser" renders aria-label="Indlæser" and "Loading" appears nowhere', () => {
    const { container } = render(<icons.LoadingIcon ariaLabel="Indlæser" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", "Indlæser");
    expect(container.innerHTML).not.toContain("Loading");
  });

  it("has animation class", () => {
    const svg = renderRootSvg(icons.LoadingIcon);
    // SVG className is an SVGAnimatedString, use getAttribute instead
    expect(svg.getAttribute("class")).toContain("animate-spin");
  });

  it("renders its own strokeless <svg>: no root stroke, animate-spin, fill=currentColor path without stroke", () => {
    const { container } = render(<icons.LoadingIcon />);
    const svg = container.querySelector("svg");
    expect(svg?.hasAttribute("stroke")).toBe(false);
    expect(svg?.getAttribute("class")).toContain("animate-spin");
    const path = container.querySelector("path");
    expect(path?.getAttribute("fill")).toBe("currentColor");
    expect(path?.hasAttribute("stroke")).toBe(false);
  });

  it("composes className after animate-spin", () => {
    const svg = renderRootSvg(icons.LoadingIcon, { className: "h-4 w-4" });
    expect(svg.getAttribute("class")).toBe("animate-spin h-4 w-4");
  });
});

describe("strokeWidth customization", () => {
  it("uses default strokeWidth of 2 on both the <svg> and the <path>", () => {
    const { container } = render(<icons.SearchIcon />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "2");
    expect(container.querySelector("path")).toHaveAttribute("stroke-width", "2");
  });

  it("accepts custom strokeWidth: SearchIcon strokeWidth={1.5} renders stroke-width 1.5 on the path", () => {
    const { container } = render(<icons.SearchIcon strokeWidth={1.5} />);
    expect(container.querySelector("path")).toHaveAttribute("stroke-width", "1.5");
  });

  it("DatabaseIcon defaults strokeWidth to 1.5 on both the <svg> and the <path>", () => {
    const { container } = render(<icons.DatabaseIcon />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "1.5");
    expect(container.querySelector("path")).toHaveAttribute("stroke-width", "1.5");
  });

  it("DatabaseIcon strokeWidth={3} overrides its 1.5 default", () => {
    const { container } = render(<icons.DatabaseIcon strokeWidth={3} />);
    expect(container.querySelector("path")).toHaveAttribute("stroke-width", "3");
  });
});

describe("className propagation", () => {
  it("applies className to svg element", () => {
    const svg = renderRootSvg(icons.SearchIcon, { className: "h-6 w-6 text-blue-500" });
    // SVG className is an SVGAnimatedString, use getAttribute instead
    expect(svg.getAttribute("class")).toBe("h-6 w-6 text-blue-500");
  });
});

describe("uniform icon identity", () => {
  it.each([...uniformIconNames])(
    "%s carries its own displayName and Function.name - React DevTools and ErrorBoundary componentStacks must never report a factory-made icon as UniformIcon",
    (name) => {
      const icon = icons[name] as ((props: IconProps) => unknown) & { displayName?: string };
      expect({ displayName: icon.displayName, functionName: icon.name }).toEqual({
        displayName: name,
        functionName: name,
      });
    }
  );
});
