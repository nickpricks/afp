import { useEffect, useRef, useState } from 'react';

import type { ConsoleEntry } from '@/shared/components/ConsoleViewer';

type ConsoleLevel =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'debug'
  | 'trace'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'count'
  | 'countReset'
  | 'time'
  | 'timeLog'
  | 'timeEnd'
  | 'assert'
  | 'clear';

const ALL_LEVELS: ConsoleLevel[] = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
  'trace',
  'dir',
  'dirxml',
  'table',
  'group',
  'groupCollapsed',
  'groupEnd',
  'count',
  'countReset',
  'time',
  'timeLog',
  'timeEnd',
  'assert',
  'clear',
];

/** Serializes unknown args into a readable string */
const serialize = (args: unknown[]): string =>
  args
    .map((a) => {
      try {
        return typeof a === 'string' ? a : JSON.stringify(a, null, 2);
      } catch {
        return String(a);
      }
    })
    .join(' ');

/** Patches all console methods and captures entries — call once at app level */
export function useConsoleCapture() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = console as any;
    const originals: Record<string, unknown> = {};

    for (const level of ALL_LEVELS) {
      originals[level] = c[level];
    }

    const capture =
      (level: ConsoleLevel) =>
      (...args: unknown[]) => {
        (originals[level] as (...a: unknown[]) => void)?.(...args);
        setEntries((prev) => [
          ...prev.slice(-199),
          {
            id: ++idRef.current,
            level,
            args: level === 'clear' ? '--- cleared ---' : serialize(args),
            timestamp: new Date().toISOString().slice(11, 23),
          },
        ]);
      };

    for (const level of ALL_LEVELS) {
      c[level] = capture(level);
    }

    return () => {
      for (const level of ALL_LEVELS) {
        if (originals[level]) c[level] = originals[level];
      }
    };
  }, []);

  const clear = () => setEntries([]);

  return { entries, clear };
}
