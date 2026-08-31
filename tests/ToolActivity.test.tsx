import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ToolActivity, defaultToolActivityLabels } from "../src/index.js";
import type { ToolChatEntry } from "../src/index.js";

// 017's fixture entry (tests/fixtures/hal-session-entries.json § tool).
const weatherEntry: ToolChatEntry = {
  id: "t1",
  role: "tool",
  toolName: "get_weather",
  toolInput: { location: "Berlin", units: "celsius" },
};

describe("ToolActivity", () => {
  describe("the default render", () => {
    it("shows the activityDone sentence and none of the tool name or arguments", () => {
      const { container } = render(<ToolActivity entry={weatherEntry} />);

      expect(screen.getByText("Looked something up")).toBeInTheDocument();
      expect(container.textContent).not.toContain("get_weather");
      expect(container.textContent).not.toContain("Berlin");
      expect(container.textContent).not.toContain("celsius");
    });

    it("renders no message affordance: no avatar circle, copy or feedback button", () => {
      render(<ToolActivity entry={weatherEntry} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("showToolName", () => {
    it("true puts the tool name in the document", () => {
      render(<ToolActivity entry={weatherEntry} showToolName />);

      expect(screen.getByText("get_weather")).toBeInTheDocument();
    });

    it("defaults false, keeping the tool name out of the document", () => {
      const { container } = render(<ToolActivity entry={weatherEntry} />);

      expect(container.textContent).not.toContain("get_weather");
    });
  });

  describe("showToolInput", () => {
    it("true renders a pre containing the JSON arguments", () => {
      const { container } = render(<ToolActivity entry={weatherEntry} showToolInput />);

      const pre = container.querySelector("pre");
      expect(pre?.textContent).toContain('"location": "Berlin"');
    });

    it("defaults false, rendering no pre and no arguments", () => {
      const { container } = render(<ToolActivity entry={weatherEntry} />);

      expect(container.querySelector("pre")).toBeNull();
      expect(container.textContent).not.toContain("Berlin");
    });

    it("renders the arguments as inert text, never HTML", () => {
      const entry: ToolChatEntry = {
        id: "t2",
        role: "tool",
        toolName: "lookup",
        toolInput: { note: "<img src=x onerror=alert(1)>" },
      };
      const { container } = render(<ToolActivity entry={entry} showToolInput />);

      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
    });
  });

  describe("describeTool", () => {
    it("replaces the default sentence and does not suppress showToolName", () => {
      render(
        <ToolActivity
          entry={weatherEntry}
          describeTool={() => "Slår din booking op"}
          showToolName
        />
      );

      expect(screen.getByText("Slår din booking op")).toBeInTheDocument();
      expect(screen.queryByText("Looked something up")).not.toBeInTheDocument();
      expect(screen.getByText("get_weather")).toBeInTheDocument();
    });

    it("receives the entry", () => {
      render(<ToolActivity entry={weatherEntry} describeTool={(entry) => entry.toolName} />);

      expect(screen.getByText("get_weather")).toBeInTheDocument();
    });
  });

  describe("pending", () => {
    it("true renders the activity label", () => {
      render(<ToolActivity entry={weatherEntry} pending />);

      expect(screen.getByText("Looking something up")).toBeInTheDocument();
      expect(screen.queryByText("Looked something up")).not.toBeInTheDocument();
    });

    it("absent renders the activityDone label", () => {
      render(<ToolActivity entry={weatherEntry} />);

      expect(screen.getByText("Looked something up")).toBeInTheDocument();
      expect(screen.queryByText("Looking something up")).not.toBeInTheDocument();
    });
  });

  describe("the disclosure", () => {
    it("is a details/summary closed by default with the details label as its summary", () => {
      const { container } = render(<ToolActivity entry={weatherEntry} showToolInput />);

      const details = container.querySelector("details");
      expect(details).not.toBeNull();
      expect(details?.open).toBe(false);
      expect(details?.querySelector("summary")?.textContent).toBe("Details");
    });
  });

  describe("labels and defaults", () => {
    it("resolves overrides over the English defaults per key", () => {
      render(
        <ToolActivity
          entry={weatherEntry}
          pending
          showToolInput
          labels={{ activity: "Slår op", details: "Detaljer" }}
        />
      );

      expect(screen.getByText("Slår op")).toBeInTheDocument();
      expect(screen.getByText("Detaljer")).toBeInTheDocument();
    });

    it("defaultToolActivityLabels is frozen with the three English strings", () => {
      expect(Object.isFrozen(defaultToolActivityLabels)).toBe(true);
      expect(defaultToolActivityLabels).toEqual({
        activity: "Looking something up",
        activityDone: "Looked something up",
        details: "Details",
      });
    });
  });

  describe("the icon slot", () => {
    it("renders the caller icon and stays out of the document without one", () => {
      const { rerender } = render(
        <ToolActivity entry={weatherEntry} icon={<span data-testid="tool-icon">4711</span>} />
      );
      expect(screen.getByTestId("tool-icon")).toBeInTheDocument();

      rerender(<ToolActivity entry={weatherEntry} />);
      expect(screen.queryByTestId("tool-icon")).not.toBeInTheDocument();
    });
  });

  describe("the data-boundary source (grep acceptance criteria)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ToolActivity.tsx"), "utf8");

    it("references no dangerouslySetInnerHTML, react-markdown or remark-", () => {
      expect(source).not.toMatch(/dangerouslySetInnerHTML|react-markdown|remark-/);
    });

    it("holds no useState, useEffect or useId", () => {
      expect(source).not.toMatch(/useState|useEffect|useId/);
    });

    it("makes no console call and touches no client storage", () => {
      expect(source).not.toMatch(/console\.|localStorage|sessionStorage|IndexedDB|indexedDB/);
    });

    it("declares none of assistantAvatar, onCopy, onFeedback or showFeedback", () => {
      expect(source).not.toMatch(/assistantAvatar|onCopy|onFeedback|showFeedback/);
    });
  });

  describe("GDPR zero retention", () => {
    it("writes nothing to localStorage when rendering with showToolInput", () => {
      localStorage.clear();
      render(<ToolActivity entry={weatherEntry} showToolInput />);

      expect(localStorage.length).toBe(0);
    });
  });

  describe("the published surface", () => {
    it("dist/index.d.ts declares no renderEntry escape hatch", () => {
      const declarations = readFileSync(resolve(process.cwd(), "dist/index.d.ts"), "utf8");

      expect(declarations).not.toContain("renderEntry");
    });
  });
});
