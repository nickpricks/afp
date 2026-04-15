import { useCallback, useState } from 'react';
import { useParams, useNavigate, generatePath } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';

import { FeedLog } from '@/modules/baby/components/FeedLog';
import { SleepLog } from '@/modules/baby/components/SleepLog';
import { GrowthLog } from '@/modules/baby/components/GrowthLog';
import { EliminationLog } from '@/modules/baby/components/EliminationLog';
import { MealsLog } from '@/modules/baby/components/MealsLog';
import { NeedsLog } from '@/modules/baby/components/NeedsLog';
import { MilestonesLog } from '@/modules/baby/components/MilestonesLog';
import { SuggestionStrip } from '@/modules/baby/components/SuggestionStrip';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useSuggestions } from '@/modules/baby/hooks/useSuggestions';
import { configFieldFor, SuggestionAction } from '@/modules/baby/suggestions';
import type { SuggestionFeature } from '@/modules/baby/suggestions';
import { useAuth } from '@/shared/auth/useAuth';
import { db } from '@/shared/auth/firebase-config';
import type { Child } from '@/modules/baby/types';
import { computeAge } from '@/modules/baby/utils';
import { ROUTES } from '@/constants/routes';

/** Tab identifiers for the child detail view */
type TabId = 'dashboard' | 'feeding' | 'sleep' | 'growth' | 'diapers' | 'meals' | 'needs' | 'milestones';

/** Tab definition with id, label, and visibility flag */
type TabDef = { id: TabId; label: string; visible: boolean };

/** Per-child detail view with tabbed interface — reads childId from URL params */
export function ChildDetail() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { children, loading } = useChildren();
  const { firebaseUser } = useAuth();

  const child = children.find((c) => c.id === childId) ?? null;
  const siblings = children.filter((c) => c.id !== childId);
  const uid = firebaseUser?.uid ?? '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-fg-muted">
        Loading...
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-fg-muted">Child not found.</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.BABY)}
          className="text-accent font-medium text-sm"
        >
          &larr; Back to Baby
        </button>
      </div>
    );
  }

  return <ChildDetailInner child={child} siblings={siblings} uid={uid} onBack={() => navigate(ROUTES.BABY)} />;
}

/** Inner component that renders tabs once the child is resolved */
function ChildDetailInner({ child, siblings, uid, onBack }: { child: Child; siblings: Child[]; uid: string; onBack: () => void }) {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const suggestions = useSuggestions(child);
  const diapersOn = child.config.diapers;
  const pottyOn = child.config.potty ?? false;
  const eliminationLabel =
    diapersOn && pottyOn ? 'Elimination' : pottyOn ? 'Potty' : 'Diapers';
  const tabs: TabDef[] = [
    { id: 'dashboard', label: 'Dashboard', visible: true },
    { id: 'feeding', label: 'Feeding', visible: child.config.feeding },
    { id: 'sleep', label: 'Sleep', visible: child.config.sleep },
    { id: 'growth', label: 'Growth', visible: child.config.growth },
    { id: 'diapers', label: eliminationLabel, visible: diapersOn || pottyOn },
    { id: 'meals', label: 'Meals', visible: child.config.meals ?? false },
    { id: 'needs', label: 'Needs', visible: child.config.needs ?? false },
    { id: 'milestones', label: 'Milestones', visible: child.config.milestones ?? false },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const childId = child.id ?? '';
  const siblingIds = siblings.map((s) => s.id).filter(Boolean) as string[];

  /** Applies a suggestion by updating the child's config flag in Firestore */
  const applySuggestion = useCallback(
    async (targetChildId: string, feature: SuggestionFeature) => {
      if (!firebaseUser) return;
      const sug = suggestions.find((s) => s.feature === feature);
      if (!sug) return;
      const recommendOn = sug.action === SuggestionAction.Enable;
      const field = configFieldFor(feature);
      const ref = doc(db, `users/${firebaseUser.uid}/children/${targetChildId}`);
      await updateDoc(ref, { [`config.${field}`]: recommendOn });
    },
    [firebaseUser, suggestions],
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-accent font-medium text-sm"
        >
          &larr; Back
        </button>
        <div>
          <h2 className="text-lg font-semibold text-fg">{child.name}</h2>
          <p className="text-sm text-fg-muted">{computeAge(child.dob)} old</p>
        </div>
      </div>

      {/* Sibling quick-nav — jump to same tab on another child */}
      {
        siblings.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">Switch:</span>
            {
              siblings.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(generatePath(ROUTES.BABY_CHILD, { childId: s.id! }))}
                  className="rounded-full bg-surface-card border border-line px-3 py-1 text-xs font-medium text-fg-muted hover:border-accent hover:text-accent transition-colors active:scale-95"
                >
                  {s.name}
                </button>
              ))
            }
          </div>
        )
      }

      {/* Age-based suggestion strip */}
      <SuggestionStrip suggestions={suggestions} onEnable={applySuggestion} />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {
          visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                `px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
                }`
              }
            >
              {tab.label}
            </button>
          ))
        }
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab child={child} onNavigate={setActiveTab} />}
      {activeTab === 'feeding' && <FeedLog childId={childId} siblingIds={siblingIds} uid={uid} />}
      {activeTab === 'sleep' && <SleepLog childId={childId} siblingIds={siblingIds} uid={uid} />}
      {activeTab === 'growth' && <GrowthLog childId={childId} siblingIds={siblingIds} uid={uid} />}
      {activeTab === 'diapers' && (
        <EliminationLog
          childId={childId}
          siblingIds={siblingIds}
          uid={uid}
          diapersEnabled={diapersOn}
          pottyEnabled={pottyOn}
        />
      )}
      {activeTab === 'meals' && <MealsLog childId={childId} siblingIds={siblingIds} uid={uid} />}
      {activeTab === 'needs' && <NeedsLog childId={childId} siblingIds={siblingIds} uid={uid} />}
      {activeTab === 'milestones' && <MilestonesLog childId={childId} siblingIds={siblingIds} uid={uid} />}
    </div>
  );
}

