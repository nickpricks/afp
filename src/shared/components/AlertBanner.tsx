import { AlertType, Severity } from '@/shared/types';
import type { Notification } from '@/shared/types';

/** Color classes by severity */
const SEVERITY_STYLES: Record<Severity, string> = {
  [Severity.Info]: 'bg-blue-900/80 text-blue-200 border-blue-700',
  [Severity.Warning]: 'bg-amber-900/80 text-amber-200 border-amber-700',
  [Severity.Critical]: 'bg-red-900/80 text-red-200 border-red-700',
};

/** Severity emoji prefix */
const SEVERITY_ICON: Record<Severity, string> = {
  [Severity.Info]: '\u2139\uFE0F',
  [Severity.Warning]: '\u26A0\uFE0F',
  [Severity.Critical]: '\uD83D\uDEA8',
};

interface AlertBannerProps {
  alerts: Notification[];
  onDismiss: (id: string) => void;
}

/** Renders stacked admin alert banners above the header */
export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-0">
      {alerts.map((alert) => {
        const severity = (alert.severity as Severity) ?? Severity.Info;
        const isDismissible = alert.alertType === AlertType.Notice;

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between px-4 py-2 text-sm border-b ${SEVERITY_STYLES[severity]}`}
          >
            <span>
              {SEVERITY_ICON[severity]} {alert.message}
            </span>
            {isDismissible && (
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                className="ml-3 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            )}
            {!isDismissible && (
              <span className="ml-3 text-xs opacity-40">Expires {alert.shownTillDate}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
