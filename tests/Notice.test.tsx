/**
 * Notice (specs/bowman-ui-form-dialog-notice/spec.md § Notice): an inline
 * status or alert whose tone colours only its icon and left border, with an
 * optional dismiss button and no open state of its own.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { Notice, defaultNoticeLabels, type NoticeTone } from "../src/index.js";
import {
  expectBorder,
  expectSurface,
  expectTextBody,
  expectTextStrong,
  expectToneColour,
} from "./helpers/expect-theme-tokens.js";

const ICON_PATHS: Record<NoticeTone, string> = {
  info: "M13 16h-1v-4h-1m1-4h.01",
  success: "M5 13l4 4L19 7",
  warning: "M12 9v2m0 4h.01",
  error: "M10 14l2-2m0 0l2-2",
};

describe("Notice", () => {
  it('defaultNoticeLabels is frozen and equals { dismissNotice: "Dismiss" }', () => {
    expect(Object.isFrozen(defaultNoticeLabels)).toBe(true);
    expect(defaultNoticeLabels).toEqual({ dismissNotice: "Dismiss" });
  });

  it.each([
    ["info", "status"],
    ["success", "status"],
    ["warning", "alert"],
    ["error", "alert"],
  ] as const)(
    'tone="%s" renders role="%s" on an inner wrapper around its aria-hidden icon, heading and children',
    (tone, role) => {
      const { container } = render(
        <Notice tone={tone} heading="4711">
          4712
        </Notice>
      );
      const region = screen.getByRole(role);
      const icon = region.querySelector("svg");

      expect(container.firstElementChild).not.toHaveAttribute("role");
      expect(region.parentElement).toBe(container.firstElementChild);
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon?.querySelector("path")?.getAttribute("d")).toContain(ICON_PATHS[tone]);
      expect(region).toHaveTextContent("47114712");
    }
  );

  it.each(["info", "success", "warning", "error"] as const)(
    'tone="%s" colours the container\'s icon and 4px left border only, on SURFACE inside BORDER',
    (tone) => {
      const { container } = render(<Notice tone={tone}>4712</Notice>);
      const notice = container.firstElementChild;

      expectToneColour(notice, tone);
      expectSurface(notice);
      expectBorder(notice);
    }
  );

  it("heading renders in a bold TEXT_STRONG <span>, never a heading element, and children in TEXT_BODY", () => {
    render(
      <Notice tone="info" heading="4711">
        <span data-testid="body">4712</span>
      </Notice>
    );
    const heading = screen.getByText("4711");

    expect(heading.tagName).toBe("SPAN");
    expect(heading).toHaveClass("font-semibold");
    expectTextStrong(heading);
    expectTextBody(screen.getByTestId("body").parentElement);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("without heading, no heading span renders", () => {
    const { container } = render(<Notice tone="info">4712</Notice>);

    expect(container.querySelector(".font-semibold")).toBeNull();
  });

  it("without onDismiss, no button renders", () => {
    render(<Notice tone="error">4712</Notice>);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it('with onDismiss, a ghost IconButton named "Dismiss" sits outside the live region and calls onDismiss', () => {
    const onDismiss = vi.fn();

    render(
      <Notice tone="warning" onDismiss={onDismiss}>
        4712
      </Notice>
    );
    const dismiss = screen.getByRole("button", { name: "Dismiss" });

    expect(screen.getByRole("alert")).not.toContainElement(dismiss);
    fireEvent.click(dismiss);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('labels={{ dismissNotice: "Luk" }} names the dismiss button', () => {
    render(
      <Notice tone="info" onDismiss={vi.fn()} labels={{ dismissNotice: "Luk" }}>
        4712
      </Notice>
    );

    expect(screen.getByRole("button", { name: "Luk" })).toBeInTheDocument();
  });
});
