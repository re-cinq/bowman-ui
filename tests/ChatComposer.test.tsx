/**
 * ChatComposer is authored new (issue 027) - there is no prior
 * characterization suite. These tests pin the component's specified
 * behaviour, including two hardening fixes: the IME isComposing guard and
 * a real accessible name instead of a placeholder.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRef, useState } from "react";
import type { Mock } from "vitest";
import { ChatComposer } from "../src/index.js";
import type { ChatComposerHandle } from "../src/index.js";
import { expectImportHygiene, expectNoEgress, listFiles } from "./helpers/source-hygiene.js";
import {
  expectActiveBackgroundDisabled,
  expectTextOnAccent,
  expectTextStrong,
  expectTextSubtleDisabled,
} from "./helpers/expect-theme-tokens.js";

const textareaOf = (): HTMLTextAreaElement => screen.getByRole("textbox");
const sendButtonOf = (): HTMLButtonElement => screen.getByRole("button", { name: "Send message" });

// jsdom performs no layout and reports scrollHeight 0, so the auto-resize
// assertions stub the property. A passing resize test here proves the
// min(scrollHeight, cap) arithmetic, never real browser layout.
const stubScrollHeight = (textarea: HTMLTextAreaElement, value: number) => {
  Object.defineProperty(textarea, "scrollHeight", { value, configurable: true });
};

const typeDraft = (text: string) => {
  fireEvent.change(textareaOf(), { target: { value: text } });
};

const expectSubmittedOnceAndCleared = (onSubmit: Mock, text: string) => {
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit).toHaveBeenCalledWith(text);
  expect(textareaOf()).toMatchObject({ value: "" });
  expect(textareaOf().style.height).toBe("auto");
  expect(sendButtonOf()).toBeDisabled();
};

describe("ChatComposer", () => {
  describe("submitting", () => {
    it('typing "Hvor er min booking?" and clicking send calls onSubmit once with exactly that string, then the draft is "", the height is back to auto and send is disabled again', () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("Hvor er min booking?");
      fireEvent.click(sendButtonOf());

      expectSubmittedOnceAndCleared(onSubmit, "Hvor er min booking?");
    });

    it('"  Ja  " submits as "Ja" - trimmed, with no length floor', () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("  Ja  ");
      fireEvent.click(sendButtonOf());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith("Ja");
    });

    it('"   " leaves the send button disabled and onSubmit uncalled', () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("   ");
      fireEvent.click(sendButtonOf());

      expect(sendButtonOf()).toBeDisabled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("the send button is disabled before any typing and enabled once a non-blank draft exists", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expect(sendButtonOf()).toBeDisabled();
      typeDraft("Ja");
      expect(sendButtonOf()).toBeEnabled();
    });
  });

  describe("the keyboard", () => {
    it('Enter submits the trimmed draft once, then the draft is "", the height is back to auto and send is disabled again', () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("Hvor er min booking?");
      fireEvent.keyDown(textareaOf(), { key: "Enter" });

      expectSubmittedOnceAndCleared(onSubmit, "Hvor er min booking?");
    });

    it("Enter on a whitespace-only draft calls onSubmit zero times", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("   ");
      fireEvent.keyDown(textareaOf(), { key: "Enter" });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("Shift+Enter does not submit and leaves the draft in the box", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("linje 1");
      fireEvent.keyDown(textareaOf(), { key: "Enter", shiftKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(textareaOf()).toMatchObject({ value: "linje 1" });
    });

    it("Ctrl+Enter submits the trimmed draft once and clears the box like plain Enter", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("Hvor er min booking?");
      const notPrevented = fireEvent.keyDown(textareaOf(), { key: "Enter", ctrlKey: true });

      expect(notPrevented).toBe(false);
      expectSubmittedOnceAndCleared(onSubmit, "Hvor er min booking?");
    });

    it("Meta+Enter submits the trimmed draft once and clears the box like plain Enter", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("Er pakken sendt?");
      const notPrevented = fireEvent.keyDown(textareaOf(), { key: "Enter", metaKey: true });

      expect(notPrevented).toBe(false);
      expectSubmittedOnceAndCleared(onSubmit, "Er pakken sendt?");
    });

    it("Alt+Enter does not submit, does not preventDefault and leaves the draft in the box", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("linje 1");
      const notPrevented = fireEvent.keyDown(textareaOf(), { key: "Enter", altKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
      expect(textareaOf()).toMatchObject({ value: "linje 1" });
    });

    it("Ctrl+Shift+Enter does not submit: Shift wins over Ctrl", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("to linjer");
      fireEvent.keyDown(textareaOf(), { key: "Enter", ctrlKey: true, shiftKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(textareaOf()).toMatchObject({ value: "to linjer" });
    });

    it("Enter while isComposing does not submit and does not preventDefault - the IME guard the inline copies lack", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("かな");
      const notPrevented = fireEvent.keyDown(textareaOf(), { key: "Enter", isComposing: true });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
      expect(textareaOf()).toMatchObject({ value: "かな" });
    });

    it("plain Enter preventDefaults, so no newline leaks into the cleared draft", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      typeDraft("Ja");
      const notPrevented = fireEvent.keyDown(textareaOf(), { key: "Enter" });

      expect(notPrevented).toBe(false);
    });

    it("Escape does not clear the draft and calls nothing - pinned so the shortcut is not added without a decision", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("Hvor er min booking?");
      fireEvent.keyDown(textareaOf(), { key: "Escape" });

      expect(onSubmit).not.toHaveBeenCalled();
      expect(textareaOf()).toMatchObject({ value: "Hvor er min booking?" });
    });
  });

  describe("busy and disabled", () => {
    it("busy keeps the textarea editable, disables the send button, Enter calls onSubmit zero times, and the wrapper pulses", () => {
      const onSubmit = vi.fn();
      const { container } = render(<ChatComposer onSubmit={onSubmit} busy />);

      fireEvent.keyDown(textareaOf(), { key: "Enter" });

      expect(textareaOf()).toBeEnabled();
      expect(sendButtonOf()).toBeDisabled();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(container.querySelector(".bowman-pulse-subtle")).not.toBeNull();
    });

    it('busy marks the composer surface aria-busy="true"; idle and plain disabled mark it "false"', () => {
      const { container, rerender } = render(<ChatComposer onSubmit={vi.fn()} busy />);

      expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");

      rerender(<ChatComposer onSubmit={vi.fn()} />);
      expect(container.firstElementChild).toHaveAttribute("aria-busy", "false");

      rerender(<ChatComposer onSubmit={vi.fn()} disabled />);
      expect(container.firstElementChild).toHaveAttribute("aria-busy", "false");
    });

    it("disabled without busy disables both and the wrapper carries no pulse class", () => {
      const { container } = render(<ChatComposer onSubmit={vi.fn()} disabled />);

      expect(textareaOf()).toBeDisabled();
      expect(sendButtonOf()).toBeDisabled();
      expect(container.querySelector(".bowman-pulse-subtle")).toBeNull();
    });

    it('busy describes the textarea through a bowman-sr-only element with the default composerBusyHint: "You can keep typing." followed by "Sending waits until the assistant has finished responding." and sets no aria-disabled', () => {
      render(<ChatComposer onSubmit={vi.fn()} busy />);
      const hint = document.getElementById(textareaOf().getAttribute("aria-describedby") ?? "");

      expect(textareaOf()).toHaveAccessibleDescription(
        "You can keep typing. Sending waits until the assistant has finished responding."
      );
      expect(textareaOf()).not.toHaveAttribute("aria-disabled");
      expect(hint).toHaveClass("bowman-sr-only");
    });

    it("idle leaves the textarea without aria-describedby and without an accessible description", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expect(textareaOf()).not.toHaveAttribute("aria-describedby");
      expect(textareaOf()).toHaveAccessibleDescription("");
    });

    it('busy with labels={{ composerBusyHint: "Du kan skrive videre; afsendelse venter." }} describes the textarea with that string', () => {
      render(
        <ChatComposer
          onSubmit={vi.fn()}
          busy
          labels={{ composerBusyHint: "Du kan skrive videre; afsendelse venter." }}
        />
      );

      expect(textareaOf()).toHaveAccessibleDescription("Du kan skrive videre; afsendelse venter.");
    });

    it("disabled renders no hint with or without busy: the textarea has no aria-describedby", () => {
      const { rerender } = render(<ChatComposer onSubmit={vi.fn()} disabled />);

      expect(textareaOf()).not.toHaveAttribute("aria-describedby");
      expect(textareaOf()).toHaveAccessibleDescription("");

      rerender(<ChatComposer onSubmit={vi.fn()} busy disabled />);

      expect(textareaOf()).not.toHaveAttribute("aria-describedby");
      expect(textareaOf()).toHaveAccessibleDescription("");
    });

    it('a draft typed before busy survives the toggle: "Hvor er min booking?" and the enabled send button return once busy is false', () => {
      const { rerender } = render(<ChatComposer onSubmit={vi.fn()} />);

      typeDraft("Hvor er min booking?");
      rerender(<ChatComposer onSubmit={vi.fn()} busy />);

      expect(textareaOf()).toBeEnabled();
      expect(sendButtonOf()).toBeDisabled();

      rerender(<ChatComposer onSubmit={vi.fn()} />);

      expect(textareaOf()).toMatchObject({ value: "Hvor er min booking?" });
      expect(textareaOf()).toBeEnabled();
      expect(sendButtonOf()).toBeEnabled();
    });

    it("keeps the textarea focused and editable after Enter when the consumer turns busy on", () => {
      function Host() {
        const [busy, setBusy] = useState(false);

        return <ChatComposer onSubmit={() => setBusy(true)} busy={busy} />;
      }

      const { container } = render(<Host />);
      const textarea = textareaOf();

      textarea.focus();
      typeDraft("Hvor er min booking?");
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(textarea).toBeEnabled();
      // toBeEnabled is the regression guard; jsdom cannot blur-on-disable, so this only documents the intended focus.
      expect(document.activeElement).toBe(textarea);
      expect(container.querySelector(".bowman-pulse-subtle")).not.toBeNull();
    });
  });

  describe("theming tokens", () => {
    it("the send button reads --bowman-accent for its background and --bowman-accent-hover on hover, light and dark", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expect(sendButtonOf()).toHaveClass(
        "bg-(--bowman-accent,var(--color-blue-500))",
        "dark:bg-(--bowman-accent-dark,var(--color-blue-600))",
        "hover:bg-(--bowman-accent-hover,var(--color-blue-600))",
        "dark:hover:bg-(--bowman-accent-hover-dark,var(--color-blue-500))"
      );
      expect(sendButtonOf()).not.toHaveClass("bg-blue-500", "hover:bg-blue-600");
    });

    it("the textarea reads the strong text token, so a consumer recolours the drafted text with the theme", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expectTextStrong(textareaOf());
    });

    it("the send button reads --bowman-text-on-accent for its text, one value in both modes", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expectTextOnAccent(sendButtonOf());
    });

    it("the wrapper keeps focus-within:ring-2 beside the --bowman-focus-ring /50 ring and the --bowman-accent-glow shadow", () => {
      const { container } = render(<ChatComposer onSubmit={vi.fn()} />);

      expect(container.firstElementChild).toHaveClass(
        "focus-within:ring-2",
        "focus-within:ring-(--bowman-focus-ring,var(--color-blue-500))/50",
        "focus-within:shadow-[0_0_0_4px_var(--bowman-accent-glow,rgba(59,130,246,0.1))]",
        "dark:focus-within:ring-(--bowman-focus-ring-dark,var(--color-blue-400))/50",
        "dark:focus-within:shadow-[0_0_0_4px_var(--bowman-accent-glow-dark,rgba(96,165,250,0.1))]"
      );
    });

    it("the disabled send button reads --bowman-text-subtle for its text and --bowman-active for its background, light and dark", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expect(sendButtonOf()).toBeDisabled();
      expectTextSubtleDisabled(sendButtonOf());
      expectActiveBackgroundDisabled(sendButtonOf());
    });
  });

  describe("the ref handle", () => {
    it('setValue("linje 1\\nlinje 2") puts the text in the textarea, enables send, and re-runs the resize', () => {
      const ref = createRef<ChatComposerHandle>();

      render(<ChatComposer onSubmit={vi.fn()} ref={ref} />);
      stubScrollHeight(textareaOf(), 320);

      act(() => ref.current?.setValue("linje 1\nlinje 2"));

      expect(textareaOf()).toMatchObject({ value: "linje 1\nlinje 2" });
      expect(sendButtonOf()).toBeEnabled();
      expect(textareaOf().style.height).toBe("200px");
    });

    it("setValue with a blank string leaves the send button disabled", () => {
      const ref = createRef<ChatComposerHandle>();

      render(<ChatComposer onSubmit={vi.fn()} ref={ref} />);

      act(() => ref.current?.setValue("   "));

      expect(sendButtonOf()).toBeDisabled();
    });

    it("setValue on a handle retained past unmount is a no-op, not a crash", () => {
      const ref = createRef<ChatComposerHandle>();
      const { unmount } = render(<ChatComposer onSubmit={vi.fn()} ref={ref} />);
      const handle = ref.current;

      unmount();

      expect(() => handle?.setValue("Ver pedido 4711")).not.toThrow();
    });

    it("focus() makes the textarea document.activeElement", () => {
      const ref = createRef<ChatComposerHandle>();

      render(<ChatComposer onSubmit={vi.fn()} ref={ref} />);

      act(() => ref.current?.focus());

      expect(document.activeElement).toBe(textareaOf());
    });

    it("autoFocus focuses the textarea on mount, and its default is false", () => {
      const first = render(<ChatComposer onSubmit={vi.fn()} />);

      expect(document.activeElement).not.toBe(textareaOf());
      first.unmount();

      render(<ChatComposer onSubmit={vi.fn()} autoFocus />);
      expect(document.activeElement).toBe(textareaOf());
    });
  });

  describe("auto-resize (stubbed scrollHeight - jsdom has no layout)", () => {
    it("a stubbed scrollHeight of 320 caps the height at 200px under the default maxHeightPx", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);
      stubScrollHeight(textareaOf(), 320);

      typeDraft("un mensaje muy largo");

      expect(textareaOf().style.height).toBe("200px");
    });

    it("the same 320 becomes 320px with maxHeightPx={400}", () => {
      render(<ChatComposer onSubmit={vi.fn()} maxHeightPx={400} />);
      stubScrollHeight(textareaOf(), 320);

      typeDraft("un mensaje muy largo");

      expect(textareaOf().style.height).toBe("320px");
    });
  });

  describe("the attachment slot", () => {
    it("with no attachSlot, send is the only button in the document", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expect(screen.getAllByRole("button")).toHaveLength(1);
    });

    it("attachSlot renders left of send", () => {
      render(<ChatComposer onSubmit={vi.fn()} attachSlot={<button type="button">4711</button>} />);

      const buttons = screen.getAllByRole("button");

      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent("4711");
      expect(
        buttons[0].compareDocumentPosition(sendButtonOf()) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });

  describe("form safety", () => {
    it('every button the component renders itself carries type="button"', () => {
      const { container } = render(<ChatComposer onSubmit={vi.fn()} />);

      for (const button of container.querySelectorAll("button")) {
        expect(button).toHaveAttribute("type", "button");
      }
    });

    it("clicking send inside a consumer's <form onSubmit> does not fire the form's submit handler", () => {
      const formSubmit = vi.fn();

      render(
        <form onSubmit={formSubmit}>
          <ChatComposer onSubmit={vi.fn()} />
        </form>
      );

      typeDraft("Ja");
      fireEvent.click(sendButtonOf());

      expect(formSubmit).not.toHaveBeenCalled();
    });
  });

  describe("accessible names", () => {
    it('the textarea\'s accessible name is the resolved composerInput label, distinct from the "Responder..." placeholder', () => {
      render(
        <ChatComposer
          onSubmit={vi.fn()}
          labels={{ composerInput: "Tu mensaje", composerPlaceholder: "Responder..." }}
        />
      );

      expect(screen.getByRole("textbox", { name: "Tu mensaje" })).toHaveAttribute(
        "placeholder",
        "Responder..."
      );
    });

    it('the defaults name the textarea "Your message" with placeholder "Reply..."', () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      expect(screen.getByRole("textbox", { name: "Your message" })).toHaveAttribute(
        "placeholder",
        "Reply..."
      );
    });

    it("the send button's accessible name is the resolved send label and its SendIcon is aria-hidden", () => {
      render(<ChatComposer onSubmit={vi.fn()} labels={{ send: "Send til supporten" }} />);

      const button = screen.getByRole("button", { name: "Send til supporten" });

      expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("focus after send", () => {
    it("clicking the focused send button submits, disables send, and leaves the textarea as document.activeElement", () => {
      const onSubmit = vi.fn();

      render(<ChatComposer onSubmit={onSubmit} />);

      typeDraft("Hvor er min booking?");
      sendButtonOf().focus();
      fireEvent.click(sendButtonOf());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(sendButtonOf()).toBeDisabled();
      expect(document.activeElement).toBe(textareaOf());
    });

    it("Enter keeps the textarea as document.activeElement after the submit", () => {
      render(<ChatComposer onSubmit={vi.fn()} />);

      textareaOf().focus();
      typeDraft("Hvor er min booking?");
      fireEvent.keyDown(textareaOf(), { key: "Enter" });

      expect(sendButtonOf()).toBeDisabled();
      expect(document.activeElement).toBe(textareaOf());
    });

    it("an onSubmit that focuses an outside button wins: that button is document.activeElement after send", () => {
      const elsewhereOf = (): HTMLButtonElement =>
        screen.getByRole("button", { name: "Elsewhere" });

      render(
        <>
          <button type="button">Elsewhere</button>
          <ChatComposer onSubmit={() => elsewhereOf().focus()} />
        </>
      );

      typeDraft("Hvor er min booking?");
      fireEvent.click(sendButtonOf());

      expect(sendButtonOf()).toBeDisabled();
      expect(document.activeElement).toBe(elsewhereOf());
    });
  });
});

describe("the authored source (grep acceptance criteria)", () => {
  const componentPath = "src/components/ChatComposer.tsx";
  const content = readFileSync(resolve(process.cwd(), componentPath), "utf8");

  it("the textarea is uncontrolled: onChange= is its own binding and no value= or onValueChange prop exists", () => {
    expect(content).not.toMatch(/value=|onValueChange/);
    expect(content.match(/onChange=/g)).toHaveLength(1);
  });

  it("no paperclip glyph appears anywhere in src/ or dist/", () => {
    for (const file of listFiles(resolve(process.cwd(), "src"))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/paperclip/i);
    }

    for (const file of listFiles(resolve(process.cwd(), "dist")).filter(
      (file) => file.endsWith(".js") || file.endsWith(".d.ts") || file.endsWith(".css")
    )) {
      expect(readFileSync(file, "utf8")).not.toMatch(/paperclip/i);
    }
  });

  it("the send button renders the set's SendIcon", () => {
    expect(content).toMatch(/import \{[^}]*\bSendIcon\b[^}]*\} from "\.\.\/icons\/index\.js"/);
    expect(content).not.toMatch(/\bas SendIcon\b/);
    expect(content).toMatch(/aria-label=\{resolved\.send\}[^<>]*[^/<>]>\s*<SendIcon\b/);
  });

  it("GDPR: the file calls no console.*, localStorage, sessionStorage, fetch, sendBeacon or analytics, and holds no draft persistence", () => {
    expectNoEgress(content);
  });

  it("no @clerk, swr, next-intl, next/, @/ or lucide-react import, and every relative import ends in .js", () => {
    expectImportHygiene(content);
  });
});

describe("decision 4's forwardRef idiom", () => {
  it("ChatComposer is a forwardRef<ChatComposerHandle, ChatComposerProps> component - never ref-as-prop", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ChatComposer.tsx"), "utf8");

    expect(source).toMatch(/forwardRef<ChatComposerHandle, ChatComposerProps>\(/);
    expect(ChatComposer.$$typeof).toBe(Symbol.for("react.forward_ref"));
  });
});
