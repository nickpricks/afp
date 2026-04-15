import { useState, type ReactElement } from 'react';

import { SuggestionAction, type Suggestion } from '@/modules/baby/suggestions';
import { useSnooze } from '@/modules/baby/hooks/useSnooze';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { BabyMsg } from '@/constants/messages';

type Props = {
  suggestions: Suggestion[];
  onEnable: (childId: string, feature: Suggestion['feature']) => Promise<void>;
};

/** Capitalizes a feature label */
function labelFor(feature: Suggestion['feature']): string {
  return feature.charAt(0).toUpperCase() + feature.slice(1);
}

/** One-line strip in ChildDetail shell — visible across all child tabs */
export function SuggestionStrip({ suggestions, onEnable }: Props): ReactElement | null {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { snooze } = useSnooze();
  const { addToast } = useToast();

  if (dismissed || suggestions.length === 0) return null;

  const first = suggestions[0]!;
  const verb = first.action === SuggestionAction.Enable ? 'enable' : 'disable';
  const label = labelFor(first.feature);
  const summary =
    suggestions.length === 1
      ? `Suggestion: ${verb} ${label} module`
      : `${suggestions.length} suggestions for this child`;

  const handleAct = async () => {
    await onEnable(first.childId, first.feature);
    addToast(
      first.action === SuggestionAction.Enable
        ? BabyMsg.SuggestionEnabled
        : BabyMsg.SuggestionDisabled,
      ToastType.Success,
    );
  };

  const handleSnooze = async () => {
    const result = await snooze(first.childId, first.feature);
    if (result.ok) {
      addToast(BabyMsg.SuggestionSnoozed, ToastType.Info);
      setDismissed(true);
    } else {
      addToast(result.error, ToastType.Error);
    }
  };

  return (
    <div className="bg-[var(--accent-muted)] border-l-2 border-l-accent px-3 py-2 text-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left text-fg"
      >
        <span>{summary}</span>
        <span className="text-fg-muted">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleAct}
            className="rounded bg-accent px-3 py-1 text-xs text-fg-on-accent"
          >
            {first.action === SuggestionAction.Enable ? 'Enable' : 'Disable'}
          </button>
          <button
            type="button"
            onClick={handleSnooze}
            className="rounded border border-line px-3 py-1 text-xs text-fg-muted"
          >
            Snooze 30d
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded px-3 py-1 text-xs text-fg-muted"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
