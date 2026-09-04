// Stand-in for a built bowman-ui component inside the installed dist/: the
// Tailwind fixture build only scans this file's class names, it never runs it.
import { jsx } from "react/jsx-runtime";

export const FixtureShell = () =>
  jsx("div", { className: "bg-slate-800 bowman-fade-in" });
