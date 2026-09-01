// The documentation view. One page per component, plus an index and an
// overview of the non-component surface, addressed by query parameter:
//
//   ?view=docs                            the index
//   ?view=docs&component=chat-message     one component's page
//   ?view=docs&component=overview         hooks, markdown, labels and types
//
// Navigation is plain anchors, so the demo still has no router: a docs page is
// a static document, and a full load costs nothing. Relative hrefs also mean
// the pages work unchanged under the "/bowman-ui/" base path GitHub Pages
// serves a project site from.

import type { ReactNode } from "react";
import { AppShell, AppSidebar } from "@re-cinq/bowman-ui";
import type { SidebarNavItem, SidebarSlotContext } from "@re-cinq/bowman-ui";
import { appShellLabels, appSidebarLabels, docsLabels } from "../activeLabels";
import { componentDocById, componentDocs } from "./componentDocs";
import { ComponentDocPage } from "./ComponentDocPage";
import { IndexPage } from "./IndexPage";
import { OverviewPage } from "./OverviewPage";

const overviewId = "overview";

export const docsHref = (componentId?: string): string => {
  if (componentId === undefined) {
    return "?view=docs";
  }
  return `?view=docs&component=${componentId}`;
};

const navItems: ReadonlyArray<SidebarNavItem> = [
  { key: overviewId, label: docsLabels.overview },
  ...componentDocs.map((doc) => ({ key: doc.id, label: doc.name })),
];

function DocsBrand() {
  return <span className="text-sm font-semibold">{docsLabels.title}</span>;
}

function body(componentId: string | null): ReactNode {
  if (componentId === overviewId) {
    return <OverviewPage />;
  }
  const doc = componentDocById(componentId);
  if (doc) {
    return <ComponentDocPage doc={doc} />;
  }
  return <IndexPage />;
}

export function DocsApp({ componentId }: { componentId: string | null }) {
  const activeKey = componentId ?? "";

  const renderSidebar = (_context: SidebarSlotContext) => (
    <AppSidebar
      brand={<DocsBrand />}
      navItems={navItems.map((item) => ({ ...item, isActive: item.key === activeKey }))}
      renderNavLink={(item, props) => <a {...props} href={docsHref(item.key)} />}
      labels={appSidebarLabels}
      footer={
        <a
          href="./"
          className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {docsLabels.backToChat}
        </a>
      }
    />
  );

  return (
    <AppShell brand={<DocsBrand />} renderSidebar={renderSidebar} labels={appShellLabels}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
        {body(componentId)}
      </div>
    </AppShell>
  );
}
