import { fireEvent, render, screen } from "@testing-library/react";
import { ChatCard, defaultChatCardLabels } from "../src/index.js";
import type { CardChatEntry } from "../src/index.js";

const deliveryCard: CardChatEntry = {
  id: "c1",
  role: "card",
  kind: "delivery_card",
  data: { shipmentReference: "SHP-2026-000123", statusCode: "LEVERET" },
};

const describeDelivery = (entry: CardChatEntry) => (
  <p>{String(entry.data.shipmentReference)} er leveret</p>
);

describe("ChatCard", () => {
  it("draws describeCard's body for SHP-2026-000123 inside an article named Card", () => {
    render(<ChatCard entry={deliveryCard} describeCard={describeDelivery} />);

    expect(screen.getByRole("article", { name: "Card" })).toHaveTextContent(
      "SHP-2026-000123 er leveret"
    );
  });

  it("shows the cardUnavailable label and nothing from data when no describeCard is given", () => {
    const { container } = render(<ChatCard entry={deliveryCard} />);

    expect({
      unavailable: screen.getByText(defaultChatCardLabels.cardUnavailable).textContent,
      leaked: ["SHP-2026-000123", "LEVERET", "delivery_card"].filter((text) =>
        container.innerHTML.includes(text)
      ),
    }).toEqual({ unavailable: "This card could not be shown", leaked: [] });
  });

  it("rates card c1 up through onFeedback, presses that thumb and shows the notice", () => {
    const ratings: [string, string][] = [];

    render(
      <ChatCard
        entry={deliveryCard}
        describeCard={describeDelivery}
        onFeedback={(entryId, type) => ratings.push([entryId, type])}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Good response" }));

    expect({
      ratings,
      pressed: screen.getByRole("button", { name: "Good response" }).getAttribute("aria-pressed"),
      notice: screen.getByText("Thanks!").textContent,
    }).toEqual({ ratings: [["c1", "up"]], pressed: "true", notice: "Thanks!" });
  });

  it("shows the cardUnavailable label when describeCard returns null for a kind it does not draw", () => {
    render(
      <ChatCard entry={{ ...deliveryCard, kind: "invoice_card" }} describeCard={() => null} />
    );

    expect(screen.getByRole("article", { name: "Card" })).toHaveTextContent(
      "This card could not be shown"
    );
  });

  it("starts unrated when handed card c2 after card c1 was rated up", () => {
    const { rerender } = render(<ChatCard entry={deliveryCard} describeCard={describeDelivery} />);

    fireEvent.click(screen.getByRole("button", { name: "Good response" }));
    rerender(<ChatCard entry={{ ...deliveryCard, id: "c2" }} describeCard={describeDelivery} />);

    expect({
      pressed: screen.getByRole("button", { name: "Good response" }).getAttribute("aria-pressed"),
      notice: screen.queryByText("Thanks!"),
    }).toEqual({ pressed: "false", notice: null });
  });

  it("renders no thumbs when showFeedback is false", () => {
    render(<ChatCard entry={deliveryCard} describeCard={describeDelivery} showFeedback={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("names the article and the fallback from the labels it is given", () => {
    render(
      <ChatCard
        entry={deliveryCard}
        labels={{ card: "Leveringskort", cardUnavailable: "Kortet kan ikke vises" }}
      />
    );

    expect(screen.getByRole("article", { name: "Leveringskort" })).toHaveTextContent(
      "Kortet kan ikke vises"
    );
  });
});
