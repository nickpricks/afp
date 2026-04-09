import { test, expect, type Page } from '@playwright/test';

// Dev mode: Firebase not configured, all modules enabled, TheAdminNick role, localStorage adapter

/**
 * Saves body config with default selections (Floors + Walking + Running).
 * Must be called before testing body tabs — the config form gates them.
 */
async function ensureBodyConfigured(page: Page) {
  await page.goto('/body');
  // If config form is showing, save it
  const configHeading = page.getByText('Configure Body Tracking');
  if (await configHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Floors, Walking, Running checkboxes are on by default (DEFAULT_BODY_CONFIG)
    await page.getByRole('button', { name: 'Save Configuration' }).click();
    // Wait for tabbed view to appear
    await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();
  }
}

test.describe('App shell', () => {
  test('loads and shows dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  });

  test('shows header with logo and sync status', async ({ page }) => {
    await page.goto('/body');
    await expect(page.locator('header img[alt="AFP"]')).toBeVisible();
    await expect(page.locator('header')).toContainText('Synced');
  });

  test('tab bar shows Body, Budget, Baby, Admin', async ({ page }) => {
    await page.goto('/body');
    const nav = page.locator('nav');
    await expect(nav).toContainText('Body');
    await expect(nav).toContainText('Budget');
    await expect(nav).toContainText('Baby');
    await expect(nav).toContainText('Admin');
  });

  test('tab navigation works', async ({ page }) => {
    await page.goto('/body');
    await page.locator('nav button', { hasText: 'Budget' }).click();
    await expect(page).toHaveURL(/.*\/budget/);
    await page.locator('nav button', { hasText: 'Baby' }).click();
    await expect(page).toHaveURL(/.*\/baby/);
    await page.locator('nav button', { hasText: 'Admin' }).click();
    await expect(page).toHaveURL(/.*\/admin/);
    await page.locator('nav button', { hasText: 'Body' }).click();
    await expect(page).toHaveURL(/.*\/body/);
  });

  test('profile "D" button visible in header (dev mode anonymous)', async ({ page }) => {
    await page.goto('/body');
    const profileBtn = page.locator('header button', { hasText: 'D' });
    await expect(profileBtn).toBeVisible();
  });
});

test.describe('Body — Config gate', () => {
  test('shows config form on first visit', async ({ page }) => {
    await page.goto('/body');
    await expect(page.getByText('Configure Body Tracking')).toBeVisible();
    await expect(page.getByText('Floors')).toBeVisible();
    await expect(page.getByText('Walking')).toBeVisible();
    await expect(page.getByText('Running')).toBeVisible();
    await expect(page.getByLabel('Cycling')).toBeVisible();
    await expect(page.getByText('Yoga (coming soon)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Configuration' })).toBeVisible();
  });

  test('floor height radio buttons render', async ({ page }) => {
    await page.goto('/body');
    await expect(page.getByRole('button', { name: '2.5m' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3m' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3.5m' })).toBeVisible();
  });

  test('saving config shows tabbed interface', async ({ page }) => {
    await page.goto('/body');
    await page.getByRole('button', { name: 'Save Configuration' }).click();
    await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Floors', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Walking', exact: true })).toBeVisible();
    // Running is off by default in DEFAULT_BODY_CONFIG — only Stats, Floors, Walking tabs show
  });
});

