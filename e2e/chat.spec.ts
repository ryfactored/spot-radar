import { test, expect } from '@playwright/test';

/**
 * Chat E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require authentication. See auth-flow.spec.ts for setup instructions.
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Chat', () => {
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display chat page with message input', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.locator('h1')).toContainText('Chat');
    await expect(page.locator('input[placeholder="Type your message..."]')).toBeVisible();
  });

  test('should have send button disabled when input is empty', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.locator('button[aria-label="Send message"]')).toBeDisabled();
  });

  test('should enable send button when text is entered', async ({ page }) => {
    await page.goto('/chat');

    await page.fill('input[placeholder="Type your message..."]', 'Hello');
    await expect(page.locator('button[aria-label="Send message"]')).toBeEnabled();
  });

  test('should send a message', async ({ page }) => {
    await page.goto('/chat');

    const message = `E2E test message ${Date.now()}`;
    await page.fill('input[placeholder="Type your message..."]', message);
    await page.click('button[aria-label="Send message"]');

    await expect(
      page.locator(`.messages-container`).locator(`.message-content:has-text("${message}")`),
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show connection indicator', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.locator('app-connection-indicator')).toBeVisible();
  });
});
