"use client";

import { Fragment, type ComponentType, type ReactNode } from "react";
import { resolveLabels } from "../labels.js";

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

export const defaultAppSidebarLabels: Readonly<Required<AppSidebarLabels>> =
  Object.freeze({
    sidebar: "Sidebar",
    mainNavigation: "Main navigation",
  });

export interface AppSidebarProps {
  /** Rendered inside the bordered top row; omitted, no row renders at all. */
  brand?: ReactNode;
  navItems?: ReadonlyArray<SidebarNavItem>;
  onNavigate?: (key: string) => void;
  /** The routing seam: the consumer's element must spread every prop it is handed (docs/design-notes.md § renderNavLink). */
  renderNavLink?: (
    item: SidebarNavItem,
    props: SidebarNavLinkProps,
  ) => ReactNode;
  children?: ReactNode;
  /** One slot for whatever the consumer keeps at the bottom; omitted, no bordered region renders. */
  footer?: ReactNode;
  labels?: Partial<AppSidebarLabels>;
}

const defaultRenderNavLink = (
  _item: SidebarNavItem,
  props: SidebarNavLinkProps,
) => <button type="button" {...props} />;

const navLinkClassName = (isActive: boolean) =>
  `group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium ring-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-offset-slate-900 dark:focus:ring-blue-400 ${
    isActive
      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
  }`;

// Below md the only 030 position is the drawer - a column flex beside a 56px
// close row, where flex-1 + min-h-0 fills the remaining height and h-full
// would overflow. At md+ the only position is the row-flex rail, where flex-1
// (basis 0) would collapse the width, so the aside pins its own size and
// right border there; the drawer supplies both below md.
const asideClassName =
  "flex min-h-0 flex-1 flex-col bg-white dark:bg-slate-900 md:h-full md:w-64 md:flex-none md:border-r md:border-slate-200 md:dark:border-slate-800 lg:w-72";

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
        <div className="flex h-14 flex-shrink-0 items-center border-b border-slate-200 px-4 dark:border-slate-800">
          {brand}
        </div>
      )}
      {navItems !== undefined && navItems.length > 0 && (
        <nav
          aria-label={resolved.mainNavigation}
          className="flex-shrink-0 space-y-1 px-3 py-3"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const linkProps: SidebarNavLinkProps = {
              className: navLinkClassName(item.isActive === true),
              children: (
                <>
                  {Icon && <Icon className="h-5 w-5" />}
                  {item.label}
                </>
              ),
              onClick: () => onNavigate?.(item.key),
              "aria-current": item.isActive === true ? "page" : undefined,
            };

            return (
              <Fragment key={item.key}>
                {renderNavLink(item, linkProps)}
              </Fragment>
            );
          })}
        </nav>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
      {footer != null && (
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800">
          {footer}
        </div>
      )}
    </aside>
  );
}
