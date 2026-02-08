import { test, expect } from '@playwright/test';

/**
 * Components demo page E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require authentication. See auth-flow.spec.ts for setup instructions.
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Components', () => {
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display components page with tabs', async ({ page }) => {
    await page.goto('/components');

    await expect(page.locator('a:has-text("Feedback")')).toBeVisible();
    await expect(page.locator('a:has-text("Display")')).toBeVisible();
    await expect(page.locator('a:has-text("Data")')).toBeVisible();
  });

  test('should show success toast when clicking Success button', async ({ page }) => {
    await page.goto('/components');

    await page.click('button:has-text("Success")');

    await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 5000 });
  });

  test('should show confirm dialog when clicking Delete Something', async ({ page }) => {
    await page.goto('/components');

    await page.click('button:has-text("Delete Something")');

    // Verify dialog appears with correct title
    await expect(page.locator('h2:has-text("Delete Item")')).toBeVisible();

    // Dismiss the dialog
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h2:has-text("Delete Item")')).not.toBeVisible();
  });

  test('should navigate to Display tab', async ({ page }) => {
    await page.goto('/components');

    await page.click('a:has-text("Display")');
    await expect(page).toHaveURL(/\/components\/display/, { timeout: 5000 });

    // Display tab shows Loading Spinner and Empty State demos
    await expect(page.locator('mat-card-title:has-text("Loading Spinner")')).toBeVisible();
    await expect(page.locator('mat-card-title:has-text("Empty State")')).toBeVisible();
  });

  test('should navigate to Data tab', async ({ page }) => {
    await page.goto('/components');

    await page.click('a:has-text("Data")');
    await expect(page).toHaveURL(/\/components\/data/, { timeout: 5000 });

    // Data tab shows Search Input and Data Table demos
    await expect(page.locator('mat-card-title:has-text("Search Input")')).toBeVisible();
    await expect(page.locator('mat-card-title:has-text("Data Table")')).toBeVisible();
  });
});
