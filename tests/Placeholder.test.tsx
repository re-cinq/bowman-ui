import { render, screen } from "@testing-library/react";
import { Placeholder } from "../src/Placeholder.js";

it("renders the placeholder span with data-placeholder", () => {
  render(<Placeholder />);
  const span = screen.getByText("bowman-ui scaffold placeholder");
  expect(span).toHaveAttribute("data-placeholder", "true");
});
