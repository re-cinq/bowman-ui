import type {
  AssistantChatEntry,
  ConversationListItem,
  UserChatEntry,
} from "@re-cinq/bowman-ui";

export type DemoEntry = UserChatEntry | AssistantChatEntry;

export const demoUserInitials = "MW";

export const conversations: ReadonlyArray<ConversationListItem> = [
  {
    id: "conversation-1",
    title: "Delivery change for MB-4821-XQ",
    timestamp: "today at 09:14",
  },
  {
    id: "conversation-2",
    title: "Damaged copy of The Cartographer's Atlas",
    timestamp: "yesterday at 16:02",
  },
  {
    id: "conversation-3",
    title: "New conversation",
    timestamp: "today at 10:31",
  },
];

const assistantEntry = (id: string, content: string): AssistantChatEntry => ({
  id,
  role: "assistant",
  content,
  isStreaming: false,
});

const userEntry = (id: string, content: string): UserChatEntry => ({
  id,
  role: "user",
  content,
});

export const initialEntriesByConversation: Record<
  string,
  ReadonlyArray<DemoEntry>
> = {
  "conversation-1": [
    userEntry(
      "c1-m1",
      "Hi, I would like to move the delivery of order MB-4821-XQ to a week later.",
    ),
    assistantEntry(
      "c1-m2",
      "Hi Margot! We can certainly look at that. Your order **MB-4821-XQ** covers two books shipping to your home address. Would you like to keep the same delivery slot?",
    ),
    userEntry(
      "c1-m3",
      "Yes please, the same slot if possible. Does it cost anything to move it?",
    ),
    assistantEntry(
      "c1-m4",
      "With the Flexible delivery option the date can be moved at no charge. The short version:\n\n- New delivery: a week later, same slot\n- Price difference: nothing\n- The books: the same two as before\n\nYou can read more in our [delivery terms](https://marginalia-books.invalid/delivery-terms).",
    ),
    userEntry("c1-m5", "Perfect, then I would like to confirm the change."),
    assistantEntry(
      "c1-m6",
      "The date is moved! You will receive an updated order confirmation for **MB-4821-XQ** within a few minutes. Is there anything else I can help with?",
    ),
    userEntry("c1-m7", "Could you also add gift wrapping to the order?"),
    assistantEntry(
      "c1-m8",
      "Gift wrapping is still available for that order. Wrapping both books costs €3.50 and includes a handwritten card. Say the word and I will add it to the order.",
    ),
  ],
  "conversation-2": [
    userEntry(
      "c2-m1",
      "My copy of The Cartographer's Atlas arrived with a torn dust jacket. Can I get a replacement?",
    ),
    assistantEntry(
      "c2-m2",
      "Sorry to hear that! We will send a replacement copy of *The Cartographer's Atlas* free of charge. There is no need to return the damaged one - keep it or pass it on.",
    ),
  ],
  "conversation-3": [],
};

export const streamedReplyText =
  "Thanks for your message! I have noted it on your file and I am going through the options for " +
  "you now. Marginalia Books restocks The Cartographer's Atlas every week, and there are copies " +
  "in stock now, with the next delivery arriving on Friday for the rest of the order. The " +
  "Flexible delivery option lets you move a delivery date at no charge, as long as the change is " +
  "made at least a day before dispatch. If you would rather add gift wrapping, I can add it to " +
  "the order for both books. Do say if you would like an updated order confirmation sent to you " +
  "right away. This is a canned demo reply from a fixture.";

export const createStreamingAssistantEntry = (
  id: string,
): AssistantChatEntry => ({
  id,
  role: "assistant",
  content: "",
  isStreaming: true,
});
