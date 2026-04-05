import { test, expect } from '@playwright/test';

// Dev mode: Firebase not configured, all modules enabled, TheAdminNick role, localStorage adapter

test.describe('App shell', () => {
  test('loads and redirects to /body', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/body/);
  });

  test('shows header with AFP title and sync status', async ({ page }) => {
    await page.goto('/body');
    await expect(page.locator('header')).toContainText('AFP');
    // Dev mode with localStorage adapter shows "Synced" (not Offline)
    await expect(page.locator('header')).toContainText('Synced');
  });

  test('tab bar shows all modules + admin', async ({ page }) => {
    await page.goto('/body');
    const nav = page.locator('nav');
    await expect(nav).toContainText('Body');
    await expect(nav).toContainText('Expenses');
    await expect(nav).toContainText('Baby');
    await expect(nav).toContainText('Admin');
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/body');
    await page.locator('nav button', { hasText: 'Expenses' }).click();
    await expect(page).toHaveURL(/.*\/expenses/);
    await page.locator('nav button', { hasText: 'Baby' }).click();
    await expect(page).toHaveURL(/.*\/baby/);
    await page.locator('nav button', { hasText: 'Admin' }).click();
    await expect(page).toHaveURL(/.*\/admin/);
    await page.locator('nav button', { hasText: 'Body' }).click();
    await expect(page).toHaveURL(/.*\/body/);
  });
});

test.describe('Body Tracker', () => {
  test('renders score and buttons', async ({ page }) => {
    await page.goto('/body');
    await expect(page.locator('text=0 up')).toBeVisible();
    await expect(page.locator('text=0 down')).toBeVisible();
  });

  test('tap up increments floor count', async ({ page }) => {
    await page.goto('/body');
    // Up button is first button with ArrowUp icon
    const upButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await upButton.click();
    await expect(page.locator('text=1 up')).toBeVisible();
    await upButton.click();
    await expect(page.locator('text=2 up')).toBeVisible();
  });

  test('tap down increments down count', async ({ page }) => {
    await page.goto('/body');
    const downButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await downButton.click();
    await expect(page.locator('text=1 down')).toBeVisible();
  });

  test('score persists across navigation', async ({ page }) => {
    await page.goto('/body');
    const upButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await upButton.click();
    await expect(page.locator('text=1 up')).toBeVisible();

    // Navigate away and back
    await page.locator('nav button', { hasText: 'Expenses' }).click();
    await page.locator('nav button', { hasText: 'Body' }).click();
    await expect(page.locator('text=1 up')).toBeVisible();
  });
});

test.describe('Expenses', () => {
  test('shows empty state', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.locator('text=No expenses yet')).toBeVisible();
  });

  test('add expense page renders form', async ({ page }) => {
    await page.goto('/expenses/add');
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Add Expense');
  });

  test('add expense with valid data shows success toast', async ({ page }) => {
    await page.goto('/expenses/add');
    await page.locator('input[type="number"]').fill('150');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Expense added')).toBeVisible();
  });

  test('submit button disabled with empty amount', async ({ page }) => {
    await page.goto('/expenses/add');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });
});

test.describe('Baby — Feed Log', () => {
  test('renders feed type buttons', async ({ page }) => {
    await page.goto('/baby');
    await expect(page.locator('button', { hasText: 'Bottle' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Breast (Left)' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Solid Food' })).toBeVisible();
  });

  test('prefills date and time', async ({ page }) => {
    await page.goto('/baby');
    const dateInput = page.locator('input[type="date"]');
    const timeInput = page.locator('input[type="time"]');
    await expect(dateInput).not.toHaveValue('');
    await expect(timeInput).not.toHaveValue('');
  });

  test('log feed saves and shows in recent list', async ({ page }) => {
    await page.goto('/baby');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Feed logged')).toBeVisible();
    await expect(page.locator('text=Recent Feeds')).toBeVisible();
  });

  test('shows quantity field for Bottle', async ({ page }) => {
    await page.goto('/baby');
    await page.locator('button', { hasText: 'Bottle' }).click();
    await expect(page.locator('text=Quantity (ml/g)')).toBeVisible();
  });

  test('shows duration field for Breast types', async ({ page }) => {
    await page.goto('/baby');
    await page.locator('button', { hasText: 'Breast (Left)' }).click();
    await expect(page.locator('text=Duration (minutes)')).toBeVisible();
  });
});

test.describe('Baby — Sleep Log', () => {
  test('renders sleep type and quality buttons', async ({ page }) => {
    await page.goto('/baby/sleep');
    await expect(page.locator('button', { hasText: 'Nap' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Night' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Good' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Fair' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Poor' })).toBeVisible();
  });

  test('renders start/end time inputs', async ({ page }) => {
    await page.goto('/baby/sleep');
    await expect(page.locator('text=Start Time')).toBeVisible();
    await expect(page.locator('text=End Time')).toBeVisible();
  });

  test('log sleep saves entry', async ({ page }) => {
    await page.goto('/baby/sleep');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Sleep logged')).toBeVisible();
  });
});

