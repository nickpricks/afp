import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useChildren } from '@/modules/baby/hooks/useChildren';
import { AddChild } from '@/modules/baby/components/AddChild';
import type { Child } from '@/modules/baby/types';
import { computeAge } from '@/modules/baby/utils';

/** Card displaying a single child's summary — tap anywhere to navigate */
function ChildCard({ child, onView }: { child: Child; onView: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onView(child.id ?? '')}
      className="w-full rounded-xl bg-surface-card border border-line p-4 flex items-center justify-between text-left transition-colors hover:border-accent active:scale-[0.98]"
    >
      <div>
        <h3 className="text-base font-semibold text-fg">{child.name}</h3>
        <p className="text-sm text-fg-muted">{computeAge(child.dob)} old</p>
        <div className="flex gap-2 mt-1 flex-wrap">
          {child.config.feeding && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Feeding</span>}
          {child.config.sleep && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Sleep</span>}
          {child.config.growth && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Growth</span>}
          {child.config.diapers && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Diapers</span>}
        </div>
      </div>
      <span className="text-accent text-sm font-medium">{'>'}</span>
    </button>
  );
}

/** Baby module landing page — lists all children or shows onboarding */
export function BabyLanding() {
  const navigate = useNavigate();
  const { children, loading } = useChildren();
  const [showAddForm, setShowAddForm] = useState(false);

  /** Navigates to the per-child detail view */
  const handleViewChild = (childId: string) => {
    navigate(`/baby/${childId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-fg-muted">
        Loading...
      </div>
    );
  }

  /** Navigate to the new child after creation */
  const handleChildAdded = (childId: string) => {
    setShowAddForm(false);
    navigate(`/baby/${childId}`);
  };

  // No children — show onboarding
  if (children.length === 0 && !showAddForm) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-fg mb-2">Welcome to Baby Tracking</h2>
          <p className="text-fg-muted mb-6">Add your first child to get started.</p>
        </div>
        <AddChild onAdded={handleChildAdded} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h2 className="text-lg font-semibold text-fg">Your Children</h2>

      {
        children.map((child) => (
          <ChildCard key={child.id} child={child} onView={handleViewChild} />
        ))
      }

      {
        showAddForm && (
          <AddChild onAdded={handleChildAdded} />
        )
      }

      {
        !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 rounded-lg border-2 border-dashed border-line text-fg-muted font-medium hover:border-accent hover:text-accent transition-colors"
          >
            + Add Child
          </button>
        )
      }
    </div>
  );
}
