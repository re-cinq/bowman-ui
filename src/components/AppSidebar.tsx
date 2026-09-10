"use client";

import { Fragment, type ComponentType, type ReactNode } from "react";
import { resolveLabels } from "../labels.js";
import {
  ACTIVE_ROW_BG,
  BORDER,
  BORDER_MD,
  FOCUS_RING_COLOR,
  RING_OFFSET,
  SURFACE,
  SURFACE_HOVER,
  TEXT_SECONDARY,
} from "../theme/tokens.js";

export interface SidebarNavItem {
  key: string;
  /** Display-ready text - the library reads no translation catalogue. */
  label: string;
  icon?: ComponentType<{ className?: string }>;
  /** Supplied by the consumer - the component runs no path comparison itself. */
  isActive?: boolean;
}

export interface SidebarNavLinkProps {
  className: string;
  children: ReactNode;
  onClick: () => void;
  "aria-current"?: "page";
}

export interface AppSidebarLabels {
  /** The aside landmark's accessible name. */
  sidebar: string;
  /** The nav landmark's accessible name. */
  mainNavigation: string;
}

export const defaultAppSidebarLabels: Readonly<Required<AppSidebarLabels>> = Object.freeze({
  sidebar: "Sidebar",
  mainNavigation: "Main navigation",
});

export interface AppSidebarProps {
  /** Rendered inside the bordered top row; omitted, no row renders at all. */
  brand?: ReactNode;
  navItems?: ReadonlyArray<SidebarNavItem>;
  onNavigate?: (key: string) => void;
  /** The routing seam: the consumer's element must spread every prop it is handed (docs/design-notes.md § renderNavLink). */
  renderNavLink?: (item: SidebarNavItem, props: SidebarNavLinkProps) => ReactNode;
  children?: ReactNode;
  /** One slot for whatever the consumer keeps at the bottom; omitted, no bordered region renders. */
  footer?: ReactNode;
  labels?: Partial<AppSidebarLabels>;
}

const defaultRenderNavLink = (_item: SidebarNavItem, props: SidebarNavLinkProps) => (
  <button type="button" {...props} />
);

const navLinkClassName = (isActive: boolean) =>
  `group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ring-offset-2 transition-colors focus:outline-none focus:ring-2 ${FOCUS_RING_COLOR} ${RING_OFFSET} ${
    isActive
      ? `${ACTIVE_ROW_BG} text-slate-900 dark:text-white`
      : `${TEXT_SECONDARY} ${SURFACE_HOVER} hover:text-slate-900 dark:hover:text-white`
  }`;

// Drawer below md (flex-1 + min-h-0 fills the height); rail at md+ pins its own width, as flex-1 would collapse it.
const asideClassName = `flex min-h-0 flex-1 flex-col ${SURFACE} md:h-full md:w-64 md:flex-none md:border-r ${BORDER_MD} lg:w-72`;

export function AppSidebar({
  brand,
  navItems,
  onNavigate,
  renderNavLink = defaultRenderNavLink,
  children,
  footer,
  labels,
}: AppSidebarProps) {
  const resolved = resolveLabels(defaultAppSidebarLabels, labels);

  return (
    <aside aria-label={resolved.sidebar} className={asideClassName}>
      {brand != null && (
        <div className={`flex h-14 flex-shrink-0 items-center border-b ${BORDER} px-4`}>
          {brand}
        </div>
      )}
      {navItems !== undefined && navItems.length > 0 && (
        <nav aria-label={resolved.mainNavigation} className="flex-shrink-0 space-y-1 px-3 py-3">
          {navItems.map((navItem) => {
            const Icon = navItem.icon;
            const linkProps: SidebarNavLinkProps = {
              className: navLinkClassName(navItem.isActive === true),
              children: (
                <>
                  {Icon && <Icon className="h-5 w-5" />}
                  {navItem.label}
                </>
              ),
              onClick: () => onNavigate?.(navItem.key),
              "aria-current": navItem.isActive === true ? "page" : undefined,
            };

            return <Fragment key={navItem.key}>{renderNavLink(navItem, linkProps)}</Fragment>;
          })}
        </nav>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      {footer != null && <div className={`flex-shrink-0 border-t ${BORDER}`}>{footer}</div>}
    </aside>
  );
}
