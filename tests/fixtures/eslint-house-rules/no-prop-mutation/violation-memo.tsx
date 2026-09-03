import { memo } from "react";

export const PinnedList = memo(({ pins }: { pins: string[] }) => {
  pins.push("top");

  return null;
});
