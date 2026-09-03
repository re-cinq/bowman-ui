export const isRevealed = (open: boolean, mounted: boolean, hidden: boolean) => {
  return open && mounted && !hidden;
};

export const readStoredRatio = (raw: string): number | null => {
  try {
    return JSON.parse(raw) as number;
  } catch {
    return null;
  }
};

export const MeterTrack = ({ ratio }: { ratio: number }) => {
  const ratios = [ratio];

  ratios.push(1);

  return <div style={{ "--meter-ratio": ratios.length }} />;
};
