import { render, screen } from "@testing-library/react";
import { InlineThinkingIndicator, defaultInlineThinkingIndicatorLabels } from "../src/index.js";
import { expectThinkingDots } from "./helpers/expect-thinking-dots.js";

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

    expectThinkingDots(container);
  });

  it('defaultInlineThinkingIndicatorLabels is frozen and holds exactly { thinking: "Thinking" }', () => {
    expect(Object.isFrozen(defaultInlineThinkingIndicatorLabels)).toBe(true);
    expect(defaultInlineThinkingIndicatorLabels).toEqual({ thinking: "Thinking" });
  });
});