test.describe('Baby — Growth Log', () => {
  test('renders weight/height/head fields', async ({ page }) => {
    await page.goto('/baby/growth');
    await expect(page.locator('text=Weight (kg)')).toBeVisible();
    await expect(page.locator('text=Height (cm)')).toBeVisible();
    await expect(page.locator('text=Head Circumference (cm)')).toBeVisible();
  });

  test('log growth saves entry', async ({ page }) => {
    await page.goto('/baby/growth');
    await page.locator('input[type="number"]').first().fill('5.5');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Growth logged')).toBeVisible();
  });
});

test.describe('Baby — Diaper Log', () => {
  test('renders quick-log buttons', async ({ page }) => {
    await page.goto('/baby/diaper');
    await expect(page.locator('button', { hasText: 'Quick Wet' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Quick Dirty' })).toBeVisible();
  });

  test('renders type selection buttons', async ({ page }) => {
    await page.goto('/baby/diaper');
    await expect(page.locator('button', { hasText: /^Wet$/ })).toBeVisible();
    await expect(page.locator('button', { hasText: /^Dirty$/ })).toBeVisible();
    await expect(page.locator('button', { hasText: /^Mixed$/ })).toBeVisible();
  });

  test('quick wet logs immediately', async ({ page }) => {
    await page.goto('/baby/diaper');
    await page.locator('button', { hasText: 'Quick Wet' }).click();
    await expect(page.locator('text=Diaper logged')).toBeVisible();
    await expect(page.locator('text=Recent Diapers')).toBeVisible();
  });

  test('quick dirty logs immediately', async ({ page }) => {
    await page.goto('/baby/diaper');
    await page.locator('button', { hasText: 'Quick Dirty' }).click();
    await expect(page.locator('text=Diaper logged')).toBeVisible();
  });
});

test.describe('Admin', () => {
  test('renders invite generator', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Create Invite' })).toBeVisible();
    await expect(page.locator('#invite-name')).toBeVisible();
  });

  test('module checkboxes render', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByLabel('body')).toBeVisible();
    await expect(page.getByLabel('expenses')).toBeVisible();
    await expect(page.getByLabel('baby')).toBeVisible();
  });

  test('create button disabled without name', async ({ page }) => {
    await page.goto('/admin');
    const createBtn = page.locator('button', { hasText: 'Create Invite' });
    await expect(createBtn).toBeDisabled();
  });

  test('create invite with name shows link', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('#invite-name').fill('Test User');
    await page.locator('button', { hasText: 'Create Invite' }).click();
    await expect(page.locator('text=Invite created')).toBeVisible();
    await expect(page.locator('text=Invite Link')).toBeVisible();
  });
});

test.describe('Route guards', () => {
  test('direct URL to /body works (module enabled in dev)', async ({ page }) => {
    await page.goto('/body');
    // Body tracker renders — check for the score display
    await expect(page.locator('text=0 up')).toBeVisible();
  });

  test('direct URL to /baby/sleep works (module enabled in dev)', async ({ page }) => {
    await page.goto('/baby/sleep');
    await expect(page.locator('button', { hasText: 'Nap' })).toBeVisible();
  });

  test('direct URL to /admin works (TheAdminNick in dev)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Create Invite' })).toBeVisible();
  });
});

test.describe('Theme', () => {
  test('dark mode class applied on system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/body');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('Family Blue theme class applied', async ({ page }) => {
    await page.goto('/body');
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-family-blue/);
  });
});

test.describe('Body — Activities', () => {
  test('renders activity type buttons (Walk, Run)', async ({ page }) => {
    await page.goto('/body');
    await expect(page.locator('button', { hasText: 'Walk' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Run' })).toBeVisible();
  });

  test('renders distance input and unit toggle', async ({ page }) => {
    await page.goto('/body');
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'm' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'km' })).toBeVisible();
  });

  test('log walk button disabled with empty distance', async ({ page }) => {
    await page.goto('/body');
    await expect(page.locator('button', { hasText: 'Log Walk' })).toBeDisabled();
  });

  test('log a walk activity', async ({ page }) => {
    await page.goto('/body');
    await page.locator('input[type="number"]').fill('500');
    await page.locator('button', { hasText: 'Log Walk' }).click();
    await expect(page.locator('text=500m walked')).toBeVisible();
    await expect(page.locator("text=Today's Activities")).toBeVisible();
  });

  test('log a run activity', async ({ page }) => {
    await page.goto('/body');
    await page.locator('button', { hasText: 'Run' }).click();
    await page.locator('input[type="number"]').fill('2');
    await page.locator('button', { hasText: 'km' }).click();
    await page.locator('button', { hasText: 'Log Run' }).click();
    await expect(page.locator('text=2.0km run')).toBeVisible();
  });

  test('step count shows after logging activity', async ({ page }) => {
    await page.goto('/body');
    await page.locator('input[type="number"]').fill('750');
    await page.locator('button', { hasText: 'Log Walk' }).click();
    await expect(page.locator('text=~1,000 steps')).toBeVisible();
  });
});
