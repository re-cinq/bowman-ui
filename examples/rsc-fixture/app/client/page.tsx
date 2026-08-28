"use client";

import { AppShell } from "@re-cinq/bowman-ui";

export default function ClientPage() {
  return (
    <AppShell
      renderSidebar={({ variant }) => (
        <nav aria-label="Fixture navigation" data-variant={variant}>
          <span>Fixture sidebar</span>
        </nav>
      )}
    >
      <p>Client component passing renderSidebar</p>
    </AppShell>
  );
}
