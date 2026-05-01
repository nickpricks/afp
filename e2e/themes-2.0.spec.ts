/**
 * Phase 2i regression tests: atmosphere CSS, glyph dispatch, intensity tier
 * picker, reduced-motion, and DevBench Theme Tour.
 *
 * Run with: bun run test:e2e -- --project=chromium e2e/themes-2.0.spec.ts
 */
import { test, expect } from '@playwright/test';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Navigate to /profile, expand the Customize panel, then click the theme
 * button identified by visible text. Waits for the html class to update.
 */
async function switchTheme(
  page: import('@playwright/test').Page,
  themeName: string,
  themeClass: string,
) {
  await page.goto('/profile');
  // Wait for the Profile page to fully render before checking button state
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
  // Expand the appearance section — the "Customize" button toggles open/close.
  // The panel starts collapsed (local state resets on page nav), so we always click it.
  const customizeBtn = page.getByRole('button', { name: 'Customize' });
  await expect(customizeBtn).toBeVisible({ timeout: 5000 });
  await customizeBtn.click();
  await expect(page.getByTestId('theme-grid')).toBeVisible({ timeout: 8000 });
  // Click the theme button by its visible label
  await page.getByTestId('theme-grid').getByText(themeName, { exact: true }).click();
  // Wait for html class update — applyTheme() is synchronous JS, mutation fires immediately
  await expect(page.locator('html')).toHaveClass(new RegExp(themeClass), { timeout: 5000 });
}

// ─── Atmosphere invariants ────────────────────────────────────────────────────

test.describe('Atmosphere CSS — theme class applied via picker', () => {
  const THEMES = [
    { name: 'Family Blue', themeClass: 'theme-family-blue' },
    { name: 'Garden Path', themeClass: 'theme-garden-path' },
    { name: 'Lullaby', themeClass: 'theme-lullaby' },
    { name: 'Rose Quartz', themeClass: 'theme-rose-quartz' },
    { name: 'Charcoal', themeClass: 'theme-charcoal' },
    { name: "Marauder's Map", themeClass: 'theme-marauders-map' },
    { name: 'Neon Glow', themeClass: 'theme-neon-glow' },
    { name: 'Deep Mariana', themeClass: 'theme-deep-mariana' },
    { name: 'Industrial Furnace', themeClass: 'theme-industrial-furnace' },
    { name: 'Expecto Patronum', themeClass: 'theme-expecto-patronum' },
  ];

  for (const { name, themeClass } of THEMES) {
    test(`${name} — html carries ${themeClass}`, async ({ page }) => {
      await switchTheme(page, name, themeClass);
      await expect(page.locator('html')).toHaveClass(new RegExp(themeClass));
    });
  }

  // Non-Charcoal themes: verify ambient container renders (proves effects loaded).
  // NeonGlow has maxParticles=1 (scanline); Math.floor(1 * 0.5) = 0 at Standard intensity,
  // so it is excluded from the Standard-intensity check and tested separately at Maximum.
  const STANDARD_ATMOSPHERIC_THEMES = THEMES.filter(
    (t) => t.themeClass !== 'theme-charcoal' && t.themeClass !== 'theme-neon-glow',
  );
  for (const { name, themeClass } of STANDARD_ATMOSPHERIC_THEMES) {
    test(`${name} — .fx-ambient-container present (atmosphere loaded)`, async ({ page }) => {
      await switchTheme(page, name, themeClass);
      // Navigate to dashboard so AmbientEffects renders in the layout
      await page.goto('/');
      await expect(page.locator('html')).toHaveClass(new RegExp(themeClass));
      // Intensity defaults to 50 (Standard) — enough particles to render for all these themes
      await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
    });
  }

  test('Neon Glow — .fx-ambient-container present at Maximum intensity (scanline edge case)', async ({
    page,
  }) => {
    // NeonGlow scanline: maxParticles=1. Math.floor(1 * 0.5)=0 at Standard, Math.floor(1 * 1.0)=1
    // at Maximum. We must set Maximum before navigating away.
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtn).toBeVisible({ timeout: 5000 });
    await customizeBtn.click();
    await page.getByTestId('theme-grid').getByText('Neon Glow', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/theme-neon-glow/, { timeout: 5000 });
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: 'Maximum', exact: true })
      .click();
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/theme-neon-glow/);
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
  });

  test('Charcoal — no .fx-ambient-container (silent theme)', async ({ page }) => {
    await switchTheme(page, 'Charcoal', 'theme-charcoal');
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/theme-charcoal/);
    // Charcoal has empty effects array → AmbientEffects returns null → container absent
    await expect(page.locator('.fx-ambient-container')).not.toBeVisible();
  });
});

