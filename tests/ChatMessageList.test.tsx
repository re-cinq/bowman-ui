import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef } from "react";
import {
  ChatMessageList,
  defaultChatMessageLabels,
  defaultChatMessageListLabels,
  defaultThinkingIndicatorLabels,
  defaultThinkingTraceLabels,
  defaultToolActivityLabels,
} from "../src/index.js";
import type {
  AssistantChatEntry,
  ChatMessageListHandle,
  ThinkingChatEntry,
  ToolChatEntry,
  UserChatEntry,
} from "../src/index.js";

const aiDisclosure = "Estás chateando con un asistente de IA";

const userEntry = (id: string, content: string): UserChatEntry => ({
  id,
  role: "user",
  content,
});

const assistantEntry = (id: string, content: string): AssistantChatEntry => ({
  id,
  role: "assistant",
  content,
  isStreaming: false,
});

const toolEntry = (id: string): ToolChatEntry => ({
  id,
  role: "tool",
  toolName: "get_weather",
  toolInput: { location: "Berlin", units: "celsius" },
});

const thinkingEntry = (id: string, isStreaming = false): ThinkingChatEntry => ({
  id,
  role: "thinking",
  content: "Estoy consultando el pedido 4711 con get_weather",
  isStreaming,
});

const twoEntries = [
  userEntry("u1", "Ver pedido 4711"),
  assistantEntry("a1", "Booking 4711 er fundet"),
];

const threeEntries = [...twoEntries, assistantEntry("a2", "Segunda respuesta")];

// jsdom performs no layout: Element.prototype has no scrollTo (nor
// scrollIntoView), and scrollHeight/clientHeight read 0. The stubs below
// exist because of that - the prototype stub makes scrollTo observable at
// all, and the geometry stubs make the pinning arithmetic non-trivial.
let scrollToMock: ReturnType<typeof vi.fn>;

const installScrollTo = () => {
  scrollToMock = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    writable: true,
    value: scrollToMock,
  });
};

const installMountGeometry = () => {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => 1200,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => 400,
  });
};

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
  Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
  Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
});

const stubGeometry = (
  element: Element,
  { scrollHeight = 1200, clientHeight = 400 }: { scrollHeight?: number; clientHeight?: number } = {}
) => {
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
};

const regionOf = () => screen.getByRole("log");

