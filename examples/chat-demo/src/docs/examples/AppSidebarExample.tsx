import { useState } from "react";
import { AppSidebar, ChatIcon, SettingsIcon } from "@re-cinq/bowman-ui";
import type { SidebarNavItem } from "@re-cinq/bowman-ui";

const navItems: ReadonlyArray<SidebarNavItem> = [
  { key: "chat", label: "Chat", icon: ChatIcon },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebarExample() {
  const [activeKey, setActiveKey] = useState("chat");

  return (
    <div className="flex h-80 w-72 flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <AppSidebar
        brand={<span className="text-sm font-semibold">Havkat Rejser</span>}
        navItems={navItems.map((item) => ({ ...item, isActive: item.key === activeKey }))}
        onNavigate={setActiveKey}
        footer={
          <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">Signed in as MV</p>
        }
      >
        <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          Anything the app keeps between the nav and the footer goes here.
        </p>
      </AppSidebar>
    </div>
  );
}
