import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve(process.cwd(), "scripts/check-client-directives.mjs");

const runAgainst = (fixtureDir: string) =>
  spawnSync("node", [script, fixtureDir], { cwd: process.cwd(), encoding: "utf8" });

it("exits non-zero when a useState file carries no directive", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("UseStateNoDirective.tsx");
  expect(result.stderr).toContain("imports useState (hook-shaped import)");
});

it("exits non-zero when a useTransition import carries no directive", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-use-transition");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("UseTransitionNoDirective.tsx");
  expect(result.stderr).toContain("imports useTransition (hook-shaped import)");
});

it("exits non-zero when the hook-shaped import comes from a relative specifier", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-relative-hook");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("RelativeHookNoDirective.tsx");
  expect(result.stderr).toContain("imports useWidgetState (hook-shaped import)");
});

it("exits non-zero when the hook arrives as a React.useState namespace call", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-namespace-hook");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("NamespaceHookNoDirective.ts");
  expect(result.stderr).toContain("references React.useState (hook-shaped member)");
});

it("exits non-zero when a createContext import carries no directive", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-create-context");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("CreateContextNoDirective.ts");
  expect(result.stderr).toContain("imports createContext");
  expect(result.stderr).toContain("references React.createContext (createContext member)");
});

it("exits non-zero when a class extends Component with no hook and no handler", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-component-class");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("ComponentClassNoDirective.tsx");
  expect(result.stderr).toContain("extends Component (class component)");
  expect(result.stderr).toContain("extends React.PureComponent (class component)");
});

it("exits non-zero when the only client reference is localStorage.getItem", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-browser-global");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("LocalStorageNoDirective.ts");
  expect(result.stderr).toContain("references browser global localStorage");
});

it("exits non-zero when a typeof window guard carries no directive", () => {
  const result = runAgainst("tests/fixtures/client-directive-violation-typeof-window");
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("TypeofWindowNoDirective.ts");
  expect(result.stderr).toContain("references browser global window");
});

it("exits zero for the barrel, type-only hook imports, and handlers in comments and strings", () => {
  const result = runAgainst("tests/fixtures/client-directive-clean");
  expect(result).toMatchObject({ status: 0, stderr: "" });
});

it("exits zero against src/ and dist/", () => {
  const result = spawnSync("node", [script], { cwd: process.cwd(), encoding: "utf8" });
  expect(result).toMatchObject({ status: 0, stderr: "" });
});
