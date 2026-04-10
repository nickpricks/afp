import { useState, useEffect } from 'react';

import { CONFIG } from '@/constants/config';

export enum ThemeId {
  FamilyBlue = 'family-blue',
  NeonGlow = 'neon-glow',
  DeepMariana = 'deep-mariana',
  IndustrialFurnace = 'industrial-furnace',
}

export type ColorMode = 'light' | 'dark' | 'system';

/** Font pairing for a theme */
type FontPair = { display: string; body: string };

const FONTS_DEFAULT: FontPair = { display: 'Syne', body: 'system-ui' };
const FONTS_CYBERPUNK: FontPair = { display: 'Orbitron', body: 'JetBrains Mono' };
const FONTS_MONO: FontPair = { display: 'Syne', body: 'JetBrains Mono' };

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  family: string;
  darkOnly: boolean;
  fonts: FontPair;
  previewColors: { bg: string; accent: string; text: string };
};

/** Derives the CSS class name for a theme from its ID */
export const themeClass = (id: ThemeId): string => {
  return `theme-${id}`;
};

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  [ThemeId.FamilyBlue]: {
    id: ThemeId.FamilyBlue,
    name: 'Family Blue',
    family: 'Family',
    darkOnly: false,
    fonts: FONTS_DEFAULT,
    previewColors: { bg: '#f0f7ff', accent: '#60a5fa', text: '#1e293b' },
  },
  [ThemeId.NeonGlow]: {
    id: ThemeId.NeonGlow,
    name: 'Neon Glow',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: FONTS_CYBERPUNK,
    previewColors: { bg: '#0d0505', accent: '#ffb803', text: '#d0d0d0' },
  },
  [ThemeId.DeepMariana]: {
    id: ThemeId.DeepMariana,
    name: 'Deep Mariana',
    family: 'Deep',
    darkOnly: true,
    fonts: FONTS_MONO,
    previewColors: { bg: '#030b12', accent: '#00e89a', text: '#8cb4c8' },
  },
  [ThemeId.IndustrialFurnace]: {
    id: ThemeId.IndustrialFurnace,
    name: 'Industrial Furnace',
    family: 'Industrial',
    darkOnly: true,
    fonts: FONTS_MONO,
    previewColors: { bg: '#100804', accent: '#ff6820', text: '#c8a888' },
  },
};

/** Cached theme list — avoids recomputing Object.values on every call */
const THEME_LIST = Object.values(THEME_DEFINITIONS);

/** Checks whether a string is a valid ThemeId */
export function isValidThemeId(value: string): value is ThemeId {
  return value in THEME_DEFINITIONS;
}

/** Reads the currently active ThemeId from the DOM */
function detectActiveThemeId(): ThemeId {
  const root = document.documentElement;
  for (const theme of THEME_LIST) {
    if (root.classList.contains(themeClass(theme.id))) return theme.id;
  }
  return CONFIG.DEFAULT_THEME;
}

let currentThemeClass: string | undefined;

/** Applies a theme and color mode to the document root element */
export function applyTheme(themeId: ThemeId, colorMode: ColorMode): void {
  const theme = THEME_DEFINITIONS[themeId];
  const root = document.documentElement;
  const newClass = themeClass(themeId);

  if (currentThemeClass) root.classList.remove(currentThemeClass);
  root.classList.add(newClass);
  currentThemeClass = newClass;

  if (theme.darkOnly || colorMode === 'dark') {
    root.classList.add('dark');
  } else if (colorMode === 'light') {
    root.classList.remove('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  }
}

/** Returns the currently active ThemeId by observing <html> class changes */
export function useActiveThemeId(): ThemeId {
  const [themeId, setThemeId] = useState<ThemeId>(detectActiveThemeId);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const detected = detectActiveThemeId();
      setThemeId((prev) => (prev === detected ? prev : detected));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return themeId;
}
