import { describe, it, expect } from 'vitest';
import { ThemeId, THEME_DEFINITIONS, themeClass, isValidThemeId, resolveThemeId } from '../themes';

describe('ThemeId enum', () => {
  it('has exactly 10 themes', () => {
    expect(Object.keys(ThemeId)).toHaveLength(10);
  });

  it('all enum values match definition keys', () => {
    for (const id of Object.values(ThemeId)) {
      expect(THEME_DEFINITIONS[id]).toBeDefined();
      expect(THEME_DEFINITIONS[id].id).toBe(id);
    }
  });
});

describe('THEME_DEFINITIONS', () => {
  it('has exactly 10 entries', () => {
    expect(Object.keys(THEME_DEFINITIONS)).toHaveLength(10);
  });

  it('every theme has required fields', () => {
    for (const theme of Object.values(THEME_DEFINITIONS)) {
      expect(theme.name).toBeTruthy();
      expect(theme.family).toBeTruthy();
      expect(typeof theme.darkOnly).toBe('boolean');
      expect(theme.fonts.display).toBeTruthy();
      expect(theme.fonts.body).toBeTruthy();
      expect(Array.isArray(theme.effects)).toBe(true);
      expect(typeof theme.defaultParticleCount).toBe('number');
      expect(theme.previewColors.bg).toMatch(/^#/);
      expect(theme.previewColors.accent).toMatch(/^#/);
      expect(theme.previewColors.text).toMatch(/^#/);
    }
  });

  it('Charcoal has no effects', () => {
    expect(THEME_DEFINITIONS[ThemeId.Charcoal].effects).toEqual([]);
  });

  it('Deep Mariana has crt + bubbles', () => {
    expect(THEME_DEFINITIONS[ThemeId.DeepMariana].effects).toEqual(['crt', 'bubbles']);
  });

  it('6 themes are light+dark, 4 are dark-only', () => {
    const darkOnly = Object.values(THEME_DEFINITIONS).filter((t) => t.darkOnly);
    const lightDark = Object.values(THEME_DEFINITIONS).filter((t) => !t.darkOnly);
    expect(darkOnly).toHaveLength(4);
    expect(lightDark).toHaveLength(6);
  });
});

describe('themeClass', () => {
  it('derives CSS class from theme ID', () => {
    expect(themeClass(ThemeId.FamilyBlue)).toBe('theme-family-blue');
    expect(themeClass(ThemeId.NeonGlow)).toBe('theme-neon-glow');
    expect(themeClass(ThemeId.MaraudersMap)).toBe('theme-marauders-map');
    expect(themeClass(ThemeId.ExpectoPatronum)).toBe('theme-expecto-patronum');
  });
});

describe('isValidThemeId', () => {
  it('accepts all 10 current theme IDs', () => {
    for (const id of Object.values(ThemeId)) {
      expect(isValidThemeId(id)).toBe(true);
    }
  });

  it('rejects dropped theme IDs', () => {
    expect(isValidThemeId('summit-instrument')).toBe(false);
    expect(isValidThemeId('corporate-glass')).toBe(false);
    expect(isValidThemeId('night-city-elevator')).toBe(false);
  });

  it('rejects old renamed ID', () => {
    expect(isValidThemeId('night-city-apartment')).toBe(false);
  });
});

describe('resolveThemeId', () => {
  it('passes through valid IDs', () => {
    expect(resolveThemeId('family-blue')).toBe(ThemeId.FamilyBlue);
    expect(resolveThemeId('neon-glow')).toBe(ThemeId.NeonGlow);
  });

  it('migrates night-city-apartment to neon-glow', () => {
    expect(resolveThemeId('night-city-apartment')).toBe(ThemeId.NeonGlow);
  });

  it('migrates dropped themes to family-blue', () => {
    expect(resolveThemeId('summit-instrument')).toBe(ThemeId.FamilyBlue);
    expect(resolveThemeId('corporate-glass')).toBe(ThemeId.FamilyBlue);
    expect(resolveThemeId('night-city-elevator')).toBe(ThemeId.FamilyBlue);
  });

  it('falls back to default for unknown IDs', () => {
    expect(resolveThemeId('nonexistent')).toBe(ThemeId.FamilyBlue);
  });
});
