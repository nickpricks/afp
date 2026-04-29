import { relativeDateLabel } from '@/shared/utils/relative-date';

interface Props {
  date: string;
  today: string;
}

/** Sticky date header for grouped list views. Two-tier: relative for hot dates, structural for cold. */
export function DateGroupHeader({ date, today }: Props) {
  const label = relativeDateLabel(date, today);

  return (
    <div
      className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-line bg-surface px-4 pb-1.5 pt-3 text-[11px] uppercase tracking-[0.18em] text-fg-muted"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {label.relative && <span className="font-semibold text-accent">{label.relative}</span>}
      {label.relative && <span>·</span>}
      <span>{label.structural}</span>
      {label.week && (
        <>
          <span>·</span>
          <span>{label.week}</span>
        </>
      )}
      <span className="ml-2 h-px flex-1 bg-line opacity-50" />
    </div>
  );
}
