import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated user from notes to login', async ({ page }) => {
    await page.goto('/notes');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated user from profile to login', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should allow guest access to login page', async ({ page }) => {
    await page.goto('/login');

    // Should stay on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should allow guest access to register page', async ({ page }) => {
    await page.goto('/register');

    // Should stay on register page
    await expect(page).toHaveURL(/register/);
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent');

    await expect(page.locator('app-not-found h2')).toContainText(/page not found/i);
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });
});
