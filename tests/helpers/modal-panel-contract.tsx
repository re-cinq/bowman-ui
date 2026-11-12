import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, type ReactElement, type ReactNode, type RefObject } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  expectBorder,
  expectFocusVisibleRing,
  expectSurface,
  expectTextBody,
  expectTextStrong,
} from "./expect-theme-tokens.js";

// The portal, trap, focus-return, overflow and hydration contract Dialog and
// ConfirmDialog share through the private ModalPanel
// (specs/bowman-ui-form-dialog-notice/spec.md § Dialog). Each test file calls
// it inside a describe that has already called stubFocusEnvironment.
export interface ModalHarnessProps {
  open: boolean;
  onEscape: () => void;
  children?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
  container?: Element | null;
}

export interface ModalContract {
  role: "dialog" | "alertdialog";
  title: string;
  renderModal: (props: ModalHarnessProps) => ReactElement;
}

const BODY_SELECTOR = ".overflow-y-auto";

// jsdom lays nothing out: the scrolling body overflows exactly while `overflowing` holds.
const stubBodyHeights = () => {
  const heights = { overflowing: false };
  const isBody = (element: HTMLElement) => element.matches(BODY_SELECTOR);

  beforeEach(() => {
    heights.overflowing = false;
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return isBody(this) && heights.overflowing ? 900 : 100;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get: () => 100,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
    Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
  });

  return heights;
};

interface FakeObserver {
  callback: () => void;
  targets: Element[];
  disconnected: boolean;
}

const stubResizeObserver = (): FakeObserver[] => {
  const observers: FakeObserver[] = [];

  vi.stubGlobal(
    "ResizeObserver",
    class {
      record: FakeObserver;

      constructor(callback: () => void) {
        this.record = { callback, targets: [], disconnected: false };
        observers.push(this.record);
      }

      observe(target: Element) {
        this.record.targets.push(target);
      }

      disconnect() {
        this.record.disconnected = true;
      }
    }
  );

  return observers;
};

const field = <input aria-label="Navn 4711" />;