test.describe('Body — Stats tab', () => {
  test.beforeEach(async ({ page }) => {
    await ensureBodyConfigured(page);
  });

  test('shows score and metric cards', async ({ page }) => {
    await expect(page.getByText("Today's Score")).toBeVisible();
    await expect(page.getByText('Floors Up')).toBeVisible();
    await expect(page.getByText('Floors Down')).toBeVisible();
    await expect(page.getByText('This Week')).toBeVisible();
  });

  test('shows quick action buttons matching config', async ({ page }) => {
    // Default config: floors=true, walking=true, running=false
    await expect(page.getByRole('button', { name: '+ Log Floors' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Walk' })).toBeVisible();
  });
});

test.describe('Body — Floors tab', () => {
  test.beforeEach(async ({ page }) => {
    await ensureBodyConfigured(page);
    await page.getByRole('button', { name: 'Floors', exact: true }).click();
  });

  test('has up and down arrow buttons', async ({ page }) => {
    // The tab shows tap buttons with ArrowUp and ArrowDown icons
    const buttons = page.locator('button.rounded-2xl');
    await expect(buttons).toHaveCount(2);
  });

  test('tapping up increments floor count', async ({ page }) => {
    // The summary line shows "X up (Ym) / Z down (Wm)" — target it specifically
    const summary = page.locator('p.text-sm.text-fg-muted');
    await expect(summary).toContainText('0 up');
    // First button is the up button
    const upButton = page.locator('button.rounded-2xl').first();
    await upButton.click();
    await expect(summary).toContainText('1 up');
    await upButton.click();
    await expect(summary).toContainText('2 up');
  });

  test('tapping down increments down count', async ({ page }) => {
    const summary = page.locator('p.text-sm.text-fg-muted');
    await expect(summary).toContainText('0 down');
    const downButton = page.locator('button.rounded-2xl').nth(1);
    await downButton.click();
    await expect(summary).toContainText('1 down');
  });
});

test.describe('Body — Walking tab', () => {
  test.beforeEach(async ({ page }) => {
    await ensureBodyConfigured(page);
    await page.getByRole('button', { name: 'Walking' }).click();
  });

  test('has distance input and unit toggle', async ({ page }) => {
    await expect(page.getByPlaceholder('Distance')).toBeVisible();
    await expect(page.getByRole('button', { name: 'm', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'km', exact: true })).toBeVisible();
  });

  test('Log Walk button disabled with empty distance', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Log Walk' })).toBeDisabled();
  });

  test('can log a walk activity', async ({ page }) => {
    await page.getByPlaceholder('Distance').fill('500');
    await page.getByRole('button', { name: 'Log Walk' }).click();
    // Activity should appear in the list
    await expect(page.getByText('500')).toBeVisible();
  });
});

test.describe('Budget', () => {
  test('/budget shows summary cards and expense/income toggle', async ({ page }) => {
    await page.goto('/budget');
    // Summary cards use <p> elements
    await expect(page.locator('p', { hasText: 'Income' }).first()).toBeVisible();
    await expect(page.getByText('Spent')).toBeVisible();
    await expect(page.getByText('Remaining')).toBeVisible();
    // Toggle buttons
    await expect(page.getByRole('button', { name: 'Expenses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible();
  });

  test('FAB link is visible on budget page', async ({ page }) => {
    await page.goto('/budget');
    const fab = page.getByLabel('Add entry');
    await expect(fab).toBeVisible();
  });

  test('/budget/add has expense/income toggle and expense form', async ({ page }) => {
    await page.goto('/budget/add');
    await expect(page.getByRole('button', { name: 'Expense', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Income', exact: true })).toBeVisible();
    // Expense form elements
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.getByPlaceholder('Amount')).toBeVisible();
    await expect(page.getByText('Payment Method')).toBeVisible();
  });

  test('payment method bubbles render on add page', async ({ page }) => {
    await page.goto('/budget/add');
    // Quick payment methods + More... button
    await expect(page.getByText('More...')).toBeVisible();
  });

  test('add expense button disabled with empty amount', async ({ page }) => {
    await page.goto('/budget/add');
    await expect(page.getByRole('button', { name: 'Add Expense' })).toBeDisabled();
  });
});

test.describe('Baby', () => {
  test('/baby shows onboarding form when no children', async ({ page }) => {
    await page.goto('/baby');
    // Wait for loading to finish — the hook starts in loading state
    await expect(page.getByText('Welcome to Baby Tracking')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Add Child' })).toBeVisible();
  });

  test('add child form has name, DOB, and module checkboxes', async ({ page }) => {
    await page.goto('/baby');
    await expect(page.getByPlaceholder("Baby's name")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.getByText('Feeding')).toBeVisible();
    await expect(page.getByText('Sleep')).toBeVisible();
    await expect(page.getByText('Growth')).toBeVisible();
    await expect(page.getByText('Diapers')).toBeVisible();
  });

  test('can submit add child form and get success toast', async ({ page }) => {
    await page.goto('/baby');
    // Wait for onboarding form to load
    await expect(page.getByPlaceholder("Baby's name")).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder("Baby's name").fill('Test Baby');
    await page.locator('input[type="date"]').fill('2025-01-15');
    await page.getByRole('button', { name: 'Add Child' }).click();
    // Toast confirms the child was added
    await expect(page.getByText('Child added')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin', () => {
  test('/admin renders tabbed admin panel', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Invites' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Users' })).toBeVisible();
  });

  test('Invites tab shows invite generator by default', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Create Invite' })).toBeVisible();
    await expect(page.locator('#invite-name')).toBeVisible();
  });

  test('/admin/invites renders invite generator', async ({ page }) => {
    await page.goto('/admin/invites');
    await expect(page.getByRole('heading', { name: 'Create Invite' })).toBeVisible();
    await expect(page.locator('#invite-name')).toBeVisible();
  });

  test('module checkboxes render (body, budget, baby)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByLabel('body')).toBeVisible();
    await expect(page.getByLabel('budget')).toBeVisible();
    await expect(page.getByLabel('baby')).toBeVisible();
  });

  test('create button disabled without name', async ({ page }) => {
    await page.goto('/admin');
    const createBtn = page.getByRole('button', { name: 'Create Invite' });
    await expect(createBtn).toBeDisabled();
  });

  test('create invite with name shows link', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('#invite-name').fill('Test User');
    await page.getByRole('button', { name: 'Create Invite' }).click();
    await expect(page.getByText('Invite created')).toBeVisible();
    await expect(page.getByText('Invite Link')).toBeVisible();
  });

  test('Users tab shows on admin page', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Users' }).click();
    // In dev mode there may be no users — check for empty state
    await expect(page.getByText(/No users|Loading/)).toBeVisible();
  });

  test('invite form shows role selector (User/Viewer)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: 'User', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Viewer', exact: true })).toBeVisible();
  });

  test('selecting Viewer role shows "View of" picker', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Viewer' }).click();
    await expect(page.getByText(/view of/i)).toBeVisible();
  });
});

