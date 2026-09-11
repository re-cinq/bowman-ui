/**
 * Acceptance tests for semantic theming tokens (issue 85).
 * Each test asserts that a brand-adjacent surface references a CSS custom
 * property token in its class string rather than a hardcoded Tailwind palette
 * name. Token-referencing classes (e.g. bg-(--bowman-accent)) let a consumer
 * rebrand by overriding the token; hardcoded palette classes (bg-blue-500) do
 * not.
 */
import { fireEvent, render } from "@testing-library/react";
import { ChatComposer, ChatMessage } from "../src/index.js";
import type { AssistantChatEntry } from "../src/index.js";

// specs/bowman-ui-stylesheet-entry — no linked spec; defined by issue 85.

const streamingEntry = (): AssistantChatEntry => ({
  id: "entry-theming-1",
  role: "assistant",
  content: "",
  isStreaming: true,
});

describe("semantic theming tokens", () => {
  it("ChatComposer send button class string references --bowman-accent, not a hardcoded palette name", () => {
    const { getByRole } = render(<ChatComposer onSubmit={vi.fn()} />);

    fireEvent.change(getByRole("textbox"), { target: { value: "Hola" } });
    const sendButton = getByRole("button", { name: "Send message" });

    expect(sendButton.className).toContain("--bowman-accent");
  });

  it("streaming assistant avatar circle class string references --bowman-accent-soft, not a hardcoded palette name", () => {
    const { container } = render(<ChatMessage entry={streamingEntry()} userInitials="A" />);
    const avatarCircle = container.querySelector(".bowman-pulse-subtle");

    expect(avatarCircle).not.toBeNull();
    expect((avatarCircle as HTMLElement).className).toContain("--bowman-accent-soft");
  });
});
