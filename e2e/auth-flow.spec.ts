import { test, expect } from '@playwright/test';

/**
 * Complete authentication flow E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require a real Supabase test user. To enable:
 *
 * 1. Create a test user in your Supabase project
 * 2. Create a `.env.test` file with:
 *    TEST_USER_EMAIL=test@example.com
 *    TEST_USER_PASSWORD=yourpassword
 * 3. Load env vars in playwright.config.ts or use dotenv
 * 4. Remove `.skip` from the tests below
 *
 * Alternatively, set up auth mocking with Playwright's route interception.
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Auth Flow', () => {
  // Skip all tests if no credentials configured
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test('should login and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/dashboard/i);
  });

  test('should show user info in shell after login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Should show logout button (indicates authenticated state)
    await expect(page.locator('button[aria-label="Sign out"]')).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Then logout
    await page.click('button[aria-label="Sign out"]');

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('should persist session across page reload', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('button[aria-label="Sign out"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error, [role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});