describe("ChatMessageList", () => {
  describe("the empty state", () => {
    it("entries [] with busy false renders greeting and prompts and no ChatMessage", () => {
      render(
        <ChatMessageList
          entries={[]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          greeting={<div data-testid="greeting">God morgen</div>}
          prompts={<div data-testid="prompts">Se min booking</div>}
        />
      );

      expect(screen.getByTestId("greeting")).toBeInTheDocument();
      expect(screen.getByTestId("prompts")).toBeInTheDocument();
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
    });

    it("one entry renders the transcript and neither slot", () => {
      render(
        <ChatMessageList
          entries={[userEntry("u1", "Ver pedido 4711")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          greeting={<div data-testid="greeting">God morgen</div>}
          prompts={<div data-testid="prompts">Se min booking</div>}
        />
      );

      expect(screen.getByRole("article")).toBeInTheDocument();
      expect(screen.queryByTestId("greeting")).not.toBeInTheDocument();
      expect(screen.queryByTestId("prompts")).not.toBeInTheDocument();
    });

    it("entries [] with busy true renders the indicator instead of the slots", () => {
      render(
        <ChatMessageList
          entries={[]}
          userInitials="LM"
          busy
          labels={{ aiDisclosure }}
          greeting={<div data-testid="greeting">God morgen</div>}
        />
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByTestId("greeting")).not.toBeInTheDocument();
    });
  });

  describe("the AI disclosure", () => {
    it("renders the resolved aiDisclosure outside the role=log region in both states", () => {
      const empty = render(
        <ChatMessageList entries={[]} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(within(empty.container).getByText(aiDisclosure)).toBeInTheDocument();
      expect(empty.getByRole("log").contains(empty.getByText(aiDisclosure))).toBe(false);
      empty.unmount();

      const filled = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(within(filled.container).getByText(aiDisclosure)).toBeInTheDocument();
      expect(filled.getByRole("log").contains(filled.getByText(aiDisclosure))).toBe(false);
    });

    it("stays rendered with every optional prop set to false or undefined", () => {
      render(
        <ChatMessageList
          entries={[]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          assistantAvatar={undefined}
          busy={false}
          greeting={undefined}
          prompts={undefined}
          showFeedback={false}
          arrowKeyFeedback={false}
          markdown={undefined}
          reducedMotion={false}
          renderEntryFooter={undefined}
          onCopy={undefined}
          onFeedback={undefined}
        />
      );

      expect(screen.getByText(aiDisclosure)).toBeInTheDocument();
    });

    it("labels with only aiDisclosure resolves every other label to its default", () => {
      render(<ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />);

      expect(screen.getByRole("log")).toHaveAccessibleName("Conversation");
      expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
    });

    it("defaultChatMessageListLabels is frozen, carries no aiDisclosure, and unions the inherited defaults with transcript", () => {
      expect(Object.isFrozen(defaultChatMessageListLabels)).toBe(true);
      expect(defaultChatMessageListLabels).toEqual({
        ...defaultChatMessageLabels,
        ...defaultThinkingIndicatorLabels,
        ...defaultThinkingTraceLabels,
        ...defaultToolActivityLabels,
        transcript: "Conversation",
      });
      expect(Object.keys(defaultChatMessageListLabels)).not.toContain("aiDisclosure");
    });
  });

  describe("forwarding to ChatMessage", () => {
    it("two entries render two ChatMessages in entries order and copy on the second reports that entry's id", () => {
      const onCopy = vi.fn();
      const entries = [
        assistantEntry("a1", "Primera respuesta"),
        assistantEntry("a2", "Segunda respuesta"),
      ];

      render(
        <ChatMessageList
          entries={entries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          onCopy={onCopy}
        />
      );

      const articles = screen.getAllByRole("article");

      expect(articles).toHaveLength(2);
      expect(articles[0]).toHaveTextContent("Primera respuesta");
      expect(articles[1]).toHaveTextContent("Segunda respuesta");

      fireEvent.click(within(articles[1]).getByRole("button", { name: "Copy message" }));

      expect(onCopy).toHaveBeenCalledExactlyOnceWith("Segunda respuesta", "a2");
    });

    it("userInitials, showFeedback and arrowKeyFeedback pass through unchanged", () => {
      const onFeedback = vi.fn();
      const { rerender } = render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          showFeedback={false}
        />
      );

      expect(screen.getByText("LM")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Good response" })).not.toBeInTheDocument();

      rerender(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          arrowKeyFeedback
          onFeedback={onFeedback}
        />
      );
      fireEvent.keyDown(screen.getAllByRole("article")[1], { key: "ArrowUp" });

      expect(onFeedback).toHaveBeenCalledExactlyOnceWith("a1", "up");
    });

    it("the markdown policy forwards to the assistant markdown", () => {
      const entries = [assistantEntry("a1", "[42](https://4711.example/42)")];
      const { rerender } = render(
        <ChatMessageList entries={entries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(screen.getByRole("link", { name: /42/ })).toHaveAttribute("target", "_blank");

      rerender(
        <ChatMessageList
          entries={entries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          markdown={{ linkTarget: "_self" }}
        />
      );
      expect(screen.getByRole("link", { name: /42/ })).not.toHaveAttribute("target");
    });

    it("assistantAvatar reaches both the message circle and the busy indicator", () => {
      render(
        <ChatMessageList
          entries={[assistantEntry("a1", "Respuesta")]}
          userInitials="LM"
          busy
          labels={{ aiDisclosure }}
          assistantAvatar={<span data-testid="mark">4711</span>}
        />
      );

      expect(screen.getAllByTestId("mark")).toHaveLength(2);
      expect(within(screen.getByRole("status")).getByTestId("mark")).toBeInTheDocument();
    });

    it("entries are keyed by entry.id: reordering moves the same DOM nodes", () => {
      const first = assistantEntry("a1", "Primera respuesta");
      const second = assistantEntry("a2", "Segunda respuesta");
      const { rerender } = render(
        <ChatMessageList entries={[first, second]} userInitials="LM" labels={{ aiDisclosure }} />
      );
      const secondNode = screen.getAllByRole("article")[1];

      rerender(
        <ChatMessageList entries={[second, first]} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(screen.getAllByRole("article")[0]).toBe(secondNode);
    });
  });

  describe("renderEntryFooter", () => {
    const footerFor = (entry: UserChatEntry | AssistantChatEntry) => (
      <div data-testid="entry-footer" data-entry-id={entry.id}>
        Score 0.82
      </div>
    );

    it("a node returned for the assistant entry only renders once, carries that entry's id, and is the column's last child after the action row", () => {
      render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          renderEntryFooter={(entry) => (entry.role === "assistant" ? footerFor(entry) : undefined)}
        />
      );

      const footers = screen.getAllByTestId("entry-footer");

      expect(footers).toHaveLength(1);
      expect(footers[0]).toHaveAttribute("data-entry-id", "a1");
      const column = footers[0].parentElement;
      const copyButton = screen.getByRole("button", { name: "Copy message" });

      expect(column?.contains(copyButton)).toBe(true);
      expect(column?.lastElementChild).toBe(footers[0]);
      expect(
        copyButton.compareDocumentPosition(footers[0]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("runs once per rendered ChatMessage per render, in entries order, with the user entry included", () => {
      const renderEntryFooter = vi.fn((entry: UserChatEntry | AssistantChatEntry) => (
        <span data-testid="entry-footer">{entry.id}</span>
      ));

      render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          busy
          labels={{ aiDisclosure }}
          renderEntryFooter={renderEntryFooter}
        />
      );

      expect(renderEntryFooter.mock.calls).toEqual([[twoEntries[0]], [twoEntries[1]]]);
    });

    it("a node returned for the user entry is dropped: ChatMessage's footer slot is assistant-only", () => {
      render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          renderEntryFooter={footerFor}
        />
      );

      const footers = screen.getAllByTestId("entry-footer");

      expect(footers).toHaveLength(1);
      expect(footers[0]).toHaveAttribute("data-entry-id", "a1");
    });

    it("returning undefined for every entry renders the same container.innerHTML as omitting the prop", () => {
      const omitted = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );
      const withoutProp = omitted.container.innerHTML;

      omitted.unmount();

      const { container } = render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          renderEntryFooter={() => undefined}
        />
      );

      expect(container.innerHTML).toBe(withoutProp);
    });

    it("a footer under every entry leaves the AI disclosure first in the root and outside the role=log region", () => {
      const { container } = render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          renderEntryFooter={footerFor}
        />
      );

      const band = screen.getByText(aiDisclosure);

      expect(container.firstElementChild?.firstElementChild).toBe(band);
      expect(screen.getByRole("log").contains(band)).toBe(false);
    });

    it("the returned node is not retained: a rerender without the prop leaves no footer", () => {
      const { rerender } = render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          renderEntryFooter={footerFor}
        />
      );

      expect(screen.getByTestId("entry-footer")).toBeInTheDocument();

      rerender(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(screen.queryByTestId("entry-footer")).not.toBeInTheDocument();
    });
  });

  describe("busy", () => {
    it("busy renders exactly one ThinkingIndicator after the last entry", () => {
      render(
        <ChatMessageList entries={twoEntries} userInitials="LM" busy labels={{ aiDisclosure }} />
      );

      const indicators = screen.getAllByRole("status");

      expect(indicators).toHaveLength(1);
      const articles = screen.getAllByRole("article");
      const lastArticle = articles[articles.length - 1];

      expect(
        lastArticle.compareDocumentPosition(indicators[0]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("busy false renders no ThinkingIndicator", () => {
      render(<ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("forwards the thinking and thinkingRegion labels to the indicator", () => {
      render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          busy
          labels={{ aiDisclosure, thinking: "Pensando", thinkingRegion: "Cargando respuesta" }}
        />
      );

      expect(screen.getByRole("status")).toHaveAccessibleName("Cargando respuesta");
      expect(within(screen.getByRole("status")).getByText("Pensando")).toBeInTheDocument();
    });
  });

  describe("attribution (121)", () => {
    const personaEntry = (id: string, content: string, persona: string): AssistantChatEntry => ({
      ...assistantEntry(id, content),
      persona,
    });

    const twoPersonas = {
      "olt-support": { name: "Facturación", avatar: <span data-testid="icon-a" /> },
      "p-two": { name: "Salg", avatar: <span data-testid="icon-b" /> },
    };

    it("two assistant entries with two personas render two names and two faces in one conversation", () => {
      render(
        <ChatMessageList
          entries={[
            personaEntry("a1", "Primera respuesta", "olt-support"),
            personaEntry("a2", "Segunda respuesta", "p-two"),
          ]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          attribution={twoPersonas}
        />
      );

      const [first, second] = screen.getAllByRole("article");

      expect(within(first).getByText("Facturación")).toBeInTheDocument();
      expect(within(first).getByTestId("icon-a")).toBeInTheDocument();
      expect(first).toHaveAttribute("aria-label", "Response from Facturación");
      expect(within(second).getByText("Salg")).toBeInTheDocument();
      expect(within(second).getByTestId("icon-b")).toBeInTheDocument();
      expect(second).toHaveAttribute("aria-label", "Response from Salg");
    });

    it('an entry whose persona "p-gone" is absent from attribution falls back to assistantAvatar, renders no name, and never prints the id', () => {
      const { container } = render(
        <ChatMessageList
          entries={[personaEntry("a1", "Respuesta", "p-gone")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          assistantAvatar={<span data-testid="default-mark" />}
          attribution={twoPersonas}
        />
      );

      expect(screen.getByTestId("default-mark")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-a")).not.toBeInTheDocument();
      expect(screen.getByRole("article")).toHaveAttribute("aria-label", "Assistant response");
      expect(container.innerHTML).not.toContain("p-gone");
    });

    it("attribution supplied with no entry carrying a persona renders identically to attribution omitted", () => {
      const withAttribution = render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          attribution={twoPersonas}
        />
      ).container;
      const without = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      ).container;

      expect(withAttribution.innerHTML).toBe(without.innerHTML);
    });

    it("entries carrying a persona render identically to the same entries without one when attribution is omitted", () => {
      const withPersona = render(
        <ChatMessageList
          entries={[personaEntry("a1", "Respuesta", "olt-support")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      ).container;
      const without = render(
        <ChatMessageList
          entries={[assistantEntry("a1", "Respuesta")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      ).container;

      expect(withPersona.innerHTML).toBe(without.innerHTML);
    });

    it("with busy true, the thinking tail keeps the default assistantAvatar behind a trailing persona entry", () => {
      render(
        <ChatMessageList
          entries={[personaEntry("a1", "Respuesta", "olt-support")]}
          userInitials="LM"
          busy
          labels={{ aiDisclosure }}
          assistantAvatar={<span data-testid="default-mark" />}
          attribution={twoPersonas}
        />
      );

      const indicator = screen.getByRole("status");

      expect(within(indicator).getByTestId("default-mark")).toBeInTheDocument();
      expect(within(indicator).queryByTestId("icon-a")).not.toBeInTheDocument();
    });

    it("a human first name in attribution leaves the aiDisclosure line in place", () => {
      render(
        <ChatMessageList
          entries={[personaEntry("a1", "Respuesta", "olt-support")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          attribution={{ "olt-support": { name: "Mette", avatar: <span data-testid="icon-a" /> } }}
        />
      );

      expect(screen.getByText(aiDisclosure)).toBeInTheDocument();
      expect(screen.getByText("Mette")).toBeInTheDocument();
    });

    it("a persona resolving to a name but no avatar keeps the default assistantAvatar", () => {
      render(
        <ChatMessageList
          entries={[personaEntry("a1", "Respuesta", "olt-support")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          assistantAvatar={<span data-testid="default-mark" />}
          attribution={{ "olt-support": { name: "Facturación" } }}
        />
      );

      expect(screen.getByTestId("default-mark")).toBeInTheDocument();
      expect(screen.getByRole("article")).toHaveAttribute(
        "aria-label",
        "Response from Facturación"
      );
    });
  });

  describe("auto-scroll", () => {
    it("pinned at 1200/400/800, appending an entry calls scrollTo with top 1200 and behavior smooth", () => {
      installScrollTo();
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      regionOf().scrollTop = 800;
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });
    });

    it("unpinned after a scroll event at scrollTop 100, appending an entry calls scrollTo zero times", () => {
      installScrollTo();
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      regionOf().scrollTop = 100;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(scrollToMock).toHaveBeenCalledTimes(0);
    });

    it("a scroll event back to the bottom re-pins and the next append scrolls smooth again", () => {
      installScrollTo();
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      regionOf().scrollTop = 100;
      fireEvent.scroll(regionOf());
      regionOf().scrollTop = 800;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });
    });

    it("growing the last entry's content without changing entries.length scrolls with behavior auto", () => {
      installScrollTo();
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList
          entries={[twoEntries[0], assistantEntry("a1", "Pedido 4711 encontrado y confirmado")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "auto" });
    });

    it("reducedMotion true makes every call behavior auto, including the append case", () => {
      installScrollTo();
      const { rerender } = render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          reducedMotion
        />
      );

      stubGeometry(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList
          entries={threeEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          reducedMotion
        />
      );

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "auto" });
    });

    it("mount with three entries scrolls the region to the bottom without a prior scroll event", () => {
      installScrollTo();
      installMountGeometry();

      render(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "auto" });
    });

    it("busy turning on while pinned scrolls with behavior auto so the indicator stays visible", () => {
      installScrollTo();
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={twoEntries} userInitials="LM" busy labels={{ aiDisclosure }} />
      );

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "auto" });
    });

    it("with no scrollTo function on the region, the same append sets scrollTop to scrollHeight", () => {
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );
      const region = regionOf();

      expect(typeof region.scrollTo).toBe("undefined");
      stubGeometry(region);

      rerender(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(region.scrollTop).toBe(1200);
    });

    it("a scroll event at 32px from the bottom stays pinned; one at 33px unpins", () => {
      installScrollTo();
      const fourEntries = [...threeEntries, assistantEntry("a3", "Tercera respuesta")];
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      regionOf().scrollTop = 768;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );
      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });

      regionOf().scrollTop = 767;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={fourEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );
      expect(scrollToMock).toHaveBeenCalledTimes(0);
    });

    it("downward scroll events fired by an in-flight smooth scroll do not unpin; an upward one does", () => {
      installScrollTo();
      const fourEntries = [...threeEntries, assistantEntry("a3", "Tercera respuesta")];
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      stubGeometry(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={threeEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );
      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });

      regionOf().scrollTop = 600;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList entries={fourEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );
      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });

      regionOf().scrollTop = 300;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      rerender(
        <ChatMessageList
          entries={[...threeEntries, assistantEntry("a3", "Tercera respuesta, completada")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );
      expect(scrollToMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("the ref handle", () => {
    it("isPinnedToBottom is true at the bottom and false after a scroll event leaving 800px below", () => {
      const ref = createRef<ChatMessageListHandle>();

      render(
        <ChatMessageList
          ref={ref}
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );
      stubGeometry(regionOf());
      regionOf().scrollTop = 800;

      expect(ref.current?.isPinnedToBottom()).toBe(true);

      regionOf().scrollTop = 0;
      fireEvent.scroll(regionOf());

      expect(ref.current?.isPinnedToBottom()).toBe(false);
    });

    it("scrollToBottom scrolls while unpinned and re-pins, so the next append follows again", () => {
      installScrollTo();
      const ref = createRef<ChatMessageListHandle>();
      const { rerender } = render(
        <ChatMessageList
          ref={ref}
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );

      stubGeometry(regionOf());
      regionOf().scrollTop = 100;
      fireEvent.scroll(regionOf());
      scrollToMock.mockClear();

      act(() => ref.current?.scrollToBottom());
      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });

      scrollToMock.mockClear();
      rerender(
        <ChatMessageList
          ref={ref}
          entries={threeEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );
      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "smooth" });
    });

    it("scrollToBottom under reducedMotion scrolls with behavior auto", () => {
      installScrollTo();
      const ref = createRef<ChatMessageListHandle>();

      render(
        <ChatMessageList
          ref={ref}
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          reducedMotion
        />
      );
      stubGeometry(regionOf());
      scrollToMock.mockClear();

      act(() => ref.current?.scrollToBottom());

      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({ top: 1200, behavior: "auto" });
    });

    it("a handle retained past unmount is a no-op, not a crash", () => {
      const ref = createRef<ChatMessageListHandle>();
      const { unmount } = render(
        <ChatMessageList
          ref={ref}
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );
      const handle = ref.current;

      unmount();

      expect(() => handle?.scrollToBottom()).not.toThrow();
      expect(handle?.isPinnedToBottom()).toBe(false);
    });
  });

  describe("the scroll region semantics", () => {
    it('carries role="log", aria-live="off" and the resolved transcript label as its accessible name', () => {
      render(
        <ChatMessageList
          entries={twoEntries}
          userInitials="LM"
          labels={{ aiDisclosure, transcript: "Transcripción" }}
        />
      );

      const region = screen.getByRole("log");

      expect(region).toHaveAttribute("aria-live", "off");
      expect(region).toHaveAccessibleName("Transcripción");
    });

    it('a query for [aria-live="polite"] inside the region matches only when busy is true', () => {
      const { rerender } = render(
        <ChatMessageList entries={twoEntries} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(regionOf().querySelectorAll('[aria-live="polite"]')).toHaveLength(0);

      rerender(
        <ChatMessageList entries={twoEntries} userInitials="LM" busy labels={{ aiDisclosure }} />
      );
      expect(regionOf().querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
    });
  });

  describe("the source files (grep acceptance criteria)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ChatMessageList.tsx"),
      "utf8"
    );

    it("imports no @clerk, swr, next-intl, next/, @/ or lucide-react and every relative import ends in .js", () => {
      expect(source).not.toMatch(/@clerk|swr|next-intl|next\/|@\/|lucide-react/);
      const relativeImports = [...source.matchAll(/from\s+"(\.[^"]+)"/g)].map(([, spec]) => spec);

      expect(relativeImports.length).toBeGreaterThan(0);

      for (const spec of relativeImports) {
        expect(spec).toMatch(/\.js$/);
      }
    });

    it("calls no console, localStorage, sessionStorage, fetch, sendBeacon or scrollIntoView", () => {
      expect(source).not.toMatch(
        /console\.|localStorage|sessionStorage|fetch|sendBeacon|scrollIntoView/
      );
    });

    it("names renderEntryFooter three times - declaration, destructure, ChatMessage footer - and stores it nowhere", () => {
      expect(source.match(/renderEntryFooter/g)).toHaveLength(3);
      expect(source).toContain("footer={renderEntryFooter?.(entry)}");
      expect(source).not.toMatch(/JSON\.stringify|useState|renderEntryFooterRef/);
    });
  });

  describe("tool entries", () => {
    it("renders [user, tool, assistant] as one message, one activity, one message in order", () => {
      const { container } = render(
        <ChatMessageList
          entries={[
            userEntry("u1", "Ver pedido 4711"),
            toolEntry("t1"),
            assistantEntry("a1", "Booking 4711 er fundet"),
          ]}
          userInitials="LM"
          labels={{ aiDisclosure }}
        />
      );

      const column = container.querySelector(".max-w-3xl");
      const children = Array.from(column?.children ?? []);

      expect(children.map((child) => child.tagName)).toEqual(["ARTICLE", "DIV", "ARTICLE"]);
      expect(children[0]).toHaveTextContent("Ver pedido 4711");
      expect(children[1]).toHaveTextContent("Looked something up");
      expect(children[2]).toHaveTextContent("Booking 4711 er fundet");
    });

    it("busy true makes a trailing tool entry pending and busy false makes it done", () => {
      const entries = [userEntry("u1", "Ver pedido 4711"), toolEntry("t1")];
      const { rerender } = render(
        <ChatMessageList entries={entries} userInitials="LM" busy labels={{ aiDisclosure }} />
      );

      expect(screen.getByText("Looking something up")).toBeInTheDocument();

      rerender(<ChatMessageList entries={entries} userInitials="LM" labels={{ aiDisclosure }} />);
      expect(screen.getByText("Looked something up")).toBeInTheDocument();
      expect(screen.queryByText("Looking something up")).not.toBeInTheDocument();
    });

    it("a non-trailing tool entry stays done even while busy", () => {
      render(
        <ChatMessageList
          entries={[toolEntry("t1"), assistantEntry("a1", "Booking 4711 er fundet")]}
          userInitials="LM"
          busy
          labels={{ aiDisclosure }}
        />
      );

      expect(screen.getByText("Looked something up")).toBeInTheDocument();
      expect(screen.queryByText("Looking something up")).not.toBeInTheDocument();
    });

    it("a list holding a single tool entry still renders the aiDisclosure band", () => {
      render(
        <ChatMessageList entries={[toolEntry("t1")]} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(screen.getByText(aiDisclosure)).toBeInTheDocument();
    });

    it("forwards describeTool, showToolName, showToolInput and toolIcon to the activity", () => {
      const { container } = render(
        <ChatMessageList
          entries={[toolEntry("t1")]}
          userInitials="LM"
          labels={{ aiDisclosure }}
          describeTool={() => "Consultando tu pedido"}
          showToolName
          showToolInput
          toolIcon={<span data-testid="tool-icon">4711</span>}
        />
      );

      expect(screen.getByText("Consultando tu pedido")).toBeInTheDocument();
      expect(screen.getByText("get_weather")).toBeInTheDocument();
      expect(container.querySelector("pre")?.textContent).toContain('"location": "Berlin"');
      expect(screen.getByTestId("tool-icon")).toBeInTheDocument();
    });

    it("hands describeTool the same pending flag it derives for its own labels", () => {
      const entries = [userEntry("u1", "Ver pedido 4711"), toolEntry("t1"), toolEntry("t2")];
      const describeTool = (entry: ToolChatEntry, pending: boolean) =>
        pending ? "Looking up the weather" : "Looked up the weather";
      const { container, rerender } = render(
        <ChatMessageList
          entries={entries}
          userInitials="LM"
          busy
          labels={{ aiDisclosure }}
          describeTool={describeTool}
        />
      );

      const column = container.querySelector(".max-w-3xl");
      const children = Array.from(column?.children ?? []);

      expect(children[1]).toHaveTextContent("Looked up the weather");
      expect(children[2]).toHaveTextContent("Looking up the weather");

      rerender(
        <ChatMessageList
          entries={entries}
          userInitials="LM"
          labels={{ aiDisclosure }}
          describeTool={describeTool}
        />
      );
      expect(screen.getAllByText("Looked up the weather")).toHaveLength(2);
      expect(screen.queryByText("Looking up the weather")).not.toBeInTheDocument();
    });

    it("forwards the resolved activity labels so a Danish catalogue reaches the activity", () => {
      render(
        <ChatMessageList
          entries={[toolEntry("t1")]}
          userInitials="LM"
          busy
          labels={{ aiDisclosure, activity: "Consultando" }}
        />
      );

      expect(screen.getByText("Consultando")).toBeInTheDocument();
    });
  });

  describe("thinking entries", () => {
    const conversation = [
      userEntry("u1", "Ver pedido 4711"),
      thinkingEntry("th1"),
      assistantEntry("a1", "Booking 4711 er fundet"),
    ];

    it("showThinking absent renders no details and none of the thinking content", () => {
      const { container } = render(
        <ChatMessageList entries={conversation} userInitials="LM" labels={{ aiDisclosure }} />
      );

      expect(container.querySelector("details")).toBeNull();
      expect(container.textContent).not.toContain(thinkingEntry("th1").content);
      expect(container.textContent).not.toContain("Reasoning");
    });

    it("showThinking absent leaves the user and assistant entries untouched", () => {
      const { container } = render(
        <ChatMessageList entries={conversation} userInitials="LM" labels={{ aiDisclosure }} />
      );

      const children = Array.from(container.querySelector(".max-w-3xl")?.children ?? []);

      expect(children.map((child) => child.tagName)).toEqual(["ARTICLE", "ARTICLE"]);
      expect(children[0]).toHaveTextContent("Ver pedido 4711");
      expect(children[1]).toHaveTextContent("Booking 4711 er fundet");
    });

    it("showThinking true renders one collapsed trace between the two messages", () => {
      const { container } = render(
        <ChatMessageList
          entries={conversation}
          userInitials="LM"
          showThinking
          labels={{ aiDisclosure }}
        />
      );

      const children = Array.from(container.querySelector(".max-w-3xl")?.children ?? []);

      expect(children.map((child) => child.tagName)).toEqual(["ARTICLE", "DETAILS", "ARTICLE"]);
      expect(container.querySelectorAll("details")).toHaveLength(1);
      expect(children[1].querySelector("summary")?.textContent).toBe("Reasoning");
      expect((children[1] as HTMLDetailsElement).open).toBe(false);
    });

    it("a list holding a single thinking entry with showThinking still renders the aiDisclosure band", () => {
      render(
        <ChatMessageList
          entries={[thinkingEntry("th1")]}
          userInitials="LM"
          showThinking
          labels={{ aiDisclosure }}
        />
      );

      expect(screen.getByText(aiDisclosure)).toBeInTheDocument();
    });

    it("forwards reducedMotion, stripping the streaming dots' animation class", () => {
      const { container } = render(
        <ChatMessageList
          entries={[thinkingEntry("th1", true)]}
          userInitials="LM"
          showThinking
          reducedMotion
          labels={{ aiDisclosure }}
        />
      );

      expect(container.querySelectorAll("summary .bg-blue-500")).toHaveLength(3);
      expect(container.querySelectorAll(".bowman-fade-dot")).toHaveLength(0);
    });

    it("forwards the resolved thinkingTrace label so a Danish catalogue reaches the trace", () => {
      const { container } = render(
        <ChatMessageList
          entries={[thinkingEntry("th1")]}
          userInitials="LM"
          showThinking
          labels={{ aiDisclosure, thinkingTrace: "Razonamiento" }}
        />
      );

      expect(container.querySelector("summary")?.textContent).toBe("Razonamiento");
    });
  });
});
