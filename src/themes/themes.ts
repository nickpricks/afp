import { useState, useEffect } from 'react';

export enum ThemeId {
  FamilyBlue = 'family-blue',
  GardenPath = 'garden-path',
  Lullaby = 'lullaby',
  RoseQuartz = 'rose-quartz',
  Charcoal = 'charcoal',
  MaraudersMap = 'marauders-map',
  NeonGlow = 'neon-glow',
  DeepMariana = 'deep-mariana',
  IndustrialFurnace = 'industrial-furnace',
  ExpectoPatronum = 'expecto-patronum',
}

export type ColorMode = 'light' | 'dark' | 'system';

/** Font pairing for a theme */
type FontPair = { display: string; body: string };

const FONTS_DEFAULT: FontPair = { display: 'Syne', body: 'system-ui' };
const FONTS_CYBERPUNK: FontPair = { display: 'Orbitron', body: 'JetBrains Mono' };
const FONTS_MONO: FontPair = { display: 'Syne', body: 'JetBrains Mono' };
const FONTS_NURSERY: FontPair = { display: 'Quicksand', body: 'Nunito' };
const FONTS_GARDEN: FontPair = { display: 'DM Serif Display', body: 'system-ui' };
const FONTS_ELEGANT: FontPair = { display: 'Playfair Display', body: 'system-ui' };
const FONTS_MAGIC: FontPair = { display: 'Cinzel', body: 'JetBrains Mono' };

export type ThemeEffect =
  | 'snowflakes'
  | 'leaves'
  | 'stars'
  | 'hearts'
  | 'ink'
  | 'scanline'
  | 'crt'
  | 'bubbles'
  | 'embers'
  | 'wisps';

const ALL_EFFECTS: ThemeEffect[] = [
  'snowflakes',
  'leaves',
  'stars',
  'hearts',
  'ink',
  'scanline',
  'crt',
  'bubbles',
  'embers',
  'wisps',
];

export type ThemeEffectType = 'fall' | 'rise' | 'twinkle' | 'float' | 'sweep' | 'overlay';

