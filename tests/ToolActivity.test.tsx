import { render, screen } from "@testing-library/react";
import { spawnSync } from "node:child_process";
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
          describeTool={() => "Consultando tu pedido"}
          showToolName
        />
      );

      expect(screen.getByText("Consultando tu pedido")).toBeInTheDocument();
      expect(screen.queryByText("Looked something up")).not.toBeInTheDocument();
      expect(screen.getByText("get_weather")).toBeInTheDocument();
    });

    it("receives the entry", () => {
      render(<ToolActivity entry={weatherEntry} describeTool={(entry) => entry.toolName} />);

      expect(screen.getByText("get_weather")).toBeInTheDocument();
    });

    it("receives pending, so the caller's sentence reads present tense while the call runs", () => {
      const describeTool = (entry: ToolChatEntry, pending: boolean) =>
        pending ? "Looking up the weather" : "Looked up the weather";
      const { rerender } = render(
        <ToolActivity entry={weatherEntry} describeTool={describeTool} pending />
      );
      expect(screen.getByText("Looking up the weather")).toBeInTheDocument();
      expect(screen.queryByText("Looked up the weather")).not.toBeInTheDocument();

      rerender(<ToolActivity entry={weatherEntry} describeTool={describeTool} />);
      expect(screen.getByText("Looked up the weather")).toBeInTheDocument();
      expect(screen.queryByText("Looking up the weather")).not.toBeInTheDocument();
    });

    it("takes a one-parameter callback unchanged, ignoring the pending argument", () => {
      const describe = (entry: ToolChatEntry) => entry.toolName;
      render(<ToolActivity entry={weatherEntry} describeTool={describe} pending />);

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
          labels={{ activity: "Consultando", details: "Detalles" }}
        />
      );

      expect(screen.getByText("Consultando")).toBeInTheDocument();
      expect(screen.getByText("Detalles")).toBeInTheDocument();
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

    // dist/index.d.ts is a barrel of re-export statements, so the widened
    // signature is emitted in the module it re-exports rather than inline.
    it("the declarations reached from dist/index.d.ts carry the two-parameter describeTool", () => {
      const barrel = readFileSync(resolve(process.cwd(), "dist/index.d.ts"), "utf8");
      const declarations = readFileSync(
        resolve(process.cwd(), "dist/components/ToolActivity.d.ts"),
        "utf8"
      );

      expect(barrel).toContain('ToolActivityProps } from "./components/ToolActivity.js"');
      expect(declarations).toContain(
        "describeTool?: (entry: ToolChatEntry, pending: boolean) => ReactNode;"
      );
    });

    it("tsc accepts tool-activity-type-assertions.tsx against dist, with no @ts-expect-error in it", () => {
      const assertions = readFileSync(
        resolve(process.cwd(), "tests/types/tool-activity-type-assertions.tsx"),
        "utf8"
      );
      expect(assertions).not.toContain("@ts-expect-error");

      const result = spawnSync(
        "node",
        [
          "node_modules/typescript7/bin/tsc",
          "--ignoreConfig",
          "--noEmit",
          "--strict",
          "--target",
          "es2022",
          "--module",
          "nodenext",
          "--moduleResolution",
          "nodenext",
          "--skipLibCheck",
          "--jsx",
          "react-jsx",
          "tests/types/tool-activity-type-assertions.tsx",
        ],
        { cwd: process.cwd(), encoding: "utf8" }
      );

      expect(result).toMatchObject({ status: 0, stderr: "" });
    });
  });
});
