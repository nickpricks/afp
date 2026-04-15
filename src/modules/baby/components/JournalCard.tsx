import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
  /** When true, renders emptyText instead of children */
  empty?: boolean;
  emptyText?: string;
};

/** Generic card wrapper used by LifeJournalView — title + children + empty fallback */
export function JournalCard({
  title,
  children,
  empty,
  emptyText = 'No entries this period',
}: Props) {
  return (
    <div className="rounded-lg border border-line bg-surface-card p-3">
      <h3 className="mb-2 text-sm font-medium text-fg">{title}</h3>
      {empty ? <p className="text-sm text-fg-muted">{emptyText}</p> : children}
    </div>
  );
}
