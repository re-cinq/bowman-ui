"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap.js";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { CloseIcon, MenuIcon } from "../icons/index.js";
import { resolveLabels } from "../labels.js";

export interface SidebarSlotContext {
  variant: "desktop" | "mobile";
  /** Closes the mobile drawer. Callable from either variant: from the
   *  desktop rail it re-reports the (already false-effective) open state,
   *  which keeps a shared renderSidebar implementation safe to wire. */
  close: () => void;
}

export interface AppShellLabels {
  openSidebar: string;
  closeSidebar: string;
  skipToMainContent: string;
  /** The mobile drawer dialog's accessible name. */
  sidebarDialog: string;
}

export const defaultAppShellLabels: Readonly<Required<AppShellLabels>> = Object.freeze({
  openSidebar: "Open menu",
  closeSidebar: "Close menu",
  skipToMainContent: "Skip to main content",
  sidebarDialog: "Menu",
});

export interface AppShellProps {
  children: ReactNode;
  /** Called once per position - desktop rail and mobile drawer. The sidebar's landmarks are its own. */
  renderSidebar?: (context: SidebarSlotContext) => ReactNode;
  /** Rendered in the mobile header row; omitted, the header shows only the hamburger. */
  brand?: ReactNode;
  /** Controlled open state; a controlling consumer owns closing on navigation (CONTRACT.md § AppShell). */
  mobileSidebarOpen?: boolean;
  onMobileSidebarOpenChange?: (open: boolean) => void;
  mainContentId?: string;
  skipLink?: boolean;
  /** Switches the drawer transitions off entirely; undefined tracks prefers-reduced-motion. */
  reducedMotion?: boolean;
  labels?: Partial<AppShellLabels>;
}

export function AppShell({
  children,
  renderSidebar,
  brand,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
  mainContentId = "main-content",
  skipLink = true,
  reducedMotion,
  labels,
}: AppShellProps) {
  const resolved = resolveLabels(defaultAppShellLabels, labels);
  const motionOff = useReducedMotion(reducedMotion);

  const isControlled = mobileSidebarOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = isControlled ? mobileSidebarOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(open);
      }
      onMobileSidebarOpenChange?.(open);
    },
    [isControlled, onMobileSidebarOpenChange]
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useFocusTrap<HTMLDivElement>(isOpen, close, hamburgerRef);
  const drawerId = useId();

  // The lock lifts while the viewport sits at the desktop breakpoint, where
  // md:hidden hides the drawer but the open state persists - without the
  // media listener a rotate-to-desktop stranded the page unscrollable. The
  // 768px literal mirrors the component's own md:* classes: a consumer
  // redefining --breakpoint-md diverges from those classes identically.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const desktopQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(min-width: 768px)") : undefined;
    const applyLock = () => {
      document.body.style.overflow = desktopQuery?.matches ? previousOverflow : "hidden";
    };
    applyLock();
    desktopQuery?.addEventListener("change", applyLock);
    return () => {
      desktopQuery?.removeEventListener("change", applyLock);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const backdropMotionClass = motionOff ? "" : " transition-opacity duration-300";
  const backdropStateClass = isOpen ? "opacity-100" : "pointer-events-none opacity-0";
  const drawerMotionClass = motionOff ? "" : " transition-transform duration-300 ease-out";
  const drawerStateClass = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {skipLink && (
        <a
          href={`#${mainContentId}`}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:bg-slate-900 dark:focus:text-white dark:focus:ring-blue-400"
        >
          {resolved.skipToMainContent}
        </a>
      )}

      <div className="hidden md:flex">{renderSidebar?.({ variant: "desktop", close })}</div>

      <div
        data-testid="app-shell-backdrop"
        className={`fixed inset-0 z-50 bg-black/50 md:hidden${backdropMotionClass} ${backdropStateClass}`}
        onClick={close}
      />

      <div
        ref={drawerRef}
        id={drawerId}
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? "true" : undefined}
        aria-label={isOpen ? resolved.sidebarDialog : undefined}
        data-testid="app-shell-drawer"
        inert={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden${drawerMotionClass} ${drawerStateClass}`}
      >
        <div className="flex h-14 items-center justify-end border-b border-slate-200 px-4 dark:border-slate-800">
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 ring-offset-2 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:ring-offset-slate-900 dark:hover:bg-slate-800 dark:focus:ring-blue-400"
            aria-label={resolved.closeSidebar}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        {renderSidebar?.({ variant: "mobile", close })}
      </div>

      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <button
          ref={hamburgerRef}
          type="button"
          aria-controls={drawerId}
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 ring-offset-2 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:ring-offset-slate-900 dark:hover:bg-slate-800 dark:focus:ring-blue-400"
          aria-label={resolved.openSidebar}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        {brand != null && (
          <>
            {brand}
            <div className="h-10 w-10" />
          </>
        )}
      </div>

      <main
        id={mainContentId}
        className="relative flex flex-1 flex-col overflow-hidden pt-14 md:pt-0"
      >
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950">{children}</div>
      </main>
    </div>
  );
}
