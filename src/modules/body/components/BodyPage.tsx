import { useState } from 'react';

import { BodyConfigForm } from '@/modules/body/components/BodyConfigForm';
import { BodyStats } from '@/modules/body/components/BodyStats';
import { FloorsTab } from '@/modules/body/components/FloorsTab';
import { WalkingTab } from '@/modules/body/components/WalkingTab';
import { RunningTab } from '@/modules/body/components/RunningTab';
import { useBodyConfig } from '@/modules/body/hooks/useBodyConfig';
import { useBodyData } from '@/modules/body/hooks/useBodyData';

type TabId = 'stats' | 'floors' | 'walking' | 'running';

type TabDef = { id: TabId; label: string };

/** Builds the list of available tabs based on user's body config */
function buildTabs(config: { floors: boolean; walking: boolean; running: boolean }): TabDef[] {
  const tabs: TabDef[] = [{ id: 'stats', label: 'Stats' }];
  if (config.floors) {
    tabs.push({ id: 'floors', label: 'Floors' });
  }
  if (config.walking) {
    tabs.push({ id: 'walking', label: 'Walking' });
  }
  if (config.running) {
    tabs.push({ id: 'running', label: 'Running' });
  }
  return tabs;
}

/** Main body module page — config gate + tabbed interface */
export function BodyPage() {
  const { config, isConfigured, loading, saveConfig } = useBodyConfig();
  const { records, todayRecord, activities, tap, logActivity, saveRecord, updateActivity } = useBodyData();
  const [activeTab, setActiveTab] = useState<TabId>('stats');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-fg-muted">Loading...</p>
      </div>
    );
  }

  if (!isConfigured) {
    return <BodyConfigForm onSave={saveConfig} />;
  }

  const tabs = buildTabs(config);

  // If active tab was removed from config, reset to stats
  const validTab = tabs.some((t) => t.id === activeTab) ? activeTab : 'stats';

  const handleNavigate = (tab: string) => {
    const target = tab as TabId;
    if (tabs.some((t) => t.id === target)) {
      setActiveTab(target);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-surface-card border border-line p-1">
        {
          tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  validTab === tab.id
                    ? 'bg-accent text-fg-on-accent'
                    : 'text-fg-muted hover:text-fg'
                }`
              }
            >
              {tab.label}
            </button>
          ))
        }
      </div>

      {/* Tab content */}
      {
        validTab === 'stats' && (
          <BodyStats
            todayRecord={todayRecord}
            records={records}
            config={config}
            onNavigate={handleNavigate}
          />
        )
      }
      {
        validTab === 'floors' && (
          <FloorsTab
            todayRecord={todayRecord}
            records={records}
            floorHeight={config.floorHeight}
            onTap={tap}
            onSaveRecord={saveRecord}
          />
        )
      }
      {
        validTab === 'walking' && (
          <WalkingTab
            activities={activities}
            onLog={logActivity}
            onSave={updateActivity}
          />
        )
      }
      {
        validTab === 'running' && (
          <RunningTab
            activities={activities}
            onLog={logActivity}
            onSave={updateActivity}
          />
        )
      }
    </div>
  );
}
