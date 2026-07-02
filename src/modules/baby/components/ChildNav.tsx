import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { SectionGroup } from '@/modules/baby/sections';
import type { ChildSection, SectionId } from '@/modules/baby/sections';

/** Display order + headers for the nav groups */
const GROUPS: { group: SectionGroup; header: string }[] = [
  { group: SectionGroup.Overview, header: 'Overview' },
  { group: SectionGroup.Logs, header: 'Logs' },
  { group: SectionGroup.Archived, header: 'Archived' },
];

/**
 * Grouped child navigation (Family Umbrella Pillar 3): slide-in drawer behind a
 * hamburger on mobile, persistent left sidebar ≥ md. Archived group is collapsed
 * by default and renders only when it has sections. CSS-only transform — no gesture lib.
 */
export function ChildNav({
  sections,
  activeId,
  onSelect,
}: {
  sections: ChildSection[];
  activeId: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  /** Selects a section and closes the mobile drawer */
  const handleSelect = (id: SectionId) => {
    onSelect(id);
    setOpen(false);
  };

  /** One nav group's header + items; Archived collapses */
  const renderGroup = (group: SectionGroup, header: string) => {
    const items = sections.filter((s) => s.group === group);
    if (items.length === 0) return null;
    const isArchived = group === SectionGroup.Archived;
    const collapsed = isArchived && !archivedExpanded;
    return (
      <div key={group} className="flex flex-col gap-0.5">
        {!isArchived && (
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
            {header}
          </p>
        )}
        {isArchived && (
          <button
            type="button"
            onClick={() => setArchivedExpanded((v) => !v)}
            className="flex items-center justify-between px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-fg-muted hover:text-fg"
            aria-expanded={archivedExpanded}
          >
            {header}
            <span className="font-mono">{archivedExpanded ? '−' : '+'}</span>
          </button>
        )}
        {!collapsed &&
          items.map((s) => (
            <button
              key={`${group}-${s.id}`}
              type="button"
              onClick={() => handleSelect(s.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeId === s.id
                  ? 'bg-accent-muted text-accent border-l-2 border-l-accent'
                  : 'text-fg-muted hover:bg-accent-muted hover:text-fg'
              } ${isArchived ? 'italic opacity-80' : ''}`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
      </div>
    );
  };

  const nav = (
    <nav className="flex flex-col pb-3" aria-label="Child sections">
      {GROUPS.map(({ group, header }) => renderGroup(group, header))}
    </nav>
  );

  return (
    <>
      {/* Mobile: hamburger + slide-in drawer */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex items-center gap-2 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg"
        >
          <Menu size={16} />
          {sections.find((s) => s.id === activeId)?.label ?? 'Sections'}
        </button>
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            role="button"
            tabIndex={0}
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setOpen(false);
            }}
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-surface border-r border-line transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-3">
            <p className="text-sm font-semibold text-fg">Sections</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="text-fg-muted hover:text-fg"
            >
              <X size={18} />
            </button>
          </div>
          {nav}
        </div>
      </div>

      {/* ≥ md: persistent sidebar */}
      <aside className="hidden w-48 shrink-0 rounded-lg border border-line bg-surface-card md:block">
        {nav}
      </aside>
    </>
  );
}
