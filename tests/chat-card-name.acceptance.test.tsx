import { render, screen } from "@testing-library/react";
import { ChatCard, ChatMessageList, defaultChatCardLabels } from "../src/index.js";
import type { CardChatEntry } from "../src/index.js";

const invoiceCard: CardChatEntry = {
  id: "c1",
  role: "card",
  kind: "invoice_card",
  data: { amount: 100 },
};

const deliveryCard: CardChatEntry = {
  id: "c2",
  role: "card",
  kind: "delivery_card",
  data: { shipmentReference: "SHP" },
};

describe("ChatCard accessible name", () => {
  it("carries the name from describeCardName when provided", () => {
    const describeCardName = (entry: CardChatEntry) =>
      entry.kind === "invoice_card" ? "Invoice Card" : "Delivery Card";

    render(<ChatCard entry={invoiceCard} describeCardName={describeCardName} />);
    expect(screen.getByRole("article", { name: "Invoice Card" })).toBeInTheDocument();
  });

  it("keeps labels.card when describeCardName is absent or returns undefined", () => {
    const { rerender } = render(<ChatCard entry={invoiceCard} />);

    expect(screen.getByRole("article", { name: defaultChatCardLabels.card })).toBeInTheDocument();

    const describeCardName = () => undefined;

    rerender(<ChatCard entry={invoiceCard} describeCardName={describeCardName} />);
    expect(screen.getByRole("article", { name: defaultChatCardLabels.card })).toBeInTheDocument();
  });

  it("assigns different names to different cards in a ChatMessageList", () => {
    const describeCardName = (entry: CardChatEntry) =>
      entry.kind === "invoice_card" ? "Invoice 123" : "Delivery 456";

    render(
      <ChatMessageList
        entries={[invoiceCard, deliveryCard]}
        describeCardName={describeCardName}
        userInitials="U"
        labels={{ aiDisclosure: "ai" }}
      />
    );

    expect(screen.getByRole("article", { name: "Invoice 123" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Delivery 456" })).toBeInTheDocument();
  });

  it("falls back to labels.card for ChatMessageList when describeCardName returns undefined", () => {
    const describeCardName = (entry: CardChatEntry) =>
      entry.kind === "invoice_card" ? "Invoice 123" : undefined;

    render(
      <ChatMessageList
        entries={[invoiceCard, deliveryCard]}
        describeCardName={describeCardName}
        userInitials="U"
        labels={{ aiDisclosure: "ai" }}
      />
    );

    expect(screen.getByRole("article", { name: "Invoice 123" })).toBeInTheDocument();
    // Delivery card should have the default card label
    expect(screen.getAllByRole("article", { name: defaultChatCardLabels.card })).toHaveLength(1);
  });
});
