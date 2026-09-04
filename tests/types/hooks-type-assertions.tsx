// Compiled by tests/hooks-dist.test.ts with tsc --noEmit against the BUILT
// package: the self-referencing "@re-cinq/bowman-ui" import resolves through
// package.json's "." exports entry to dist/index.d.ts. Proves the five hooks,
// ErrorBoundary and their option types all reach a consumer, and that
// useSidebarState cannot be called without a storagePrefix.
import { useRef } from "react";
import {
  ErrorBoundary,
  useDebounce,
  useFocusGroups,
  useFocusTrap,
  useReducedMotion,
  useSidebarState,
  type ErrorBoundaryLabels,
  type FocusGroupsOptions,
  type SidebarStateOptions,
} from "@re-cinq/bowman-ui";

const focusOptions: FocusGroupsOptions = {
  announce: (group) => `Ahora en ${group}`,
};
const sidebarOptions: SidebarStateOptions = {
  storagePrefix: "olt-",
  defaultOpen: false,
};
const labels: Partial<ErrorBoundaryLabels> = { title: "Algo salió mal" };

const Consumer = () => {
  const debounced: string = useDebounce("query", 300);
  const reduced: boolean = useReducedMotion(true);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useFocusTrap<HTMLDivElement>(true, () => {}, triggerRef);

  useFocusGroups(focusOptions);
  const sidebar = useSidebarState("chat", sidebarOptions);

  // @ts-expect-error -- storagePrefix is required; an empty options object must not compile
  useSidebarState("chat", {});

  return (
    <ErrorBoundary labels={labels} onError={(error) => void error}>
      <div ref={containerRef}>
        {debounced}
        {String(reduced)}
        {String(sidebar.isOpen)}
      </div>
    </ErrorBoundary>
  );
};

void Consumer;
