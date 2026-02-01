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

  test('should toggle password visibility on login', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[formcontrolname="password"]');
    const toggleButton = page.locator('button[matsuffix]');

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show password strength indicator on register', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('input[formcontrolname="password"]');
    const strengthLabel = page.locator('.strength-label');

    // Initially hidden
    await expect(strengthLabel).toHaveClass(/hidden/);

    // Type weak password (< 8 chars)
    await passwordInput.fill('short');
    await expect(strengthLabel).toContainText('Weak');
    await expect(strengthLabel).toHaveClass(/weak/);

    // Type fair password (8-11 chars)
    await passwordInput.fill('eightchar');
    await expect(strengthLabel).toContainText('Fair');

    // Type strong password (15+ chars)
    await passwordInput.fill('verylongpassword');
    await expect(strengthLabel).toContainText('Strong');
    await expect(strengthLabel).toHaveClass(/strong/);
  });

  test('should show mismatch error when passwords differ', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('input[formcontrolname="password"]');
    const confirmInput = page.locator('input[formcontrolname="confirmPassword"]');

    // Fill mismatched passwords
    await passwordInput.fill('password123');
    await confirmInput.fill('different456');

    // Blur to trigger validation
    await confirmInput.blur();

    // Should show mismatch error
    await expect(page.locator('mat-error')).toContainText('Passwords do not match');
  });

  test('should have forgot password link on login page', async ({ page }) => {
    await page.goto('/login');

    const forgotLink = page.locator('a[href*="forgot-password"]');
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toContainText('Forgot password');
  });

  test('should display forgot password page', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('app-forgot-password h2')).toContainText(/reset password/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation error for empty forgot password submission', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('mat-error').first()).toBeVisible();
  });

  test('should display reset password fallback when no session', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.locator('app-reset-password h2')).toContainText(/set new password/i);
    // Should show the no-session fallback message
    await expect(page.locator('text=No active session')).toBeVisible();
    await expect(page.locator('a[href*="forgot-password"]')).toBeVisible();
  });

  test('should display verify-email page with informational message', async ({ page }) => {
    await page.goto('/verify-email');

    await expect(page.locator('app-verify-email h2')).toContainText(/email verification/i);
    await expect(page.locator('text=Check your email')).toBeVisible();
    await expect(page.locator('a[href*="login"]')).toBeVisible();
  });

  test('should clear mismatch error when passwords match', async ({ page }) => {
    await page.goto('/register');

    const passwordInput = page.locator('input[formcontrolname="password"]');
    const confirmInput = page.locator('input[formcontrolname="confirmPassword"]');

    // Fill mismatched passwords
    await passwordInput.fill('password123');
    await confirmInput.fill('different');
    await confirmInput.blur();

    // Error should appear
    await expect(page.locator('mat-error')).toContainText('Passwords do not match');

    // Fix the confirmation
    await confirmInput.fill('password123');

    // Error should disappear
    await expect(page.locator('text=Passwords do not match')).not.toBeVisible();
  });
});
