import { render, screen } from "@testing-library/react";
import { InlineThinkingIndicator, defaultInlineThinkingIndicatorLabels } from "../src/index.js";

describe("InlineThinkingIndicator", () => {
  it('renders the default label "Thinking" with no labels prop', () => {
    render(<InlineThinkingIndicator />);

    expect(screen.getByText("Thinking")).toBeInTheDocument();
  });

  it("labels.thinking overrides the default", () => {
    render(<InlineThinkingIndicator labels={{ thinking: "Tænker" }} />);

    expect(screen.getByText("Tænker")).toBeInTheDocument();
    expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
  });

  it("renders three bowman-fade-dot dots with staggered animation delays", () => {
    const { container } = render(<InlineThinkingIndicator />);

    const dots = [...container.querySelectorAll(".bowman-fade-dot")];
    expect(dots.map((dot) => (dot as HTMLElement).style.animationDelay)).toEqual([
      "0s",
      "0.2s",
      "0.4s",
    ]);
  });

  it('defaultInlineThinkingIndicatorLabels is frozen and holds exactly { thinking: "Thinking" }', () => {
    expect(Object.isFrozen(defaultInlineThinkingIndicatorLabels)).toBe(true);
    expect(defaultInlineThinkingIndicatorLabels).toEqual({ thinking: "Thinking" });
  });
});
