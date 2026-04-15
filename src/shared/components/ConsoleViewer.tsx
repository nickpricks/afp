import { useEffect, useRef, useState } from 'react';

export interface ConsoleEntry {
  id: number;
  level: string;
  args: string;
  timestamp: string;
}

const LEVEL_COLORS: Record<string, string> = {
  log: 'text-gray-600 dark:text-gray-400',
  info: 'text-blue-600 dark:text-blue-400',
  warn: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  debug: 'text-purple-600 dark:text-purple-400',
  trace: 'text-purple-500 dark:text-purple-300',
  dir: 'text-cyan-600 dark:text-cyan-400',
  dirxml: 'text-cyan-600 dark:text-cyan-400',
  table: 'text-cyan-600 dark:text-cyan-400',
  group: 'text-gray-500 dark:text-gray-400',
  groupCollapsed: 'text-gray-500 dark:text-gray-400',
  groupEnd: 'text-gray-500 dark:text-gray-400',
  count: 'text-indigo-600 dark:text-indigo-400',
  countReset: 'text-indigo-600 dark:text-indigo-400',
  time: 'text-emerald-600 dark:text-emerald-400',
  timeLog: 'text-emerald-600 dark:text-emerald-400',
  timeEnd: 'text-emerald-600 dark:text-emerald-400',
  assert: 'text-red-700 dark:text-red-300',
  clear: 'text-gray-400 dark:text-gray-500',
};

const STORAGE_KEY = 'afp-console-visible';

/** Renders console entries as a scrollable list */
function ConsoleEntryList({ entries, clear }: { entries: ConsoleEntry[]; clear: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500">Live console output</span>
        <button type="button" onClick={clear} className="text-xs text-gray-400 hover:text-gray-600">
          Clear
        </button>
      </div>
      <div className="overflow-auto max-h-48 p-2 font-mono text-xs">
        {entries.length === 0 && <p className="text-gray-400 italic">No console output yet</p>}
        {entries.map((e) => (
          <div key={e.id} className={`py-0.5 ${LEVEL_COLORS[e.level] ?? LEVEL_COLORS.log}`}>
            <span className="text-gray-400 mr-2">{e.timestamp}</span>
            <span className="font-semibold mr-1.5">[{e.level.toUpperCase()}]</span>
            <span className="break-all whitespace-pre-wrap">{e.args}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/** Floating console panel — fixed to bottom, above tab bar. Toggle persists in localStorage. */
export function ConsoleOverlay({ entries, clear }: { entries: ConsoleEntry[]; clear: () => void }) {
  const [visible, setVisible] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const errorCount = entries.filter((e) => e.level === 'error').length;

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <>
      {/* Toggle pill — fixed bottom-right, above tab bar */}
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-16 right-3 z-50 flex items-center gap-1.5 rounded-full bg-gray-800 dark:bg-gray-700 px-2.5 py-1 text-[10px] font-mono text-gray-300 shadow-lg transition-all active:scale-95"
      >
        <span className="opacity-60">{'>'}_</span>
        <span>{entries.length}</span>
        {errorCount > 0 && <span className="text-red-400">{errorCount}err</span>}
      </button>

      {/* Panel */}
      {visible && (
        <div className="fixed bottom-24 left-2 right-2 z-50 shadow-xl rounded-lg overflow-hidden">
          <ConsoleEntryList entries={entries} clear={clear} />
        </div>
      )}
    </>
  );
}
