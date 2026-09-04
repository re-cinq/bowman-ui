import * as bowman from "@re-cinq/bowman-ui";
import {
  CheckIcon,
  ChatMessage,
  ChatMessageList,
  CopyIcon,
  IconWrapper,
  SendIcon,
  type ChatAttribution,
} from "@re-cinq/bowman-ui";
import {
  fixtureAiDisclosure,
  fixtureAssistantEntry,
  fixtureEntries,
  fixturePersonaId,
  fixturePersonaName,
  fixtureUserEntry,
  fixtureUserInitials,
} from "../src/fixtures";

// The attribution map is a plain object literal with an element-valued avatar:
// the shape a server component CAN pass to a client component, unlike the
// function prop app/compose/page.tsx measured being rejected.
const attribution: Readonly<Record<string, ChatAttribution>> = {
  [fixturePersonaId]: { name: fixturePersonaName, avatar: <CheckIcon /> },
};

export default function Page() {
  return (
    <main>
      <h1>bowman-ui RSC fixture</h1>
      <p data-testid="export-count">
        {Object.keys(bowman).length} runtime exports
      </p>
      <SendIcon ariaLabel="Send" />
      <CopyIcon />
      <CheckIcon />
      <IconWrapper>
        <path d="M4 12h16" />
      </IconWrapper>
      <ChatMessage
        entry={fixtureUserEntry}
        userInitials={fixtureUserInitials}
      />
      <ChatMessage
        entry={fixtureAssistantEntry}
        userInitials={fixtureUserInitials}
      />
      <ChatMessageList
        entries={fixtureEntries}
        userInitials={fixtureUserInitials}
        labels={{ aiDisclosure: fixtureAiDisclosure }}
        attribution={attribution}
      />
    </main>
  );
}
