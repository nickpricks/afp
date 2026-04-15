import { test, expect } from '@playwright/test';

import { ensureBodyConfigured, addChild } from './helpers';

// All flow tests run in dev mode: localStorage adapter, all modules enabled, TheAdminNick role.

test.describe('Flow: Budget full expense', () => {
  test('fill form → submit → verify in list → reload → verify persists', async ({ page }) => {
    // Navigate to add expense page
    await page.goto('/budget/add');
    await expect(page.getByPlaceholder('Amount')).toBeVisible({ timeout: 10000 });

    // Fill the form — category defaults to first option, payment method defaults to UPI
    await page.getByPlaceholder('Amount').fill('150');
    await page.getByPlaceholder('Note (optional)').fill('Groceries test');

    // Submit
    await page.getByRole('button', { name: 'Add Expense' }).click();

    // Immediate check: navigate to budget list and verify entry appears
    await page.goto('/budget');
    // Use the note text as primary assertion — unique to our entry, avoids ₹150 appearing in summary cards
    await expect(page.getByText('Groceries test')).toBeVisible({ timeout: 10000 });

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText('Groceries test')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Flow: Body configure → log floors → log walk', () => {
  test('configure → floors up ×3 → walking 500m → reload → verify all persists', async ({
    page,
  }) => {
    // Configure body module with defaults
    await ensureBodyConfigured(page);

    // Switch to Floors tab and tap up 3 times
    await page.locator('main button', { hasText: 'Floors' }).first().click();
    const upButton = page.locator('button.rounded-2xl').first();
    const summary = page.locator('p.text-sm.text-fg-muted');
    await upButton.click();
    await upButton.click();
    await upButton.click();
    await expect(summary).toContainText('3 up');

    // Switch to Walking tab and log a walk
    await page.locator('main button', { hasText: 'Walking' }).first().click();
    await page.getByPlaceholder('Distance').fill('500');
    await page.getByRole('button', { name: 'Log Walk' }).click();

    // Immediate check: walk entry visible
    await expect(page.getByText('500')).toBeVisible({ timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('main button', { hasText: 'Floors' }).first()).toBeVisible({
      timeout: 10000,
    });

    // Verify floors persisted
    await page.locator('main button', { hasText: 'Floors' }).first().click();
    await expect(page.locator('p.text-sm.text-fg-muted')).toContainText('3 up');

    // Verify walk persisted
    await page.locator('main button', { hasText: 'Walking' }).first().click();
    await expect(page.getByText('500')).toBeVisible();
  });
});

test.describe('Flow: Payment bubble toggle', () => {
  test('select → deselect → select another → verify styling', async ({ page }) => {
    await page.goto('/budget/add');
    await expect(page.getByText('Payment Method')).toBeVisible({ timeout: 10000 });

    // Expand to show all methods
    await page.getByText('More...').click();

    // Cash bubble — find by short label text
    const cashBubble = page.locator('button.rounded-full', { hasText: 'Cash' });
    const upiBubble = page.locator('button.rounded-full', { hasText: 'UPI' }).first();

    // UPI is pre-selected by default — verify active styling
    await expect(upiBubble).toHaveClass(/bg-accent/);

    // Click Cash — Cash becomes active, UPI deselects
    await cashBubble.click();
    await expect(cashBubble).toHaveClass(/bg-accent/);
    await expect(upiBubble).not.toHaveClass(/bg-accent/);

    // Click Cash again — deselects (no active method)
    await cashBubble.click();
    await expect(cashBubble).not.toHaveClass(/bg-accent/);

    // Click UPI again — reselects
    await upiBubble.click();
    await expect(upiBubble).toHaveClass(/bg-accent/);
  });
});

test.describe('Flow: Body gear reconfigure', () => {
  test('enable Running via gear → verify tab appears → reload → verify persists', async ({
    page,
  }) => {
    // Configure with defaults (Floors + Walking, Running OFF)
    await ensureBodyConfigured(page);

    // Verify Running tab is NOT visible
    const runningTab = page.locator('main button', { hasText: 'Running' }).first();
    await expect(runningTab).not.toBeVisible();

    // Click gear button to open config form
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Configure Body Tracking')).toBeVisible({ timeout: 5000 });

    // Enable Running checkbox — click the label text to toggle
    await page.getByLabel('Running').check();

    // Save configuration
    await page.getByRole('button', { name: 'Save Configuration' }).click();

    // Immediate check: Running tab now visible
    await expect(page.locator('main button', { hasText: 'Running' }).first()).toBeVisible({
      timeout: 5000,
    });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('main button', { hasText: 'Stats' }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('main button', { hasText: 'Running' }).first()).toBeVisible();
  });
});

test.describe('Flow: Baby add child → log feed → verify', () => {
  test('add child → feeding tab → log feed → reload → verify persists', async ({ page }) => {
    // Add a child via helper
    await addChild(page, 'Test Baby', '2025-06-01');

    // Should auto-navigate to child detail — wait for child name heading
    await expect(page.getByRole('heading', { name: 'Test Baby' })).toBeVisible({ timeout: 10000 });

    // Click Feeding tab — scope to tab bar to avoid matching the Dashboard summary card
    await page.locator('button.border-b-2', { hasText: 'Feeding' }).click();
    await expect(page.getByRole('button', { name: 'Log Feed' })).toBeVisible({ timeout: 5000 });

    // Bottle is default type. Fill amount and notes.
    await page.locator('input[type="number"]').fill('120');
    await page.getByPlaceholder('Notes').fill('Morning bottle');

    // Submit
    await page.getByRole('button', { name: 'Log Feed' }).click();

    // Immediate check: feed appears in Recent Feeds
    // Use amount + notes as assertions — "Bottle" is ambiguous (also in type selector buttons)
    await expect(page.getByText('120 ml/g')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Morning bottle')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    // After reload, we're back on the child detail page. Re-navigate to Feeding tab.
    await expect(page.getByRole('heading', { name: 'Test Baby' })).toBeVisible({ timeout: 10000 });
    await page.locator('button.border-b-2', { hasText: 'Feeding' }).click();
    await expect(page.getByText('120 ml/g')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Morning bottle')).toBeVisible();
  });
});