test.describe('Profile', () => {
  test('/profile renders account info', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByText('Account')).toBeVisible();
  });

  test('theme picker and color mode buttons visible', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Theme')).toBeVisible();
    await expect(page.getByTestId('theme-grid')).toBeVisible();
    await expect(page.getByText('Color Mode')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible();
  });

  test('about section with changelog (i) button', async ({ page }) => {
    await page.goto('/profile');
    // Scroll to bottom to ensure About section is in viewport
    const aboutHeading = page.locator('h2', { hasText: 'About' });
    await aboutHeading.scrollIntoViewIfNeeded();
    await expect(aboutHeading).toBeVisible();
    const changelogBtn = page.getByTitle('View changelog');
    await changelogBtn.scrollIntoViewIfNeeded();
    await expect(changelogBtn).toBeVisible();
    await changelogBtn.click();
    await expect(page.getByText('Changelog', { exact: true })).toBeVisible();
  });

  test('modules section visible', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Modules')).toBeVisible();
  });
});

test.describe('Route guards', () => {
  test('/body works (module enabled in dev)', async ({ page }) => {
    await page.goto('/body');
    // Body page renders — either config form or tabs
    await expect(page.getByText(/Configure Body Tracking|Stats/)).toBeVisible();
  });

  test('/budget works (module enabled in dev)', async ({ page }) => {
    await page.goto('/budget');
    await expect(page.getByText('Spent')).toBeVisible();
  });

  test('/admin works (TheAdminNick in dev)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
  });
});

test.describe('Theme', () => {
  test('Family Blue theme class applied', async ({ page }) => {
    await page.goto('/body');
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-family-blue/);
  });

  test('dark mode class applied on system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/body');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});