/** Dashboard tab showing today's summary and quick action buttons */
function DashboardTab({ child, onNavigate }: { child: Child; onNavigate: (tab: TabId) => void }) {
  const diapersOn = child.config.diapers;
  const pottyOn = child.config.potty ?? false;
  const eliminationLabel =
    diapersOn && pottyOn ? 'Elimination' : pottyOn ? 'Potty' : 'Diapers';
  const eliminationIcon = pottyOn && !diapersOn ? '🚽' : '🧷';
  const eliminationDescription =
    pottyOn && !diapersOn ? 'Log potty events' : diapersOn && pottyOn ? 'Log changes / events' : 'Log changes';
  return (
    <div className="flex flex-col gap-4 py-4">
      <h3 className="text-base font-medium text-fg">Today&apos;s Summary</h3>
      <div className="grid grid-cols-2 gap-3">
        {
child.config.feeding && (
          <SummaryCard label="Feeding" icon="🍼" description="Log feeds" onClick={() => onNavigate('feeding')} />
        )
}
        {
child.config.sleep && (
          <SummaryCard label="Sleep" icon="😴" description="Log sleep" onClick={() => onNavigate('sleep')} />
        )
}
        {
child.config.growth && (
          <SummaryCard label="Growth" icon="📏" description="Log measurements" onClick={() => onNavigate('growth')} />
        )
}
        {
(diapersOn || pottyOn) && (
          <SummaryCard label={eliminationLabel} icon={eliminationIcon} description={eliminationDescription} onClick={() => onNavigate('diapers')} />
        )
}
        {
child.config.meals && (
          <SummaryCard label="Meals" icon="🍽" description="Log meals" onClick={() => onNavigate('meals')} />
        )
}
        {
child.config.needs && (
          <SummaryCard label="Needs" icon="🛍" description="Wishlist + inventory" onClick={() => onNavigate('needs')} />
        )
}
        {
child.config.milestones && (
          <SummaryCard label="Milestones" icon="🌟" description="Firsts + achievements" onClick={() => onNavigate('milestones')} />
        )
}
      </div>
    </div>
  );
}

/** Tappable summary card that navigates to a module tab */
function SummaryCard({ label, icon, description, onClick }: { label: string; icon: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-surface-card border border-line p-3 text-left transition-all hover:border-accent/40 hover:shadow-sm active:scale-95"
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <p className="text-sm font-medium text-fg">{label}</p>
      </div>
      <p className="text-xs text-fg-muted mt-1">{description}</p>
    </button>
  );
}
