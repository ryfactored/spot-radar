import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require authentication. See auth-flow.spec.ts for setup instructions.
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Dashboard', () => {
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display welcome message with user email', async ({ page }) => {
    await expect(page.locator('.welcome')).toContainText(TEST_USER.email);
  });

  test('should display the releases hero and stats', async ({ page }) => {
    await expect(page.locator('.hero-chip:has-text("New Releases")')).toBeVisible();
    await expect(page.locator('.stat-title:has-text("Followed Artists")')).toBeVisible();
  });

  test('should navigate to the releases feed', async ({ page }) => {
    await page.locator('a:has-text("View Feed")').first().click();
    await expect(page).toHaveURL(/\/releases/, { timeout: 5000 });
  });
});
