/**
 * Golden-master snapshot of the 23 icon implementations, the equivalence
 * oracle for tests/icons.test.tsx.
 *
 * Frozen straight-line copies of the 23 shipped icon functions, together
 * with private copies of getAccessibleIconProps and createSvgProps, written
 * without the createUniformIcon factory so the factory's output can be
 * proven against an implementation that never shares its code path. Every
 * <svg>, attribute and path d string is pinned byte-for-byte.
 * Do not "modernise" this file - its value is that it does NOT change when
 * src/icons does.
 */

interface BaseIconProps {
  className?: string;
  ariaLabel?: string;
  strokeWidth?: number;
}

interface IconSvgProps {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
  role?: string;
  "aria-label"?: string;
}

function getAccessibleIconProps(
  ariaLabel?: string
): Pick<IconSvgProps, "aria-hidden" | "role" | "aria-label"> {
  if (ariaLabel) {
    return {
      "aria-hidden": false,
      role: "img",
      "aria-label": ariaLabel,
    };
  }

  return {
    "aria-hidden": true,
  };
}

function createSvgProps(props: BaseIconProps): IconSvgProps {
  const { className, ariaLabel, strokeWidth = 2 } = props;

  return {
    className,
    strokeWidth,
    ...getAccessibleIconProps(ariaLabel),
  };
}

export function ChatIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export function DashboardIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

export function SettingsIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export function SearchIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function TrashIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export function PlusIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

export function MenuIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

export function CloseIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function ArtifactsIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );
}

export function CompareIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

export function SendIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

export function CopyIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

export function ThumbsUpIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    </svg>
  );
}

export function ThumbsDownIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
      />
    </svg>
  );
}

export function RefreshIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export function ChevronDownIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function ChevronUpIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M5 15l7-7 7 7"
      />
    </svg>
  );
}

export function CheckIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function WarningIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export function ErrorIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function InfoIcon(props: BaseIconProps) {
  const svgProps = createSvgProps(props);

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function LoadingIcon(props: BaseIconProps) {
  const { className, ariaLabel = "Loading" } = props;
  const accessibleProps = getAccessibleIconProps(ariaLabel);

  return (
    <svg
      className={`animate-spin ${className || ""}`}
      fill="none"
      viewBox="0 0 24 24"
      {...accessibleProps}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function DatabaseIcon(props: BaseIconProps) {
  const svgProps = createSvgProps({ ...props, strokeWidth: props.strokeWidth ?? 1.5 });

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...svgProps}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={svgProps.strokeWidth}
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
      />
    </svg>
  );
}
