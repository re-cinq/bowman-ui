export const clampRatio = (ratio: number) => {
  if (ratio > 1) return 1;
  return Math.min(ratio, 1);
};
