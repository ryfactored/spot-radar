import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Files E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require authentication. See auth-flow.spec.ts for setup instructions.
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Files', () => {
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display files page with upload button', async ({ page }) => {
    await page.goto('/files');

    await expect(page.locator('h1')).toContainText('Files');
    await expect(page.locator('button:has-text("Upload files")')).toBeVisible();
  });

  test('should show empty state when no files', async ({ page }) => {
    await page.goto('/files');

    // Wait for loading to finish
    await page.waitForLoadState('networkidle');

    // Empty state may not show if user already has files
    const emptyState = page.locator('app-empty-state');
    const filesGrid = page.locator('.files-grid mat-card.file-card');

    // Either empty state or file cards should be visible
    const hasFiles = await filesGrid
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasFiles) {
      await expect(emptyState).toContainText('No files yet');
    }
  });

  test('should upload a file', async ({ page }) => {
    await page.goto('/files');

    // Create a temporary test file
    const testFileName = `test-file-${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, 'E2E test file content');

    try {
      // Upload via hidden file input
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);

      // Should show success toast
      await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 10000 });

      // File card should appear
      await expect(page.locator(`.file-name:has-text("${testFileName}")`)).toBeVisible({
        timeout: 5000,
      });
    } finally {
      fs.unlinkSync(testFilePath);
    }
  });

  test('should delete a file', async ({ page }) => {
    await page.goto('/files');

    // Create and upload a temporary test file
    const testFileName = `delete-test-${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, 'File to delete');

    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);

      // Wait for file card to appear
      const fileCard = page.locator(`mat-card:has-text("${testFileName}")`);
      await expect(fileCard).toBeVisible({ timeout: 10000 });

      // Click delete
      await fileCard.locator('button:has-text("Delete")').click();

      // Confirm in dialog
      await page.click('button:has-text("Delete"):not([mat-button])');

      // File should be removed
      await expect(fileCard).not.toBeVisible({ timeout: 5000 });
    } finally {
      fs.unlinkSync(testFilePath);
    }
  });

  test('should display file metadata', async ({ page }) => {
    await page.goto('/files');

    // Create and upload a temporary test file
    const testFileName = `metadata-test-${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, 'Metadata test content');

    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);

      // Wait for file card to appear
      const fileCard = page.locator(`mat-card:has-text("${testFileName}")`);
      await expect(fileCard).toBeVisible({ timeout: 10000 });

      // File card should show the file name
      await expect(fileCard.locator('.file-name')).toContainText(testFileName);

      // File card should show metadata (size, type, time)
      await expect(fileCard.locator('mat-card-subtitle')).toBeVisible();
    } finally {
      fs.unlinkSync(testFilePath);
    }
  });
});
