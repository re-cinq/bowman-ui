/**
 * KeyValueList (specs/bowman-ui-form-dialog-notice/spec.md § KeyValueList):
 * one <dl> of <div>-wrapped <dt>/<dd> pairs, whose layout changes classes only.
 */
import { render } from "@testing-library/react";
import { KeyValueList, type KeyValuePair } from "../src/index.js";
import { expectTextMuted, expectTextStrong } from "./helpers/expect-theme-tokens.js";

const pairs: KeyValuePair[] = [
  { key: "a", label: "Nummer", value: "4711" },
  { key: "b", label: "Kode", value: <strong>4712</strong> },
];

const structureOf = (container: HTMLElement) =>
  [...container.querySelectorAll("dl > div")].map((row) =>
    [...row.children].map((child) => `${child.tagName}:${child.textContent}`)
  );

describe("KeyValueList", () => {
  it("renders one <dl> holding, per pair and in order, a <div> with a <dt> label and a <dd> value", () => {
    const { container } = render(<KeyValueList pairs={pairs} />);

    expect(container.querySelectorAll("dl")).toHaveLength(1);
    expect(structureOf(container)).toEqual([
      ["DT:Nummer", "DD:4711"],
      ["DT:Kode", "DD:4712"],
    ]);
  });

  it('the default "inline" layout lays each row out side by side with the <dt> at a third of the width', () => {
    const { container } = render(<KeyValueList pairs={pairs} />);

    expect(container.querySelector("dl > div")).toHaveClass("flex");
    expect(container.querySelector("dt")).toHaveClass("w-1/3");
  });

  it('layout="stacked" keeps the same structure and drops the row layout', () => {
    const { container } = render(<KeyValueList pairs={pairs} layout="stacked" />);

    expect(structureOf(container)).toEqual([
      ["DT:Nummer", "DD:4711"],
      ["DT:Kode", "DD:4712"],
    ]);
    expect(container.querySelector("dl > div")).not.toHaveClass("flex");
    expect(container.querySelector("dt")).not.toHaveClass("w-1/3");
  });

  it("every <dt> is small TEXT_MUTED text and every <dd> small TEXT_STRONG text, with no background", () => {
    const { container } = render(<KeyValueList pairs={pairs} />);

    expect(container.querySelector("dl")).toHaveClass("text-sm");
    expect(container.querySelector("dl")?.className).not.toMatch(/bg-/);

    for (const term of container.querySelectorAll("dt")) {
      expectTextMuted(term);
    }

    for (const detail of container.querySelectorAll("dd")) {
      expectTextStrong(detail);
    }
  });

  it("an empty pairs renders nothing", () => {
    const { container } = render(<KeyValueList pairs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
