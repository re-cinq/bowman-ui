const settings = { err: 404 };

const fallbackFor = (code: number): number => {
  return code;
};

export const readStatus = (raw: string) => {
  try {
    return JSON.parse(raw) as number;
  } catch (err) {
    return fallbackFor(settings.err);
  }
};
