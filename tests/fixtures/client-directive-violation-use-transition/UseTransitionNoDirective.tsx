// Red fixture for scripts/check-client-directives.mjs: imports useTransition
// (a React 19 hook outside the old ten-name list) without "use client". Lives
// outside src/ so the real check never scans it; the test points the script
// here and asserts a non-zero exit naming the trigger.
import { useTransition } from "react";

export const UseTransitionNoDirective = () => {
  const [isPending] = useTransition();

  return <span>{isPending ? 1 : 0}</span>;
};
