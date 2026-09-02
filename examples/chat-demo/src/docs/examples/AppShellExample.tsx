import { AppShell, AppSidebar } from "@re-cinq/bowman-ui";

export function AppShellExample() {
  return (
    <div className="h-96 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <AppShell
        brand={<span className="text-sm font-semibold">Marginalia Books</span>}
        renderSidebar={({ variant, close }) => (
          <AppSidebar
            brand={<span className="text-sm font-semibold">Marginalia Books</span>}
            navItems={[{ key: "chat", label: "Chat", isActive: true }]}
            onNavigate={close}
          >
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              Rendered once per position; this one is the {variant} copy.
            </p>
          </AppSidebar>
        )}
      >
        <p className="p-6 text-sm text-slate-600 dark:text-slate-400">
          The screen goes here. Below the md breakpoint the sidebar becomes a focus-trapped drawer
          behind the hamburger; above it, a fixed rail.
        </p>
      </AppShell>
    </div>
  );
}
