import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AppSidebar, ChatIcon } from "../src/index.js";
import type { SidebarNavItem } from "../src/index.js";

const threeItems: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "chat", label: "Chat", isActive: true },
  { key: "settings", label: "Ajustes" },
];

describe("AppSidebar", () => {
  describe("the landmarks", () => {
    it('renders one <aside> named "Sidebar" containing one <nav> named "Main navigation" by default', () => {
      const { container } = render(<AppSidebar navItems={threeItems} />);

      const aside = screen.getByRole("complementary", { name: "Sidebar" });
      const nav = screen.getByRole("navigation", { name: "Main navigation" });
      expect(aside).toContainElement(nav);
      expect(container.querySelectorAll("nav")).toHaveLength(1);
    });

    it('labels={{sidebar: "Panel lateral", mainNavigation: "Navegación principal"}} names both landmarks', () => {
      render(
        <AppSidebar
          navItems={threeItems}
          labels={{ sidebar: "Panel lateral", mainNavigation: "Navegación principal" }}
        />
      );

      expect(screen.getByRole("complementary", { name: "Panel lateral" })).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    });

    it("the aside grows in the 030 drawer and sizes itself in the rail: flex-1 min-h-0 below md, md:h-full md:w-64 md:flex-none md:border-r lg:w-72", () => {
      render(<AppSidebar navItems={threeItems} />);

      const aside = screen.getByRole("complementary", { name: "Sidebar" });
      for (const token of [
        "flex-1",
        "min-h-0",
        "flex-col",
        "md:h-full",
        "md:w-64",
        "md:flex-none",
        "md:border-r",
        "lg:w-72",
      ]) {
        expect(aside.classList).toContain(token);
      }
      expect(aside.classList).not.toContain("h-full");
    });
  });

  describe("the navigation", () => {
    it('three navItems render three items in order, each showing its label, and the isActive one alone carries aria-current="page"', () => {
      render(<AppSidebar navItems={threeItems} />);

      const rows = screen.getAllByRole("button");
      expect(rows).toHaveLength(3);
      expect(rows.map((row) => row.textContent)).toEqual(["Dashboard", "Chat", "Ajustes"]);
      expect(rows[0]).not.toHaveAttribute("aria-current");
      expect(rows[1]).toHaveAttribute("aria-current", "page");
      expect(rows[2]).not.toHaveAttribute("aria-current");
    });

    it("with no item marked isActive, none carries aria-current", () => {
      render(
        <AppSidebar
          navItems={[
            { key: "dashboard", label: "Dashboard" },
            { key: "chat", label: "Chat" },
          ]}
        />
      );

      for (const row of screen.getAllByRole("button")) {
        expect(row).not.toHaveAttribute("aria-current");
      }
    });

    it("items are keyed by item.key: reversing navItems moves the same DOM nodes instead of remounting them", () => {
      const { rerender } = render(<AppSidebar navItems={threeItems} />);
      const [dashboardBefore, , settingsBefore] = screen.getAllByRole("button");

      rerender(<AppSidebar navItems={[...threeItems].reverse()} />);

      const after = screen.getAllByRole("button");
      expect(after.map((row) => row.textContent)).toEqual(["Ajustes", "Chat", "Dashboard"]);
      expect(after[2]).toBe(dashboardBefore);
      expect(after[0]).toBe(settingsBefore);
    });

    it("navItems omitted renders no <nav> element at all", () => {
      const { container } = render(<AppSidebar>4711</AppSidebar>);

      expect(container.querySelector("nav")).toBeNull();
    });

    it("navItems={[]} renders no <nav> element at all", () => {
      const { container } = render(<AppSidebar navItems={[]} />);

      expect(container.querySelector("nav")).toBeNull();
    });

    it('clicking an item calls onNavigate once with "settings"', () => {
      const onNavigate = vi.fn();
      render(<AppSidebar navItems={threeItems} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByRole("button", { name: "Ajustes" }));

      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("settings");
    });

    it("with onNavigate omitted, clicking an item throws nothing", () => {
      render(<AppSidebar navItems={threeItems} />);

      expect(() => fireEvent.click(screen.getByRole("button", { name: "Chat" }))).not.toThrow();
    });
  });

  describe("renderNavLink", () => {
    it("anchors carry the component's className and aria-current, and clicking one calls onNavigate with that key", () => {
      const onNavigate = vi.fn();
      render(
        <AppSidebar
          navItems={threeItems}
          onNavigate={onNavigate}
          renderNavLink={(item, props) => <a href={"/" + item.key} {...props} />}
        />
      );

      const [dashboard, chat] = screen.getAllByRole("link");
      expect(dashboard).toHaveAttribute("href", "/dashboard");
      expect(dashboard.className).toContain("rounded-lg");
      expect(dashboard).not.toHaveAttribute("aria-current");
      expect(chat).toHaveAttribute("aria-current", "page");

      fireEvent.click(dashboard);
      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith("dashboard");
    });

    it("a renderNavLink that spreads everything except onClick calls onNavigate zero times", () => {
      const onNavigate = vi.fn();
      render(
        <AppSidebar
          navItems={threeItems}
          onNavigate={onNavigate}
          renderNavLink={(item, { onClick: _onClick, ...rest }) => (
            <a href={"/" + item.key} {...rest} />
          )}
        />
      );

      fireEvent.click(screen.getAllByRole("link")[0]);

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("the design notes' renderNavLink section requires the consumer to spread every prop", () => {
      const designNotes = readFileSync(resolve(process.cwd(), "docs/design-notes.md"), "utf8");

      expect(designNotes).toMatch(/## renderNavLink/);
      expect(designNotes.split("## renderNavLink")[1]).toMatch(/spread \*\*every\*\* prop/);
    });
  });

  describe("icons", () => {
    it('an item with icon: ChatIcon renders that component with className "h-5 w-5"', () => {
      const { container } = render(
        <AppSidebar navItems={[{ key: "chat", label: "Chat", icon: ChatIcon }]} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-5", "w-5");
    });

    it("an item without icon renders its label and no <svg>", () => {
      const { container } = render(<AppSidebar navItems={[{ key: "chat", label: "Chat" }]} />);

      expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
      expect(container.querySelector("svg")).toBeNull();
    });
  });

  describe("the slots", () => {
    it("children render inside a wrapper carrying flex min-h-0 flex-1 flex-col overflow-y-auto, so an unsized child is the one that grows", () => {
      render(
        <AppSidebar>
          <span data-testid="middle-child">4711</span>
        </AppSidebar>
      );

      const wrapper = screen.getByTestId("middle-child").parentElement as HTMLElement;
      for (const token of ["flex", "min-h-0", "flex-1", "flex-col", "overflow-y-auto"]) {
        expect(wrapper.classList).toContain(token);
      }
      expect(screen.getByRole("complementary", { name: "Sidebar" })).toContainElement(wrapper);
    });

    it("footer={<button>Log ud</button>} renders that node inside exactly one border-t region", () => {
      const { container } = render(<AppSidebar footer={<button type="button">Log ud</button>} />);

      const regions = container.querySelectorAll(".border-t");
      expect(regions).toHaveLength(1);
      expect(regions[0]).toContainElement(screen.getByRole("button", { name: "Log ud" }));
    });

    it("footer omitted renders no border-t region", () => {
      const { container } = render(<AppSidebar navItems={threeItems}>4711</AppSidebar>);

      expect(container.querySelectorAll(".border-t")).toHaveLength(0);
    });

    it("brand={<span>Acme Support</span>} renders it inside the bordered top row", () => {
      render(<AppSidebar brand={<span>Acme Support</span>} navItems={threeItems} />);

      const row = screen.getByText("Acme Support").parentElement as HTMLElement;
      for (const token of ["h-14", "border-b"]) {
        expect(row.classList).toContain(token);
      }
    });

    it("brand omitted renders no top row and no border-b above the navigation", () => {
      const { container } = render(<AppSidebar navItems={threeItems} />);

      expect(container.querySelector(".border-b")).toBeNull();
      expect(container.querySelector(".h-14")).toBeNull();
    });
  });
});

describe("the source files (grep acceptance criteria)", () => {
  const componentPath = "src/components/AppSidebar.tsx";
  const content = readFileSync(resolve(process.cwd(), componentPath), "utf8");

  it("GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics", () => {
    expect(content).not.toMatch(
      /console\.|localStorage|sessionStorage|fetch|sendBeacon|analytics|indexedDB/i
    );
  });

  it("no @clerk, swr, next-intl, next/, @/ or lucide-react import, and every relative import ends in .js", () => {
    expect(content).not.toMatch(/@clerk|swr|next-intl|next\/|@\/|lucide-react/);
    const relativeImports = [...content.matchAll(/from\s+"(\.[^"]+)"/g)].map(([, spec]) => spec);
    expect(relativeImports.length).toBeGreaterThan(0);
    for (const spec of relativeImports) {
      expect(spec).toMatch(/\.js$/);
    }
  });
});
