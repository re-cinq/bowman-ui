import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  InlineThinkingIndicator,
  ThinkingIndicator,
  defaultThinkingIndicatorLabels,
} from "../src/index.js";
import { expectThinkingDots } from "./helpers/expect-thinking-dots.js";

describe("ThinkingIndicator", () => {
  it('renders "Thinking" and a role="status" element with aria-label "Loading response" by default', () => {
    render(<ThinkingIndicator />);

    expect(screen.getByText("Thinking")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading response");
  });

  it('labels {thinking: "Pensando", thinkingRegion: "Cargando respuesta"} leaves no English string in the output', () => {
    const { container } = render(
      <ThinkingIndicator labels={{ thinking: "Pensando", thinkingRegion: "Cargando respuesta" }} />
    );

    expect(screen.getByText("Pensando")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Cargando respuesta");
    expect(container.innerHTML).not.toMatch(/Thinking|Loading response/);
  });

  it("defaultThinkingIndicatorLabels is frozen and holds exactly the two English defaults", () => {
    expect(Object.isFrozen(defaultThinkingIndicatorLabels)).toBe(true);
    expect(defaultThinkingIndicatorLabels).toEqual({
      thinking: "Thinking",
      thinkingRegion: "Loading response",
    });
  });

  it("renders three bowman-fade-dot dots with staggered delays, via the helper shared with InlineThinkingIndicator", () => {
    expectThinkingDots(render(<ThinkingIndicator />).container);
    expectThinkingDots(render(<InlineThinkingIndicator />).container);
  });

  it("assistantAvatar renders inside the avatar circle", () => {
    const { container } = render(
      <ThinkingIndicator assistantAvatar={<span data-testid="mark">4711</span>} />
    );

    const circle = container.querySelector('[aria-hidden="true"]');
    expect(circle?.querySelector('[data-testid="mark"]')).toHaveTextContent("4711");
  });

  it("with no assistantAvatar the circle is empty", () => {
    const { container } = render(<ThinkingIndicator />);

    const circle = container.querySelector('[aria-hidden="true"]');
    expect(circle?.childElementCount).toBe(0);
    expect(circle?.textContent).toBe("");
  });

  it('the circle carries aria-hidden="true" and bowman-pulse-subtle with every prop supplied', () => {
    const { container } = render(
      <ThinkingIndicator
        assistantAvatar={<span>4711</span>}
        labels={{ thinking: "Pensando", thinkingRegion: "Cargando respuesta" }}
      />
    );

    const circle = container.querySelector('[aria-hidden="true"]');
    expect(circle?.classList.contains("bowman-pulse-subtle")).toBe(true);
  });

  it('InlineThinkingIndicator renders its label and dots with no role="status" and no avatar circle', () => {
    const { container } = render(<InlineThinkingIndicator />);

    expect(screen.getByText("Thinking")).toBeInTheDocument();
    expectThinkingDots(container);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });

  describe("the extracted sources (grep acceptance criteria)", () => {
    const componentPaths = [
      "src/components/ThinkingIndicator.tsx",
      "src/components/ThinkingDots.tsx",
    ];
    const sources = componentPaths.map((path) => ({
      path,
      content: readFileSync(resolve(process.cwd(), path), "utf8"),
    }));

    const walk = (dir: string): string[] => {
      const files: string[] = [];
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
          files.push(...walk(fullPath));
          continue;
        }
        files.push(fullPath);
      }
      return files;
    };

    it("ThinkingIndicator.tsx carries no label?: prop - the labels object replaced it", () => {
      expect(sources[0].content).not.toMatch(/label\?:/);
    });

    it("neither file imports @clerk, swr, next-intl, next/, @discovery or @/ and every relative import ends in .js", () => {
      for (const { content } of sources) {
        expect(content).not.toMatch(/@clerk|swr|next-intl|next\/|@discovery|@\//);
        for (const [, spec] of content.matchAll(/from\s+"(\.[^"]+)"/g)) {
          expect(spec).toMatch(/\.js$/);
        }
      }
      const relativeImports = [...sources[0].content.matchAll(/from\s+"(\.[^"]+)"/g)];
      expect(relativeImports.length).toBeGreaterThan(0);
    });

    it("ThinkingDots is imported by both ThinkingIndicator and InlineThinkingIndicator", () => {
      const inline = readFileSync(
        resolve(process.cwd(), "src/components/InlineThinkingIndicator.tsx"),
        "utf8"
      );
      expect(sources[0].content).toMatch(/from "\.\/ThinkingDots\.js"/);
      expect(inline).toMatch(/from "\.\/ThinkingDots\.js"/);
    });

    it("GDPR: neither file calls console.*, localStorage, sessionStorage, fetch or sendBeacon", () => {
      for (const { content } of sources) {
        expect(content).not.toMatch(/console\.|localStorage|sessionStorage|fetch|sendBeacon/);
      }
    });

    it("LogoIcon appears nowhere in src/ or dist/ - the avatar slot replaced the bundled mark", () => {
      for (const dir of ["src", "dist"]) {
        for (const file of walk(resolve(process.cwd(), dir))) {
          expect(readFileSync(file, "utf8")).not.toMatch(/LogoIcon/);
        }
      }
    });
  });
});

describe("the explicit live-region attribute (078)", () => {
  it('the role="status" element carries an explicit aria-live="polite", the attribute ChatMessageList queries against its aria-live="off" transcript', () => {
    render(<ThinkingIndicator />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
