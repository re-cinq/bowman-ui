import { expectTypeAssertionsCompile } from "./helpers/built-package.js";

it("tsc accepts labels-type-assertions.tsx against dist via the '.' exports entry", () => {
  expectTypeAssertionsCompile("tests/types/labels-type-assertions.tsx");
});
