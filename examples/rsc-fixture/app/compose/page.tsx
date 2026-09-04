"use client";

import { AppShell, AppSidebar } from "@re-cinq/bowman-ui";

export default function ComposePage() {
  return (
    <AppShell
      renderSidebar={({ close }) => (
        <AppSidebar
          navItems={[
            { key: "fixture-home", label: "Fixture home", isActive: true },
          ]}
          onNavigate={close}
        />
      )}
    >
      <p>renderSidebar composed under a client boundary</p>
    </AppShell>
  );
}
