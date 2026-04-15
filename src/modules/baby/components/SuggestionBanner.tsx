import { useState, type ReactElement } from 'react';

import { SuggestionAction, type Suggestion } from '@/modules/baby/suggestions';
import { useSnooze } from '@/modules/baby/hooks/useSnooze';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { BabyMsg } from '@/constants/messages';

type Props = {
  suggestions: Suggestion[];
  onAct: (
    childId: string,
    feature: Suggestion['feature'],
    action: SuggestionAction,
  ) => Promise<void>;
};

/** Capitalizes a feature label */
function labelFor(feature: Suggestion['feature']): string {
  return feature.charAt(0).toUpperCase() + feature.slice(1);
}

/** Multi-line banner for the dashboard Baby card */
export function SuggestionBanner({ suggestions, onAct }: Props): ReactElement | null {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { snooze } = useSnooze();
  const { addToast } = useToast();

  const visible = suggestions.filter((s) => !dismissedIds.has(`${s.childId}:${s.feature}`));
  if (visible.length === 0) return null;

  const handleSnooze = async (s: Suggestion) => {
    const result = await snooze(s.childId, s.feature);
    if (result.ok) {
      addToast(BabyMsg.SuggestionSnoozed, ToastType.Info);
      setDismissedIds((prev) => new Set(prev).add(`${s.childId}:${s.feature}`));
    } else {
      addToast(result.error, ToastType.Error);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-[var(--accent-muted)] p-3 text-sm">
      <div className="mb-2 font-medium text-fg">Suggestions ({visible.length})</div>
      <ul className="space-y-2">
        {visible.map((s) => {
          const verb = s.action === SuggestionAction.Enable ? 'Enable' : 'Disable';
          const label = labelFor(s.feature);
          return (
            <li
              key={`${s.childId}:${s.feature}`}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-fg-muted">
                <strong className="text-fg">{s.childName}</strong>: {verb.toLowerCase()} {label}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onAct(s.childId, s.feature, s.action)}
                  className="rounded bg-accent px-2 py-1 text-xs text-fg-on-accent"
                >
                  {verb}
                </button>
                <button
                  type="button"
                  onClick={() => handleSnooze(s)}
                  className="rounded border border-line px-2 py-1 text-xs text-fg-muted"
                >
                  Snooze
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
