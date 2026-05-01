/**
 * The Fine-Print regression tests: viewport-aware particle size scaling.
 *
 * Run with: bun run test:e2e -- --project=chromium e2e/the-fine-print.spec.ts
 */
import { test, expect } from '@playwright/test';

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
      .getByRole('button', { name: 'Standard', exact: true })
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

    // Now shrink to mobile viewport — triggers matchMedia change → 0.65x multiplier
    await page.setViewportSize({ width: 375, height: 667 });

    // The useMemo in AmbientEffects will re-run when viewportMultiplier updates.
    // We need to wait for the particles to reflect the new multiplier.
    await page.waitForTimeout(300);

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
      .getByRole('button', { name: 'Maximum', exact: true })
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
    for (const label of ['Small', 'Medium', 'Large']) {
      await expect(picker.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
  });

  test('Medium is active by default (aria-pressed=true)', async ({ page }) => {
    const mediumBtn = page
      .getByTestId('size-tier-picker')
      .getByRole('button', { name: 'Medium', exact: true });
    await expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
