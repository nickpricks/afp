/**
 * The Fine-Print regression tests: viewport-aware particle size scaling.
 *
 * Run with: bun run test:e2e -- --project=chromium e2e/the-fine-print.spec.ts
 */
import { test, expect } from '@playwright/test';
import { INTENSITY_TIERS } from '../src/shared/utils/intensity';
import { EFFECT_SIZE_TIERS } from '../src/shared/utils/effectSize';

// Tier labels derived from the source-of-truth constants — renaming a tier in
// `intensity.ts` / `effectSize.ts` propagates to these tests automatically.
// Theme name 'Family Blue' stays as a literal because importing `themes.ts`
// pulls in React (it defines hooks alongside theme data).
const INTENSITY_STANDARD = INTENSITY_TIERS[2].label; // value: 50
const INTENSITY_MAXIMUM = INTENSITY_TIERS[4].label; // value: 100
const SIZE_SMALL = EFFECT_SIZE_TIERS[0].label;
const SIZE_MEDIUM = EFFECT_SIZE_TIERS[1].label;
const SIZE_LARGE = EFFECT_SIZE_TIERS[2].label;

// ─── Viewport-aware particle size scaling ────────────────────────────────────

test.describe('Mobile viewport — particle size scaling (0.65x)', () => {
  test('particles have smaller --fx-size on mobile (375px) than desktop (1280px)', async ({
    page,
  }) => {
    // Ensure Family Blue theme (snowflakes) is active and intensity > 0.
    // First switch to desktop to set baseline.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });

    // Expand the Customize panel
    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtn).toBeVisible({ timeout: 5000 });
    await customizeBtn.click();
    await expect(page.getByTestId('theme-grid')).toBeVisible({ timeout: 8000 });

    // Switch to Family Blue (has snowflakes)
    await page.getByTestId('theme-grid').getByText('Family Blue', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/theme-family-blue/, { timeout: 5000 });

    // Set Standard intensity (default) — guaranteed particles
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: INTENSITY_STANDARD, exact: true })
      .click();

    // Navigate to dashboard at desktop width and sample --fx-size
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });

    const desktopSizes = await page.evaluate(() => {
      const particles = document.querySelectorAll('.fx-particle');
      return Array.from(particles).map((el) =>
        parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
      );
    });

    expect(desktopSizes.length).toBeGreaterThan(0);
    const desktopAvg = desktopSizes.reduce((a, b) => a + b, 0) / desktopSizes.length;

    // Now shrink to mobile viewport — triggers matchMedia change → 0.65x multiplier.
    // The useMemo in AmbientEffects re-runs when viewportMultiplier updates. Poll on the
    // resulting --fx-size average instead of waitForTimeout(300) — deterministic, flake-free.
    await page.setViewportSize({ width: 375, height: 667 });

    const sampleAvgSize = async (): Promise<number> => {
      return page.evaluate(() => {
        const particles = document.querySelectorAll('.fx-particle');
        if (particles.length === 0) return Infinity;
        const sizes = Array.from(particles).map((el) =>
          parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
        );
        return sizes.reduce((a, b) => a + b, 0) / sizes.length;
      });
    };

    await expect
      .poll(sampleAvgSize, { timeout: 5000, message: 'mobile multiplier propagation' })
      .toBeLessThan(desktopAvg * 0.85);

    const mobileSizes = await page.evaluate(() => {
      const particles = document.querySelectorAll('.fx-particle');
      return Array.from(particles).map((el) =>
        parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
      );
    });

    expect(mobileSizes.length).toBeGreaterThan(0);
    const mobileAvg = mobileSizes.reduce((a, b) => a + b, 0) / mobileSizes.length;

    // Mobile average should be noticeably smaller than desktop (0.65x → ~35% reduction)
    expect(mobileAvg).toBeLessThan(desktopAvg * 0.85);

    // Mobile particles should all be below 17px (desktop max 26px × 0.65 ≈ 16.9px)
    mobileSizes.forEach((s) => {
      expect(s).toBeLessThan(18);
    });
  });

  test('particles render at full size on desktop viewport (>= 640px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });

    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtn).toBeVisible({ timeout: 5000 });
    await customizeBtn.click();
    await expect(page.getByTestId('theme-grid')).toBeVisible({ timeout: 8000 });
    await page.getByTestId('theme-grid').getByText('Family Blue', { exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/theme-family-blue/, { timeout: 5000 });

    // Set Maximum intensity for a wider range of sizes
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: INTENSITY_MAXIMUM, exact: true })
      .click();

    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });

    const sizes = await page.evaluate(() => {
      const particles = document.querySelectorAll('.fx-particle');
      return Array.from(particles).map((el) =>
        parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
      );
    });

    expect(sizes.length).toBeGreaterThan(0);
    // At desktop, some deep particles should reach >= 17px (no mobile compression)
    expect(sizes.some((s) => s >= 17)).toBe(true);
  });
});

