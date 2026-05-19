/** Props for RowTime. */
interface Props {
  timestamp: string | undefined;
}

/** Tabular-nums time prefix for list rows. Renders HH:mm in local time, or em-dash when missing. */
export function RowTime({ timestamp }: Props) {
  if (!timestamp) {
    return <span className="font-mono text-xs tabular-nums text-fg-muted">—</span>;
  }

  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return (
    <span className="font-mono text-xs tabular-nums tracking-wider text-fg-muted">
      {hh}:{mm}
    </span>
  );
}