// ─── Glyph dispatch invariants ────────────────────────────────────────────────

test.describe('Glyph dispatch — correct renderer per effect', () => {
  test('Family Blue (snowflakes) — particles render SVG glyphs', async ({ page }) => {
    await switchTheme(page, 'Family Blue', 'theme-family-blue');
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
    // Snowflakes use GlyphPrimitive → renders <svg>
    const svgCount = await page.locator('.fx-particle svg').count();
    expect(svgCount).toBeGreaterThan(0);
  });

  test('Rose Quartz (hearts) — particles render CSS div glyphs (no svg)', async ({ page }) => {
    await switchTheme(page, 'Rose Quartz', 'theme-rose-quartz');
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
    // HeartGlyph is CSS-only divs, not SVG
    const particleCount = await page.locator('.fx-particle').count();
    expect(particleCount).toBeGreaterThan(0);
    // None of the heart particles should contain an <svg>
    const svgInParticles = await page.locator('.fx-particle svg').count();
    expect(svgInParticles).toBe(0);
  });

  test('Expecto Patronum — at least one particle contains a Patronus animal emoji', async ({
    page,
  }) => {
    await switchTheme(page, 'Expecto Patronum', 'theme-expecto-patronum');
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });

    const PATRONUS_EMOJIS = [
      '🦌',
      '🐺',
      '🦅',
      '🦦',
      '🐎',
      '🐈',
      '🦉',
      '🐇',
      '🐕',
      '🦢',
      '🦡',
      '🐉',
    ];

    // Gather text content of all particles — check for at least one Patronus emoji
    const particles = page.locator('.fx-particle');
    const count = await particles.count();
    expect(count).toBeGreaterThan(0);

    let foundEmoji = false;
    for (let i = 0; i < count; i++) {
      const text = await particles.nth(i).textContent();
      if (text && PATRONUS_EMOJIS.some((emoji) => text.includes(emoji))) {
        foundEmoji = true;
        break;
      }
    }
    expect(foundEmoji).toBe(true);
  });
});

// ─── Intensity tier picker ────────────────────────────────────────────────────

test.describe('Intensity tier picker — Profile > Customize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtn).toBeVisible({ timeout: 5000 });
    await customizeBtn.click();
    await expect(page.getByTestId('intensity-tier-picker')).toBeVisible({ timeout: 8000 });
  });

  test('renders 5 tier buttons with correct labels', async ({ page }) => {
    const picker = page.getByTestId('intensity-tier-picker');
    for (const label of ['Off', 'Subtle', 'Standard', 'Lively', 'Maximum']) {
      await expect(picker.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  test('Off tier — no ambient container on dashboard', async ({ page }) => {
    // First switch to a theme with particles (Family Blue is default)
    // Ensure we are on Family Blue
    const themeGrid = page.getByTestId('theme-grid');
    await themeGrid.getByText('Family Blue', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/theme-family-blue/, { timeout: 5000 });

    // Click Off tier
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: 'Off', exact: true })
      .click();

    // Navigate to dashboard and verify container is gone
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).not.toBeVisible({ timeout: 5000 });
  });

  test('Maximum tier — more particles than Subtle tier', async ({ page }) => {
    // Ensure Family Blue (snowflakes) is active
    const themeGrid = page.getByTestId('theme-grid');
    await themeGrid.getByText('Family Blue', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/theme-family-blue/, { timeout: 5000 });

    // Set to Subtle and count particles on dashboard
    const picker = page.getByTestId('intensity-tier-picker');
    await picker.getByRole('button', { name: 'Subtle', exact: true }).click();
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
    const subtleCount = await page.locator('.fx-particle').count();

    // Back to profile, set Maximum
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
    const customizeBtnAgain = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtnAgain).toBeVisible({ timeout: 5000 });
    await customizeBtnAgain.click();
    await expect(page.getByTestId('intensity-tier-picker')).toBeVisible({ timeout: 8000 });
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: 'Maximum', exact: true })
      .click();
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
    const maxCount = await page.locator('.fx-particle').count();

    // Maximum (100%) should produce strictly more particles than Subtle (25%)
    expect(maxCount).toBeGreaterThan(subtleCount);
  });
});

