import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('app-login h2')).toContainText(/sign in/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('app-register h2')).toContainText(/sign up|create|register/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('should have link to register from login', async ({ page }) => {
    await page.goto('/login');

    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
  });

  test('should have link to login from register', async ({ page }) => {
    await page.goto('/register');

    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.locator('button[type="submit"]').click();

    // Should show validation state (mat-form-field adds error class)
    await expect(page.locator('mat-error').first()).toBeVisible();
  });
});
