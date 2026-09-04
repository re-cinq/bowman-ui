// Compiled by tests/app-sidebar-dist.test.ts with tsc --noEmit against the
// BUILT package: the self-referencing "@re-cinq/bowman-ui" import resolves
// through package.json's "." exports entry to dist/index.d.ts. Pins the two
// compile-time promises the sidebar issue makes: SidebarNavItem has no href
// field (routing belongs entirely to the consumer's renderNavLink), and a
// key added to AppSidebarLabels without a default cannot satisfy
// Readonly<Required<AppSidebarLabels>>.
import {
  AppSidebar,
  ChatIcon,
  defaultAppSidebarLabels,
  type AppSidebarLabels,
  type SidebarNavItem,
  type SidebarNavLinkProps,
} from "@re-cinq/bowman-ui";

const completeDefaults = defaultAppSidebarLabels satisfies Readonly<
  Required<AppSidebarLabels>
>;

// @ts-expect-error -- a labels key without a default must not compile: an
// object missing `mainNavigation` is not a
// Readonly<Required<AppSidebarLabels>>.
const incompleteDefaults: Readonly<Required<AppSidebarLabels>> = {
  sidebar: "Sidebar",
};

const itemWithHref: SidebarNavItem = {
  key: "chat",
  label: "Chat",
  // @ts-expect-error -- SidebarNavItem has no href field: a nav item carries
  // its resolved label and no route, so this fails the build if href ever
  // compiles.
  href: "/chat",
};

const items: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: ChatIcon, isActive: true },
  { key: itemWithHref.key, label: incompleteDefaults.sidebar },
];

const Consumer = () => (
  <AppSidebar
    brand={<span>4711</span>}
    navItems={items}
    onNavigate={(key: string) => void key}
    renderNavLink={(item: SidebarNavItem, props: SidebarNavLinkProps) => (
      <a href={"/" + item.key} {...props} />
    )}
    footer={<button type="button">4712</button>}
    labels={{ sidebar: completeDefaults.sidebar }}
  >
    <span>4713</span>
  </AppSidebar>
);

void Consumer;