export const describeModalPanelContract = ({ role, title, renderModal }: ModalContract) => {
  const heights = stubBodyHeights();
  const panelOf = () => screen.getByRole(role, { name: title });
  const bodyOf = () => panelOf().querySelector<HTMLElement>(BODY_SELECTOR);

  const Opener = (props: Omit<ModalHarnessProps, "onEscape"> & { onEscape?: () => void }) => (
    <>
      <button>opener</button>
      {renderModal({ onEscape: () => {}, ...props })}
    </>
  );

  const openFromOpener = (props: Partial<ModalHarnessProps> = {}) => {
    const view = render(<Opener open={false} {...props} />);

    screen.getByRole("button", { name: "opener" }).focus();
    view.rerender(<Opener open {...props} />);

    return view;
  };

  describe("the shared modal panel", () => {
    it("renders nothing while open is false", () => {
      render(renderModal({ open: false, onEscape: () => {}, children: field }));

      expect(screen.queryByRole(role)).not.toBeInTheDocument();
    });

    it("portals a fixed z-50 bg-black/50 overlay as document.body's last child, holding the modal panel named by its <h2>", () => {
      const { container } = render(renderModal({ open: true, onEscape: () => {} }));
      const panel = panelOf();
      const heading = screen.getByRole("heading", { level: 2, name: title });

      expect(container).toBeEmptyDOMElement();
      expect(document.body.lastElementChild).toBe(panel.parentElement);
      expect(panel.parentElement).toHaveClass("fixed", "inset-0", "z-50", "bg-black/50");
      expect(panel).toHaveAttribute("aria-modal", "true");
      expect(panel).toHaveAttribute("tabindex", "-1");
      expect(panel).toHaveAttribute("aria-labelledby", heading.id);
    });

    it("container={wrapper} portals into the wrapper; container={null} portals into document.body", () => {
      const wrapper = document.createElement("div");

      document.body.append(wrapper);
      const { rerender } = render(
        renderModal({ open: true, onEscape: () => {}, container: wrapper })
      );

      expect(wrapper.lastElementChild).toBe(panelOf().parentElement);

      rerender(renderModal({ open: false, onEscape: () => {}, container: null }));
      rerender(renderModal({ open: true, onEscape: () => {}, container: null }));

      expect(document.body.lastElementChild).toBe(panelOf().parentElement);
      wrapper.remove();
    });

    it("the panel paints SURFACE, BORDER and TEXT_BODY, the <h2> TEXT_STRONG, capped at w-full max-w-lg and 100dvh - 2rem", () => {
      render(renderModal({ open: true, onEscape: () => {} }));

      expectSurface(panelOf());
      expectBorder(panelOf());
      expectTextBody(panelOf());
      expectTextStrong(screen.getByRole("heading", { level: 2 }));
      expect(panelOf()).toHaveClass("w-full", "max-w-lg", "max-h-[calc(100dvh-2rem)]");
    });

    it("the panel and the scrolling body carry FOCUS_VISIBLE_RING beside ring-offset-2 and no shadow, and the body pads p-1", () => {
      render(renderModal({ open: true, onEscape: () => {} }));

      expectFocusVisibleRing(panelOf());
      expectFocusVisibleRing(bodyOf());
      expect(bodyOf()).toHaveClass("p-1", "overflow-y-auto", "min-h-0");
    });

    it("opening focuses the first control in children, and Tab from the last control wraps inside", () => {
      render(renderModal({ open: true, onEscape: () => {}, children: field }));
      const input = screen.getByRole("textbox", { name: "Navn 4711" });

      expect(input).toHaveFocus();

      const controls = [...panelOf().querySelectorAll<HTMLElement>("input, button")];

      controls[controls.length - 1].focus();
      fireEvent.keyDown(document, { key: "Tab" });

      expect(input).toHaveFocus();
    });

    it("Escape calls the dismiss callback once, and a click on the overlay calls nothing", () => {
      const onEscape = vi.fn();

      render(renderModal({ open: true, onEscape, children: field }));
      fireEvent.click(panelOf().parentElement as HTMLElement);

      expect(onEscape).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it("closing returns focus to the element that held it before opening", () => {
      const { rerender } = openFromOpener({ children: field });

      expect(screen.getByRole("textbox")).toHaveFocus();
      rerender(<Opener open={false}>{field}</Opener>);

      expect(screen.getByRole("button", { name: "opener" })).toHaveFocus();
    });

    it("unmounting while open returns focus to the element that held it before opening", () => {
      const opener = document.createElement("button");

      document.body.append(opener);
      opener.focus();
      const { unmount } = render(renderModal({ open: true, onEscape: () => {}, children: field }));

      expect(screen.getByRole("textbox")).toHaveFocus();
      unmount();

      expect(opener).toHaveFocus();
      opener.remove();
    });

    it("closing returns focus to returnFocusRef.current when given", () => {
      const returnFocusRef = createRef<HTMLElement | null>();
      const target = document.createElement("button");

      document.body.append(target);
      returnFocusRef.current = target;
      const { rerender } = openFromOpener({ children: field, returnFocusRef });

      rerender(
        <Opener open={false} returnFocusRef={returnFocusRef}>
          {field}
        </Opener>
      );

      expect(target).toHaveFocus();
      target.remove();
    });

    it("a body that does not overflow carries no tabindex, role or aria-labelledby", () => {
      render(renderModal({ open: true, onEscape: () => {}, children: "4711" }));

      for (const attribute of ["tabindex", "role", "aria-labelledby"]) {
        expect(bodyOf()).not.toHaveAttribute(attribute);
      }
    });

    it("an overflowing prose-only body becomes a focusable region named by the <h2> and takes initial focus", () => {
      heights.overflowing = true;
      render(renderModal({ open: true, onEscape: () => {}, children: "4711" }));
      const heading = screen.getByRole("heading", { level: 2 });

      expect(bodyOf()).toHaveAttribute("tabindex", "0");
      expect(bodyOf()).toHaveAttribute("role", "region");
      expect(bodyOf()).toHaveAttribute("aria-labelledby", heading.id);
      expect(bodyOf()).toHaveFocus();
    });

    it("an overflowing body that holds a control takes no tabindex, and the control takes focus", () => {
      heights.overflowing = true;
      render(renderModal({ open: true, onEscape: () => {}, children: field }));

      expect(bodyOf()).not.toHaveAttribute("tabindex");
      expect(screen.getByRole("textbox")).toHaveFocus();
    });

    it("mounted closed with overflowing heights and then opened, the body carries tabindex=0", () => {
      heights.overflowing = true;
      const { rerender } = render(
        renderModal({ open: false, onEscape: () => {}, children: "4711" })
      );

      rerender(renderModal({ open: true, onEscape: () => {}, children: "4711" }));

      expect(bodyOf()).toHaveAttribute("tabindex", "0");
    });

    it("a ResizeObserver watches the body and its inner wrapper, re-evaluating on each, and disconnects on close", () => {
      const observers = stubResizeObserver();
      const { rerender } = render(
        renderModal({ open: true, onEscape: () => {}, children: "4711" })
      );
      const [observer] = observers;

      expect(observer.targets).toEqual([bodyOf(), bodyOf()?.firstElementChild]);
      expect(bodyOf()).not.toHaveAttribute("tabindex");

      heights.overflowing = true;
      act(() => observer.callback());

      expect(bodyOf()).toHaveAttribute("tabindex", "0");

      heights.overflowing = false;
      act(() => observer.callback());

      expect(bodyOf()).not.toHaveAttribute("tabindex");

      rerender(renderModal({ open: false, onEscape: () => {}, children: "4711" }));

      expect(observer.disconnected).toBe(true);
    });

    it("when the focused body stops overflowing, the panel takes focus before the attributes go", () => {
      const observers = stubResizeObserver();

      heights.overflowing = true;
      render(renderModal({ open: true, onEscape: () => {}, children: "4711" }));

      expect(bodyOf()).toHaveFocus();

      heights.overflowing = false;
      act(() => observers[0].callback());

      expect(panelOf()).toHaveFocus();
      expect(bodyOf()).not.toHaveAttribute("tabindex");
    });

    it("an open dialog renders nothing on the server, then hydrates without mismatch, portals and moves focus to its first control", async () => {
      const element = renderModal({ open: true, onEscape: () => {}, children: field });
      const html = renderToString(element);
      const host = document.createElement("div");

      expect(html).toBe("");
      host.innerHTML = html;
      document.body.append(host);

      let root: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        root = hydrateRoot(host, element);
      });

      expect(panelOf()).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveFocus();

      act(() => root?.unmount());
      host.remove();
    });
  });
};
