import * as bowman from "@re-cinq/bowman-ui";
import { CheckIcon, ChatMessage, CopyIcon, IconWrapper, SendIcon } from "@re-cinq/bowman-ui";
import { fixtureAssistantEntry, fixtureUserEntry, fixtureUserInitials } from "../src/fixtures";

export default function Page() {
  return (
    <main>
      <h1>bowman-ui RSC fixture</h1>
      <p data-testid="export-count">{Object.keys(bowman).length} runtime exports</p>
      <SendIcon ariaLabel="Send" />
      <CopyIcon />
      <CheckIcon />
      <IconWrapper>
        <path d="M4 12h16" />
      </IconWrapper>
      <ChatMessage entry={fixtureUserEntry} userInitials={fixtureUserInitials} />
      <ChatMessage entry={fixtureAssistantEntry} userInitials={fixtureUserInitials} />
    </main>
  );
}
