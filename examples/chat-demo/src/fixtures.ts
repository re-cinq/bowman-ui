import type { AssistantChatEntry, ConversationListItem, UserChatEntry } from "@re-cinq/bowman-ui";

export type DemoEntry = UserChatEntry | AssistantChatEntry;

export const demoUserInitials = "MV";

export const conversations: ReadonlyArray<ConversationListItem> = [
  { id: "samtale-1", title: "Ombooking af HK-4821-XQ", timestamp: "i dag kl. 09.14" },
  { id: "samtale-2", title: "Bagage til Skagerakøen", timestamp: "i går kl. 16.02" },
  { id: "samtale-3", title: "Ny samtale", timestamp: "i dag kl. 10.31" },
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

export const initialEntriesByConversation: Record<string, ReadonlyArray<DemoEntry>> = {
  "samtale-1": [
    userEntry(
      "s1-b1",
      "Hej, jeg vil gerne flytte min afrejse for reservation HK-4821-XQ til en uge senere."
    ),
    assistantEntry(
      "s1-b2",
      "Hej Mille! Det kan vi sagtens se på. Din reservation **HK-4821-XQ** gælder to personer fra Nordhavnsbro til Skagerakøen. Vil du beholde samme afgangstidspunkt?"
    ),
    userEntry("s1-b3", "Ja tak, samme tidspunkt hvis muligt. Koster det noget at flytte den?"),
    assistantEntry(
      "s1-b4",
      "Med billettypen Fleksibel kan datoen flyttes uden gebyr. Det korte overblik:\n\n- Ny afrejse: en uge senere, samme afgangstidspunkt\n- Prisforskel: 0 kr.\n- Pladserne: de samme som før\n\nDu kan læse mere i vores [rejsebetingelser](https://havkat-rejser.invalid/betingelser)."
    ),
    userEntry("s1-b5", "Perfekt, så vil jeg gerne bekræfte flytningen."),
    assistantEntry(
      "s1-b6",
      "Så er datoen flyttet! Du modtager en opdateret rejseplan for **HK-4821-XQ** inden for et par minutter. Er der andet, jeg kan hjælpe med?"
    ),
    userEntry("s1-b7", "Kan jeg også tilføje en kahyt til overfarten?"),
    assistantEntry(
      "s1-b8",
      "Der er stadig ledige kahytter på afgangen. En standardkahyt til to personer koster 349 kr. for hele overfarten. Sig til, hvis jeg skal lægge den til reservationen."
    ),
  ],
  "samtale-2": [
    userEntry("s2-b1", "Hvor meget bagage må jeg tage med til Skagerakøen?"),
    assistantEntry(
      "s2-b2",
      "Du må tage én kuffert på op til 23 kg og én håndbagage på op til 8 kg med per person. Cykler og barnevogne skal meldes til på forhånd."
    ),
  ],
  "samtale-3": [],
};

export const createAssistantReply = (id: string): AssistantChatEntry =>
  assistantEntry(
    id,
    "Tak for din besked! Jeg har noteret den på din sag, og en kollega vender tilbage hurtigst muligt. Dette er et fast demosvar fra en fixture."
  );
