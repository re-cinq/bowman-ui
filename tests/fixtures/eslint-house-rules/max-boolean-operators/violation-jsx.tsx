export const StatusDot = ({
  online,
  visible,
  synced,
  idle,
}: {
  online: boolean;
  visible: boolean;
  synced: boolean;
  idle: boolean;
}) => {
  return <span>{online && visible && synced && idle && <i />}</span>;
};