// ─── SizeTierPicker — Profile > Customize ────────────────────────────────────

test.describe('SizeTierPicker — Profile > Customize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
    const customizeBtn = page.getByRole('button', { name: 'Customize' });
    await expect(customizeBtn).toBeVisible({ timeout: 5000 });
    await customizeBtn.click();
    await expect(page.getByTestId('size-tier-picker')).toBeVisible({ timeout: 8000 });
  });

  test('renders 3 tier buttons with correct labels', async ({ page }) => {
    const picker = page.getByTestId('size-tier-picker');
    for (const label of [SIZE_SMALL, SIZE_MEDIUM, SIZE_LARGE]) {
      await expect(picker.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  test('Medium is active by default (aria-pressed=true)', async ({ page }) => {
    const mediumBtn = page
      .getByTestId('size-tier-picker')
      .getByRole('button', { name: SIZE_MEDIUM, exact: true });
    await expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

// ─── Picker → effect end-to-end ──────────────────────────────────────────────
// Locks the contract that clicking a tier actually changes particle --fx-size.
// Sharma-ji testing-gap #3: the viewport-scaling test covers screen-size → size, but the
// picker → size pipeline (saveAppearance → auth context → Layout → AmbientEffects) was uncovered.

test.describe('SizeTierPicker → AmbientEffects pipeline', () => {
  /** Captures particle --fx-size values at the dashboard route. */
  const captureFxSizes = async (page: import('@playwright/test').Page): Promise<number[]> => {
    return page.evaluate(() => {
      const particles = document.querySelectorAll('.fx-particle');
      return Array.from(particles).map((el) =>
        parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
      );
    });
  };

  test('clicking Large produces larger --fx-size than Medium baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Customize' }).click();
    await expect(page.getByTestId('theme-grid')).toBeVisible({ timeout: 8000 });

    // Set up a theme with non-empty particles + standard intensity.
    await page.getByTestId('theme-grid').getByText('Family Blue', { exact: true }).click();
    await page
      .getByTestId('intensity-tier-picker')
      .getByRole('button', { name: INTENSITY_STANDARD, exact: true })
      .click();

    // Baseline: Medium tier (default). Capture average --fx-size on dashboard.
    await page
      .getByTestId('size-tier-picker')
      .getByRole('button', { name: SIZE_MEDIUM, exact: true })
      .click();
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });
    const mediumSizes = await captureFxSizes(page);
    expect(mediumSizes.length).toBeGreaterThan(0);
    const mediumAvg = mediumSizes.reduce((a, b) => a + b, 0) / mediumSizes.length;

    // Switch to Large and re-capture.
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Customize' }).click();
    await expect(page.getByTestId('size-tier-picker')).toBeVisible({ timeout: 8000 });
    await page
      .getByTestId('size-tier-picker')
      .getByRole('button', { name: SIZE_LARGE, exact: true })
      .click();
    await page.goto('/');
    await expect(page.locator('.fx-ambient-container')).toBeVisible({ timeout: 5000 });

    await expect
      .poll(
        async () => {
          const sizes = await captureFxSizes(page);
          if (sizes.length === 0) return 0;
          return sizes.reduce((a, b) => a + b, 0) / sizes.length;
        },
        { timeout: 5000, message: 'Large tier propagation' },
      )
      .toBeGreaterThan(mediumAvg);
  });
});
