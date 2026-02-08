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

  test('should display quick-link cards', async ({ page }) => {
    const quickLinks = page.locator('.quick-links');
    await expect(quickLinks).toBeVisible();

    await expect(quickLinks.locator('h3:has-text("Notes")')).toBeVisible();
    await expect(quickLinks.locator('h3:has-text("Chat")')).toBeVisible();
    await expect(quickLinks.locator('h3:has-text("Files")')).toBeVisible();
    await expect(quickLinks.locator('h3:has-text("Profile")')).toBeVisible();
  });

  test('should navigate to notes from quick link', async ({ page }) => {
    await page.locator('.link-card:has-text("Notes")').click();
    await expect(page).toHaveURL(/\/notes/, { timeout: 5000 });
  });

  test('should navigate to profile from quick link', async ({ page }) => {
    await page.locator('.link-card:has-text("Profile")').click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 5000 });
  });
});