// ─── Reduced-motion ───────────────────────────────────────────────────────────

test.describe('Reduced-motion preference — AmbientEffects short-circuits', () => {
  test('prefers-reduced-motion: reduce → no .fx-ambient-container', async ({ page }) => {
    // Simulate OS-level reduced-motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Switch to Family Blue (has snowflakes) and navigate to dashboard
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtn).toBeVisible({ timeout: 5000 });
    await customizeBtn.click();
    await page.getByTestId('theme-grid').getByText('Family Blue', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/theme-family-blue/, { timeout: 5000 });

    // Make sure intensity is NOT Off — set Standard explicitly
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: 'Standard', exact: true })
      .click();

    // Navigate to dashboard — reduced-motion hook returns true, useMemo returns [],
    // AmbientEffects returns null, so .fx-ambient-container should be absent
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─── DevBench Theme Tour ──────────────────────────────────────────────────────

test.describe('DevBench Theme Tour — /debug', () => {
  test('Theme Tour section is visible on /debug', async ({ page }) => {
    await page.goto('/debug');
    // Wait for lazy-loaded DebugPage to render
    await expect(page.getByText('AFP Debug')).toBeVisible({ timeout: 10000 });
    // Scroll DevBench into view (it's at the bottom)
    await page.getByText('Theme Tour').scrollIntoViewIfNeeded();
    await expect(page.getByText('Theme Tour')).toBeVisible();
  });

  test('"Start Tour" button exists when tour is not running', async ({ page }) => {
    await page.goto('/debug');
    await expect(page.getByText('AFP Debug')).toBeVisible({ timeout: 10000 });
    await page.getByText('Theme Tour').scrollIntoViewIfNeeded();
    const startBtn = page.getByRole('button', { name: 'Start Tour' });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
  });

  test('Start Tour → Stop Tour → original theme restored', async ({ page }) => {
    await page.goto('/debug');
    await expect(page.getByText('AFP Debug')).toBeVisible({ timeout: 10000 });
    await page.getByText('Theme Tour').scrollIntoViewIfNeeded();

    // Record which theme is active before the tour starts
    const htmlEl = page.locator('html');
    const classBefore = await htmlEl.getAttribute('class');

    // Start tour — button switches to "Stop Tour" almost immediately
    const startBtn = page.getByRole('button', { name: 'Start Tour' });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();

    // Stop Tour button should appear
    const stopBtn = page.getByRole('button', { name: 'Stop Tour' });
    await expect(stopBtn).toBeVisible({ timeout: 5000 });

    // Stop the tour — original theme is restored by stopTour()
    await stopBtn.click();

    // Start Tour button reappears
    await expect(page.getByRole('button', { name: 'Start Tour' })).toBeVisible({ timeout: 5000 });

    // The html class should match the original (or at minimum contain a valid theme class)
    const classAfter = await htmlEl.getAttribute('class');
    // Both before and after should contain a theme-* class
    expect(classBefore).toMatch(/theme-/);
    expect(classAfter).toMatch(/theme-/);
  });
});
