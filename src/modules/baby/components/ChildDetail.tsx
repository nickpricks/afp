import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { FeedLog } from '@/modules/baby/components/FeedLog';
import { SleepLog } from '@/modules/baby/components/SleepLog';
import { GrowthLog } from '@/modules/baby/components/GrowthLog';
import { DiaperLog } from '@/modules/baby/components/DiaperLog';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import type { Child } from '@/modules/baby/types';
import { computeAge } from '@/modules/baby/utils';
import { ROUTES } from '@/constants/routes';

/** Tab identifiers for the child detail view */
type TabId = 'dashboard' | 'feeding' | 'sleep' | 'growth' | 'diapers';

/** Tab definition with id, label, and visibility flag */
type TabDef = { id: TabId; label: string; visible: boolean };

/** Per-child detail view with tabbed interface — reads childId from URL params */
export function ChildDetail() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { children, loading } = useChildren();

  const child = children.find((c) => c.id === childId) ?? null;

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

  return <ChildDetailInner child={child} onBack={() => navigate(ROUTES.BABY)} />;
}

/** Inner component that renders tabs once the child is resolved */
function ChildDetailInner({ child, onBack }: { child: Child; onBack: () => void }) {
  const tabs: TabDef[] = [
    { id: 'dashboard', label: 'Dashboard', visible: true },
    { id: 'feeding', label: 'Feeding', visible: child.config.feeding },
    { id: 'sleep', label: 'Sleep', visible: child.config.sleep },
    { id: 'growth', label: 'Growth', visible: child.config.growth },
    { id: 'diapers', label: 'Diapers', visible: child.config.diapers },
  ];

  const visibleTabs = tabs.filter((t) => t.visible);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const childId = child.id ?? '';

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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {
visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
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
      {activeTab === 'feeding' && <FeedLog childId={childId} />}
      {activeTab === 'sleep' && <SleepLog childId={childId} />}
      {activeTab === 'growth' && <GrowthLog childId={childId} />}
      {activeTab === 'diapers' && <DiaperLog childId={childId} />}
    </div>
  );
}

/** Dashboard tab showing today's summary and quick action buttons */
function DashboardTab({ child, onNavigate }: { child: Child; onNavigate: (tab: TabId) => void }) {
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
child.config.diapers && (
          <SummaryCard label="Diapers" icon="🧷" description="Log changes" onClick={() => onNavigate('diapers')} />
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
