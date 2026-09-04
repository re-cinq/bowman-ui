const parseTimestamp = (raw: string): number => {
  return JSON.parse(raw) as number;
};

export const readTimestamp = (raw: string) => {
  try {
    return parseTimestamp(raw);
  } catch {
    return Number(raw);
  }
};
