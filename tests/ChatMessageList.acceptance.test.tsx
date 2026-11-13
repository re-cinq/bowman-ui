import { render, screen } from "@testing-library/react";
import { ChatMessageList } from "../src/index.js";
import { expect, it } from "vitest";

it("renders the transcript without crashing when Chrome translation mutates the empty state", () => {
  const { rerender } = render(
    <ChatMessageList
      entries={[]}
      userInitials="LM"
      labels={{
        aiDisclosure: "Disclosure",
      }}
      greeting="Hello world"
      prompts={null}
    />
  );

  const container = screen.getByText("Hello world").closest("div");

  expect(container).not.toBeNull();

  // Find the text node "Hello world"
  const textNodes: ChildNode[] = [];

  container!.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue === "Hello world") {
      textNodes.push(node);
    }
  });

  expect(textNodes.length).toBe(1);
  const textNode = textNodes[0];

  // Simulate Chrome Translate: replace the text node with <font><font>Hello world</font></font>
  const fontOuter = document.createElement("font");
  const fontInner = document.createElement("font");

  fontInner.textContent = "Hello world";
  fontOuter.appendChild(fontInner);

  textNode.replaceWith(fontOuter);

  // Rerender with a message to transition from empty state to transcript
  expect(() => {
    rerender(
      <ChatMessageList
        entries={[
          {
            id: "1",
            role: "user",
            content: "My first message",
          },
        ]}
        userInitials="LM"
        labels={{
          aiDisclosure: "Disclosure",
        }}
        greeting="Hello world"
        prompts={null}
      />
    );
  }).not.toThrow();

  expect(screen.getByText("My first message")).toBeInTheDocument();
});
