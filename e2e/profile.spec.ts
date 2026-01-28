import { test, expect } from '@playwright/test';

/**
 * Profile page E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require authentication. See auth-flow.spec.ts for setup instructions.
 *
 * For isolated testing, you can use Playwright's storageState to reuse auth:
 * 1. Run auth setup that saves state: await page.context().storageState({ path: 'auth.json' })
 * 2. Use in tests: test.use({ storageState: 'auth.json' })
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Profile', () => {
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Navigate to profile
    await page.goto('/profile');
  });

  test('should display profile page', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/profile/i);
    await expect(page.locator('input[formcontrolname="displayName"]')).toBeVisible();
  });

  test('should load current user data', async ({ page }) => {
    // Email field should be populated (or display name)
    const displayNameInput = page.locator('input[formcontrolname="displayName"]');
    await expect(displayNameInput).toBeVisible();
  });

  test('should update display name', async ({ page }) => {
    const displayNameInput = page.locator('input[formcontrolname="displayName"]');
    const newName = `Test User ${Date.now()}`;

    await displayNameInput.clear();
    await displayNameInput.fill(newName);
    await page.click('button[type="submit"]');

    // Should show success toast
    await expect(page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container')).toBeVisible(
      { timeout: 5000 },
    );
  });

  test('should show validation error for empty display name', async ({ page }) => {
    const displayNameInput = page.locator('input[formcontrolname="displayName"]');

    await displayNameInput.clear();
    await displayNameInput.blur();

    // Should show validation error
    await expect(page.locator('mat-error')).toBeVisible();
  });
});
