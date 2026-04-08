import { Link } from 'react-router-dom';

/** Reusable dashboard summary card linking to a module page */
export function DashboardCard({
  title,
  icon,
  metric,
  subtitle,
  to,
}: {
  title: string;
  icon: string;
  metric: string;
  subtitle: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group relative rounded-xl border border-l-2 border-line border-l-accent bg-surface-card shadow-sm p-4 transition-all hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-fg-muted uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
      </div>
      <div className="rounded-lg bg-[var(--accent-muted)] px-3 py-2">
        <p className="text-3xl font-bold text-fg">{metric}</p>
      </div>
      <p className="mt-2 text-xs text-fg-muted">{subtitle}</p>
    </Link>
  );
}
