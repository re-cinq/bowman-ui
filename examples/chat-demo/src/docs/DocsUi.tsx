// The three shapes every documentation page is built from: a titled section, a
// code listing that scrolls rather than wrapping, and a bordered stage for a
// live render.

import type { ReactNode } from "react";

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      <code>{code}</code>
    </pre>
  );
}

export function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      {children}
    </div>
  );
}