export type ThemeEffectConfig = {
  id: ThemeEffect;
  type: ThemeEffectType;
  content: string;
  maxParticles: number;
  baseSpeed: number;
};

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  family: string;
  darkOnly: boolean;
  fonts: FontPair;
  effects: ThemeEffectConfig[];
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
    effects: [{ id: 'snowflakes', type: 'fall', content: '❄', maxParticles: 30, baseSpeed: 8 }],
    previewColors: { bg: '#f0f7ff', accent: '#60a5fa', text: '#1e293b' },
  },
  [ThemeId.GardenPath]: {
    id: ThemeId.GardenPath,
    name: 'Garden Path',
    family: 'Nature',
    darkOnly: false,
    fonts: FONTS_GARDEN,
    effects: [{ id: 'leaves', type: 'fall', content: '🍃', maxParticles: 20, baseSpeed: 10 }],
    previewColors: { bg: '#f4f9f4', accent: '#16a34a', text: '#1a2e1a' },
  },
  [ThemeId.Lullaby]: {
    id: ThemeId.Lullaby,
    name: 'Lullaby',
    family: 'Nursery',
    darkOnly: false,
    fonts: FONTS_NURSERY,
    effects: [{ id: 'stars', type: 'twinkle', content: '✨', maxParticles: 40, baseSpeed: 4 }],
    previewColors: { bg: '#faf6ef', accent: '#e8a44a', text: '#3d3529' },
  },
  [ThemeId.RoseQuartz]: {
    id: ThemeId.RoseQuartz,
    name: 'Rose Quartz',
    family: 'Soft',
    darkOnly: false,
    fonts: FONTS_ELEGANT,
    effects: [{ id: 'hearts', type: 'rise', content: '❤️', maxParticles: 25, baseSpeed: 6 }],
    previewColors: { bg: '#fdf2f8', accent: '#f472b6', text: '#2e1a24' },
  },
  [ThemeId.Charcoal]: {
    id: ThemeId.Charcoal,
    name: 'Charcoal',
    family: 'Minimal',
    darkOnly: false,
    fonts: FONTS_MONO,
    effects: [],
    previewColors: { bg: '#fafafa', accent: '#71717a', text: '#18181b' },
  },
  [ThemeId.MaraudersMap]: {
    id: ThemeId.MaraudersMap,
    name: "Marauder's Map",
    family: 'Magic',
    darkOnly: false,
    fonts: FONTS_MAGIC,
    effects: [{ id: 'ink', type: 'float', content: '👣', maxParticles: 15, baseSpeed: 12 }],
    previewColors: { bg: '#f5f0e0', accent: '#c8a96e', text: '#3a2e1a' },
  },
  [ThemeId.NeonGlow]: {
    id: ThemeId.NeonGlow,
    name: 'Neon Glow',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: FONTS_CYBERPUNK,
    effects: [{ id: 'scanline', type: 'sweep', content: '', maxParticles: 1, baseSpeed: 4 }],
    previewColors: { bg: '#0d0505', accent: '#ffb803', text: '#d0d0d0' },
  },
  [ThemeId.DeepMariana]: {
    id: ThemeId.DeepMariana,
    name: 'Deep Mariana',
    family: 'Deep',
    darkOnly: true,
    fonts: FONTS_MONO,
    effects: [
      { id: 'crt', type: 'overlay', content: '', maxParticles: 1, baseSpeed: 0 },
      { id: 'bubbles', type: 'rise', content: '🫧', maxParticles: 30, baseSpeed: 7 },
    ],
    previewColors: { bg: '#030b12', accent: '#00e89a', text: '#8cb4c8' },
  },
  [ThemeId.IndustrialFurnace]: {
    id: ThemeId.IndustrialFurnace,
    name: 'Industrial Furnace',
    family: 'Industrial',
    darkOnly: true,
    fonts: FONTS_MONO,
    effects: [{ id: 'embers', type: 'rise', content: '🔥', maxParticles: 35, baseSpeed: 5 }],
    previewColors: { bg: '#100804', accent: '#ff6820', text: '#c8a888' },
  },
  [ThemeId.ExpectoPatronum]: {
    id: ThemeId.ExpectoPatronum,
    name: 'Expecto Patronum',
    family: 'Magic',
    darkOnly: true,
    fonts: FONTS_MAGIC,
    effects: [
      { id: 'wisps', type: 'rise', content: '🌫️', maxParticles: 3, baseSpeed: 18 },
      { id: 'patronus', type: 'rise', content: '🦌,🐺,🦅,🦦,🐎,🐈,🦉,🐇,🐕,🦢,🦡,🐉', maxParticles: 6, baseSpeed: 12 },
    ],
    previewColors: { bg: '#080a10', accent: '#b8d4e8', text: '#90a8b8' },
  },
};

/** Cached theme list — avoids recomputing Object.values on every call */
const THEME_LIST = Object.values(THEME_DEFINITIONS);

/** Checks whether a string is a valid ThemeId */
export function isValidThemeId(value: string): value is ThemeId {
  return value in THEME_DEFINITIONS;
}

/** Migration map for renamed/dropped themes */
const THEME_MIGRATIONS: Record<string, ThemeId> = {
  'night-city-apartment': ThemeId.NeonGlow,
  'summit-instrument': ThemeId.FamilyBlue,
  'corporate-glass': ThemeId.FamilyBlue,
  'night-city-elevator': ThemeId.FamilyBlue,
};

/** Resolves a stored theme ID, migrating old values to current ones */
export function resolveThemeId(value: string): ThemeId {
  if (isValidThemeId(value)) return value;
  return THEME_MIGRATIONS[value] ?? ThemeId.FamilyBlue;
}

/** Reads the currently active ThemeId from the DOM */
function detectActiveThemeId(): ThemeId {
  const root = document.documentElement;
  for (const theme of THEME_LIST) {
    if (root.classList.contains(themeClass(theme.id))) return theme.id;
  }
  return ThemeId.FamilyBlue;
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

  // Apply fonts
  root.style.setProperty('--font-display', `'${theme.fonts.display}', sans-serif`);
  root.style.setProperty('--font-body', `'${theme.fonts.body}', sans-serif`);
  root.style.fontFamily = `'${theme.fonts.body}', sans-serif`;

  // Apply effects
  for (const effect of ALL_EFFECTS) {
    root.classList.remove(`effect-${effect}`);
  }
  for (const config of theme.effects) {
    if (config.type === 'overlay') {
      root.classList.add(`effect-${config.id}`);
    }
  }

  // Apply color mode
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
