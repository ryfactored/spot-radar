import { test, expect } from '@playwright/test';

/**
 * Visual regression tests using Playwright's screenshot comparison.
 *
 * These tests capture screenshots and compare against baseline images.
 *
 * Commands:
 * - First run (create baselines): npm run e2e:update-snapshots
 * - Subsequent runs: npm run e2e (compares against baselines)
 *
 * Baseline images are stored in e2e/visual.spec.ts-snapshots/
 * Commit these to version control to track visual changes.
 *
 * Note: Screenshots may vary slightly across platforms (Windows/Mac/Linux).
 * Configure thresholds or use Docker for consistent CI environments.
 */

test.describe('Visual Regression', () => {
  test.skip(!!process.env['CI'], 'Visual regression tests are skipped in CI (platform-dependent baselines)');
  
  test('login page', async ({ page }) => {
    await page.goto('/login');
    // Wait for fonts and animations to settle
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.02, // Allow 2% difference for anti-aliasing
    });
  });

  test('register page', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('register-page.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('landing-page.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page - dark mode', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Inject dark mode class (simulating user preference)
    await page.evaluate(() => {
      document.body.classList.add('dark-theme');
    });

    await expect(page).toHaveScreenshot('login-page-dark.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('register page with password strength indicator', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Fill password to show strength indicator
    await page.fill('input[formcontrolname="password"]', 'verystrongpassword123');

    await expect(page).toHaveScreenshot('register-password-strength.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page with validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Submit empty form to trigger validation
    await page.click('button[type="submit"]');

    // Wait for error states
    await page.waitForSelector('mat-error');

    await expect(page).toHaveScreenshot('login-validation-errors.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
