// Compiled by tests/icons-dist.test.ts with tsc --noEmit against the BUILT
// package: the self-referencing "@re-cinq/bowman-ui" import resolves through
// package.json's "." exports entry to dist/index.d.ts. That proves IconProps,
// IconSvgProps, IconWrapper and getAccessibleIconProps all reach a consumer,
// and that the IconProps wrapper 018 recorded as impossible now compiles.
import {
  IconWrapper,
  SendIcon,
  getAccessibleIconProps,
  type IconProps,
  type IconSvgProps,
} from "@re-cinq/bowman-ui";
import type { ReactElement } from "react";

const Wrapped = (p: IconProps) => <SendIcon {...p} />;

const explicitProps: IconProps = {
  className: "h-4 w-4",
  ariaLabel: "Send",
  strokeWidth: 1.5,
};

const directCall: ReactElement = SendIcon(explicitProps);

const svgProps: IconSvgProps = {
  className: "h-4 w-4",
  ...getAccessibleIconProps("Send"),
};

const wrapped = (
  <IconWrapper {...svgProps}>
    <path d="M0 0" />
  </IconWrapper>
);

// @ts-expect-error -- the dead {name: string} registry shape must stay dead
const registryShape: IconProps = { name: "search" };

void Wrapped;
void explicitProps;
void directCall;
void wrapped;
void registryShape;
