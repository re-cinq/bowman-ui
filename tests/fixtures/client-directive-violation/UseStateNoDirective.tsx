// Red fixture for scripts/check-client-directives.mjs: references useState
// without "use client". Lives outside src/ so the real check never scans it;
// the test points the script here and asserts a non-zero exit.
import { useState } from "react";

export const UseStateNoDirective = () => {
  const [count] = useState(0);
  return <span>{count}</span>;
};
