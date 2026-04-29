interface Props {
  up: number;
  down: number;
  goal: number;
}

/** Inline split bar visualizing floors-up vs floors-down for a day, scaled against the daily goal. */
export function FloorMagnitudeBar({ up, down, goal }: Props) {
  if (up + down === 0) return null;

  const filler = Math.max(0, goal - up - down);

  return (
    <div className="flex h-3 gap-0.5 overflow-hidden rounded-sm bg-line">
      {up > 0 && <div data-segment="up" className="h-full bg-accent" style={{ flex: up }} />}
      {down > 0 && (
        <div data-segment="down" className="h-full bg-accent opacity-40" style={{ flex: down }} />
      )}
      {filler > 0 && <div data-segment="empty" style={{ flex: filler }} />}
    </div>
  );
}
