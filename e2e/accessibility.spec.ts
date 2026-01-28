import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility tests using axe-core.
 * These catch common issues like missing labels, poor contrast, etc.
 *
 * Run with: npx playwright test e2e/accessibility.spec.ts
 *
 * Note: We exclude 'color-contrast' because Material's default accent colors
 * don't meet WCAG AA. To fix, customize the theme with higher contrast colors.
 */
test.describe('Accessibility', () => {
  // Common exclusions for Material Design limitations
  const axeConfig = {
    exclude: [['mat-spinner']], // Spinner is decorative
  };

  // Exclude color-contrast (Material theme issue) and region (public pages don't have shell)
  const excludeRules = ['color-contrast', 'region'];

  test('login page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/login');

    const results = await new AxeBuilder({ page }).disableRules(excludeRules).analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations).toEqual([]);
  });

  test('register page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/register');

    const results = await new AxeBuilder({ page }).disableRules(excludeRules).analyze();

    if (results.violations.length > 0) {
      console.log('Violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations).toEqual([]);
  });

  test('landing page should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).disableRules(excludeRules).analyze();

    if (results.violations.length > 0) {
      console.log('Violations:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
});
