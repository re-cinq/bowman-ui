import { existsSync, readFileSync } from "node:fs";
import {
  expectClientDirectiveFirst,
  expectPackedWithTypes,
  expectTypeAssertionsCompile,
  stripLeadingTrivia,
} from "./helpers/built-package.js";

// Each client file takes an on[A-Z] handler or calls a hook, so decision 1's
// trigger list puts "use client" first; KeyValueList takes neither and stays
// server-safe (specs/bowman-ui-form-dialog-notice/spec.md § Conventions).
const CLIENT_FILES = [
  "dist/components/TextField.js",
  "dist/components/Dialog.js",
  "dist/components/ConfirmDialog.js",
  "dist/components/Notice.js",
  "dist/components/Card.js",
  "dist/components/ModalPanel.js",
];
const SERVER_FILE = "dist/components/KeyValueList.js";

describe("the built form, dialog and notice primitives", () => {
  it.each(CLIENT_FILES)('%s opens with "use client"; as its first statement', (path) => {
    expectClientDirectiveFirst(path);
  });

  it('dist/components/KeyValueList.js exists and does not open with "use client";', () => {
    expect(existsSync(SERVER_FILE)).toBe(true);
    expect(stripLeadingTrivia(readFileSync(SERVER_FILE, "utf8"))).not.toMatch(/^"use client";/);
  });

  it("npm pack --dry-run ships the seven new component files with their d.ts files", () => {
    expectPackedWithTypes([...CLIENT_FILES, SERVER_FILE]);
  });

  it("tsc accepts form-dialog-notice-type-assertions.tsx against dist via the '.' exports entry, pinning every @ts-expect-error fixture", () => {
    expectTypeAssertionsCompile("tests/types/form-dialog-notice-type-assertions.tsx");
  });
});
