export const canRetrySend = (
  online: boolean,
  draftReady: boolean,
  belowLimit: boolean,
  idle: boolean,
) => {
  if (online && draftReady && belowLimit && idle) {
    return true;
  }

  return false;
};
