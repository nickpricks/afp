import { expect, type Page } from '@playwright/test';

/**
 * Saves body config with default selections (Floors + Walking + Running).
 * Must be called before testing body tabs — the config form gates them.
 */
export async function ensureBodyConfigured(page: Page) {
  await page.goto('/body');
  // Wait for lazy-loaded route to render — either config form or tabbed interface
  const configOrTabs = page.getByText(/Configure Body Tracking|Stats/);
  await expect(configOrTabs.first()).toBeVisible({ timeout: 10000 });
  // If config form is showing, save it (fresh localStorage = always first visit)
  const saveBtn = page.getByRole('button', { name: 'Save Configuration' });
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();
  }
}

/**
 * Adds a child via the baby onboarding form and waits for the success toast.
 * Returns the child name for downstream assertions.
 */
export async function addChild(page: Page, name: string, dob: string) {
  await page.goto('/baby');
  await expect(page.getByPlaceholder("Baby's name")).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder("Baby's name").fill(name);
  await page.locator('input[type="date"]').fill(dob);
  await page.getByRole('button', { name: 'Add Child' }).click();
  await expect(page.getByText('Child added')).toBeVisible({ timeout: 10000 });
}
