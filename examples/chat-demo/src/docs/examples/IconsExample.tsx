import {
  ArtifactsIcon,
  ChatIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  CompareIcon,
  CopyIcon,
  DashboardIcon,
  DatabaseIcon,
  ErrorIcon,
  InfoIcon,
  LoadingIcon,
  MenuIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
  WarningIcon,
} from "@re-cinq/bowman-ui";
import type { IconProps } from "@re-cinq/bowman-ui";
import type { ComponentType } from "react";

// The whole set. Every icon takes className, ariaLabel and strokeWidth; an
// icon with no ariaLabel renders aria-hidden, which is what a glyph beside a
// text label wants. LoadingIcon names itself "Loading" unless told otherwise.
const icons: ReadonlyArray<{ name: string; Icon: ComponentType<IconProps> }> = [
  { name: "ArtifactsIcon", Icon: ArtifactsIcon },
  { name: "ChatIcon", Icon: ChatIcon },
  { name: "CheckIcon", Icon: CheckIcon },
  { name: "ChevronDownIcon", Icon: ChevronDownIcon },
  { name: "ChevronUpIcon", Icon: ChevronUpIcon },
  { name: "CloseIcon", Icon: CloseIcon },
  { name: "CompareIcon", Icon: CompareIcon },
  { name: "CopyIcon", Icon: CopyIcon },
  { name: "DashboardIcon", Icon: DashboardIcon },
  { name: "DatabaseIcon", Icon: DatabaseIcon },
  { name: "ErrorIcon", Icon: ErrorIcon },
  { name: "InfoIcon", Icon: InfoIcon },
  { name: "LoadingIcon", Icon: LoadingIcon },
  { name: "MenuIcon", Icon: MenuIcon },
  { name: "PlusIcon", Icon: PlusIcon },
  { name: "RefreshIcon", Icon: RefreshIcon },
  { name: "SearchIcon", Icon: SearchIcon },
  { name: "SendIcon", Icon: SendIcon },
  { name: "SettingsIcon", Icon: SettingsIcon },
  { name: "ThumbsDownIcon", Icon: ThumbsDownIcon },
  { name: "ThumbsUpIcon", Icon: ThumbsUpIcon },
  { name: "TrashIcon", Icon: TrashIcon },
  { name: "WarningIcon", Icon: WarningIcon },
];

export function IconsExample() {
  return (
    <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {icons.map(({ name, Icon }) => (
        <li
          key={name}
          className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-200"
        >
          <Icon className="h-5 w-5" ariaLabel="" />
          <code className="truncate font-mono text-xs">{name}</code>
        </li>
      ))}
    </ul>
  );
}
