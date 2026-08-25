import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppShell, type SidebarSlotContext } from "../src/index.js";

const source = readFileSync(resolve(process.cwd(), "src/components/AppShell.tsx"), "utf8");

const sidebarWithLink = ({ variant }: SidebarSlotContext) => (
  <span data-testid={`sidebar-${variant}`}>
    <a href="/x" data-testid={`sidebar-link-${variant}`}>
      settings 4711
    </a>
  </span>
);

const getDrawer = () => screen.getByTestId("app-shell-drawer");
const getHamburger = () => screen.getByRole("button", { name: "Open menu" });
const getCloseButton = () => screen.getByRole("button", { name: "Close menu" });

describe("AppShell", () => {
  describe("main content and skip link", () => {
    it('renders children inside <main id="main-content"> by default', () => {
      render(
        <AppShell>
          <p>Booking 4711 detaljer</p>
        </AppShell>
      );

      const main = document.querySelector("main#main-content");
      expect(main).toContainElement(screen.getByText("Booking 4711 detaljer"));
    });

    it('mainContentId="olt-main" renders <main id="olt-main"> and a skip link with href "#olt-main"', () => {
      render(
        <AppShell mainContentId="olt-main">
          <p>content</p>
        </AppShell>
      );

      expect(document.querySelector("main#olt-main")).toContainElement(screen.getByText("content"));
      expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
        "href",
        "#olt-main"
      );
    });

    it("the skip link is the first focusable element in the rendered tree", () => {
      const { container } = render(
        <AppShell renderSidebar={sidebarWithLink} brand={<span>4711</span>}>
          <button>inside main</button>
        </AppShell>
      );

      const focusables = container.querySelectorAll("a[href], button, input, select, textarea");
      expect(focusables[0]).toBe(screen.getByRole("link", { name: "Skip to main content" }));
    });

    it("skipLink={false} renders no anchor pointing at mainContentId", () => {
      const { container } = render(
        <AppShell skipLink={false}>
          <p>content</p>
        </AppShell>
      );

      expect(container.querySelector('a[href="#main-content"]')).toBeNull();
    });
  });

  describe("the renderSidebar slot", () => {
    it('renderSidebar is called exactly twice per render, once with variant "desktop" and once with "mobile", and both trees are in the document', () => {
      const renderSidebar = vi.fn(sidebarWithLink);
      render(<AppShell renderSidebar={renderSidebar}>content</AppShell>);

      expect(renderSidebar).toHaveBeenCalledTimes(2);
      expect(renderSidebar.mock.calls.map(([context]) => context.variant)).toEqual([
        "desktop",
        "mobile",
      ]);
      expect(screen.getByTestId("sidebar-desktop")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-mobile")).toBeInTheDocument();
    });

    it("renderSidebar omitted still renders the frame with its drawer chrome", () => {
      render(<AppShell>content</AppShell>);

      expect(getDrawer()).toContainElement(getCloseButton());
    });
  });

  describe("uncontrolled open state", () => {
    it("clicking the openSidebar button puts the drawer in the open state and the closeSidebar button returns it to closed", () => {
      render(<AppShell>content</AppShell>);

      const drawer = getDrawer();
      expect(drawer).toHaveClass("-translate-x-full");
      expect(drawer).toHaveAttribute("inert");

      fireEvent.click(getHamburger());
      expect(drawer).toHaveClass("translate-x-0");
      expect(drawer).not.toHaveAttribute("inert");

      fireEvent.click(getCloseButton());
      expect(drawer).toHaveClass("-translate-x-full");
      expect(drawer).toHaveAttribute("inert");
    });

    it("pressing Escape closes the open drawer", () => {
      render(<AppShell>content</AppShell>);
      fireEvent.click(getHamburger());

      fireEvent.keyDown(document, { key: "Escape" });

      expect(getDrawer()).toHaveClass("-translate-x-full");
    });

    it("clicking the backdrop closes the open drawer", () => {
      render(<AppShell>content</AppShell>);
      fireEvent.click(getHamburger());

      fireEvent.click(screen.getByTestId("app-shell-backdrop"));

      expect(getDrawer()).toHaveClass("-translate-x-full");
    });

    it('calling close() from the "mobile" slot context closes the open drawer', () => {
      render(
        <AppShell
          renderSidebar={({ variant, close }) => (
            <button data-testid={`close-${variant}`} onClick={close}>
              close 4711
            </button>
          )}
        >
          content
        </AppShell>
      );
      fireEvent.click(getHamburger());

      fireEvent.click(screen.getByTestId("close-mobile"));

      expect(getDrawer()).toHaveClass("-translate-x-full");
    });
  });

  describe("controlled open state", () => {
    it("mobileSidebarOpen={false}: clicking the hamburger calls onMobileSidebarOpenChange once with true and the drawer stays closed", () => {
      const onOpenChange = vi.fn();
      render(
        <AppShell mobileSidebarOpen={false} onMobileSidebarOpenChange={onOpenChange}>
          content
        </AppShell>
      );

      fireEvent.click(getHamburger());

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(getDrawer()).toHaveClass("-translate-x-full");
      expect(getDrawer()).toHaveAttribute("inert");
    });

    it("mobileSidebarOpen={true} renders the drawer open with no interaction, and closing only reports false", () => {
      const onOpenChange = vi.fn();
      render(
        <AppShell mobileSidebarOpen={true} onMobileSidebarOpenChange={onOpenChange}>
          content
        </AppShell>
      );

      const drawer = getDrawer();
      expect(drawer).toHaveClass("translate-x-0");
      expect(drawer).not.toHaveAttribute("inert");

      fireEvent.click(getCloseButton());
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(drawer).toHaveClass("translate-x-0");
    });
  });

  describe("inert on the closed drawer", () => {
    it("the closed drawer wrapper carries inert so its focusables are out of the tab order; the open wrapper carries none", () => {
      render(<AppShell renderSidebar={sidebarWithLink}>content</AppShell>);

      const link = screen.getByTestId("sidebar-link-mobile");
      expect(getDrawer()).toHaveAttribute("inert");
      expect(link.closest("[inert]")).toBe(getDrawer());

      fireEvent.click(getHamburger());
      expect(getDrawer()).not.toHaveAttribute("inert");
      expect(link.closest("[inert]")).toBeNull();
    });

    it("the string aria-hidden appears nowhere in src/components/AppShell.tsx", () => {
      expect(source).not.toMatch(/aria-hidden/);
    });
  });

  describe("focus management", () => {
    // jsdom performs no layout and reports offsetParent as null everywhere,
    // which would make the shared focus trap see every element as hidden.
    // The shim is local, exactly as in tests/useFocusTrap.test.tsx - removing
    // it makes the three assertions below fail.
    const offsetParentDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetParent"
    );

    beforeEach(() => {
      Object.defineProperty(HTMLElement.prototype, "offsetParent", {
        configurable: true,
        get() {
          return (this as HTMLElement).parentElement;
        },
      });
      vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      });
    });

    afterEach(() => {
      if (offsetParentDescriptor) {
        Object.defineProperty(HTMLElement.prototype, "offsetParent", offsetParentDescriptor);
      }
      vi.unstubAllGlobals();
    });

    it("opening the drawer moves focus to the close button", () => {
      render(<AppShell renderSidebar={sidebarWithLink}>content</AppShell>);

      fireEvent.click(getHamburger());

      expect(getCloseButton()).toHaveFocus();
    });

    it("Tab from the last focusable element inside the drawer wraps to the first", () => {
      render(<AppShell renderSidebar={sidebarWithLink}>content</AppShell>);
      fireEvent.click(getHamburger());

      screen.getByTestId("sidebar-link-mobile").focus();
      fireEvent.keyDown(document, { key: "Tab" });

      expect(getCloseButton()).toHaveFocus();
    });

    it("mounting the shell leaves focus on whatever the page had focused", () => {
      render(<button>outside</button>);
      const outside = screen.getByRole("button", { name: "outside" });
      outside.focus();

      render(<AppShell renderSidebar={sidebarWithLink}>content</AppShell>);

      expect(outside).toHaveFocus();
    });

    it("closing the drawer returns focus to the hamburger", () => {
      render(<AppShell renderSidebar={sidebarWithLink}>content</AppShell>);
      fireEvent.click(getHamburger());

      fireEvent.click(getCloseButton());

      expect(getHamburger()).toHaveFocus();
    });
  });

  describe("the shared focus trap owns the keyboard handling", () => {
    it('src/components/AppShell.tsx contains no "Escape" string and adds no document.addEventListener of its own', () => {
      expect(source).not.toMatch(/Escape/);
      expect(source).not.toMatch(/document\.addEventListener/);
    });
  });

  describe("the body scroll lock", () => {
    afterEach(() => {
      document.body.style.overflow = "";
    });

    it('with body overflow pre-set to "scroll", opening sets "hidden" and closing restores "scroll"', () => {
      document.body.style.overflow = "scroll";
      render(<AppShell>content</AppShell>);

      fireEvent.click(getHamburger());
      expect(document.body.style.overflow).toBe("hidden");

      fireEvent.click(getCloseButton());
      expect(document.body.style.overflow).toBe("scroll");
    });

    it('unmounting while open restores the prior "scroll" value', () => {
      document.body.style.overflow = "scroll";
      const { unmount } = render(<AppShell>content</AppShell>);
      fireEvent.click(getHamburger());

      unmount();

      expect(document.body.style.overflow).toBe("scroll");
    });
  });

  describe("reduced motion", () => {
    it("reducedMotion={true} renders the drawer and the backdrop with no transition classes", () => {
      render(<AppShell reducedMotion={true}>content</AppShell>);

      expect(getDrawer()).not.toHaveClass("transition-transform");
      expect(screen.getByTestId("app-shell-backdrop")).not.toHaveClass("transition-opacity");
    });

    it("reducedMotion omitted with matchMedia matching nothing renders both transition classes", () => {
      vi.stubGlobal(
        "matchMedia",
        vi.fn().mockReturnValue({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })
      );

      render(<AppShell>content</AppShell>);

      expect(getDrawer()).toHaveClass("transition-transform");
      expect(screen.getByTestId("app-shell-backdrop")).toHaveClass("transition-opacity");

      vi.unstubAllGlobals();
    });
  });

  describe("the brand slot", () => {
    it("brand renders inside the mobile header row with the centring spacer", () => {
      render(<AppShell brand={<span data-testid="brand">4711</span>}>content</AppShell>);

      const headerRow = getHamburger().parentElement as HTMLElement;
      expect(headerRow).toContainElement(screen.getByTestId("brand"));
      expect(headerRow.querySelector("div.h-10.w-10")).not.toBeNull();
    });

    it("brand omitted renders the hamburger and no centring spacer", () => {
      render(<AppShell>content</AppShell>);

      const headerRow = getHamburger().parentElement as HTMLElement;
      expect(headerRow.querySelector("div.h-10.w-10")).toBeNull();
    });

    it("the component imports no logo", () => {
      expect(source).not.toMatch(/Logo/);
    });
  });

  describe("GDPR and import hygiene", () => {
    it("the source references no console, fetch, sendBeacon or Web Storage API", () => {
      expect(source).not.toMatch(
        /console\.|fetch|sendBeacon|localStorage|sessionStorage|indexedDB|analytics/
      );
    });

    it("no framework, auth, i18n or aliased import survives, and every relative import ends in .js", () => {
      expect(source).not.toMatch(/@clerk|swr|next-intl|next\/|@discovery|@\/|lucide-react/);

      const relativeImports = [...source.matchAll(/from\s+"(\.[^"]*)"/g)].map(
        ([, specifier]) => specifier
      );
      expect(relativeImports.length).toBeGreaterThan(0);
      for (const specifier of relativeImports) {
        expect(specifier).toMatch(/\.js$/);
      }
    });

    describe("review fixes (issue 030)", () => {
      it("the mobile header stacks under the drawer: z-40 header, z-50 drawer", () => {
        render(<AppShell renderSidebar={() => <a href="#nav">nav</a>}>content</AppShell>);

        const header = document.querySelector("header, .z-40");
        expect(header?.className).toContain("z-40");
        expect(document.querySelector('[data-testid="app-shell-drawer"]')?.className).toContain(
          "z-50"
        );
      });

      it("brand={null} renders no brand spacer, same as omitting the prop", () => {
        const { container: withNull } = render(
          <AppShell brand={null} renderSidebar={() => null}>
            content
          </AppShell>
        );
        const { container: omitted } = render(
          <AppShell renderSidebar={() => null}>content</AppShell>
        );

        const spacers = (root: HTMLElement) => root.querySelectorAll("header > div").length;
        expect(spacers(withNull)).toBe(spacers(omitted));
      });
    });
  });
});
