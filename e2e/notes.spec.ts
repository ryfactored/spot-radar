import { test, expect } from '@playwright/test';

/**
 * Notes CRUD E2E tests.
 *
 * SETUP REQUIRED:
 * These tests require authentication. See auth-flow.spec.ts for setup instructions.
 */

const TEST_USER = {
  email: process.env['TEST_USER_EMAIL'] || '',
  password: process.env['TEST_USER_PASSWORD'] || '',
};

const hasTestCredentials = TEST_USER.email && TEST_USER.password;

test.describe('Notes CRUD', () => {
  test.skip(!hasTestCredentials, 'Test credentials not configured');

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('should display notes list', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.locator('h1')).toContainText(/notes/i);
    // Should have "New Note" button
    await expect(page.locator('button:has-text("New Note")')).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    await page.goto('/notes');

    // Click "New Note" button
    await page.click('button:has-text("New Note")');
    await expect(page).toHaveURL(/notes\/new/);

    // Fill in note details
    const noteTitle = `Test Note ${Date.now()}`;
    await page.fill('input[formcontrolname="title"]', noteTitle);
    await page.fill('textarea[formcontrolname="content"]', 'This is test content');

    // Save
    await page.click('button[type="submit"]');

    // Should redirect back to notes list
    await expect(page).toHaveURL(/\/notes$/, { timeout: 5000 });

    // Should show the new note
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    // First create a note
    await page.goto('/notes/new');
    const noteTitle = `Edit Test ${Date.now()}`;
    await page.fill('input[formcontrolname="title"]', noteTitle);
    await page.fill('textarea[formcontrolname="content"]', 'Original content');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/notes$/, { timeout: 5000 });

    // Click edit on the note we just created
    const noteCard = page.locator(`mat-card:has-text("${noteTitle}")`);
    await noteCard.locator('button:has-text("Edit")').click();

    // Should be on edit page
    await expect(page).toHaveURL(/notes\/.*\/edit/);

    // Update content
    const updatedTitle = `${noteTitle} - Updated`;
    await page.fill('input[formcontrolname="title"]', updatedTitle);
    await page.click('button[type="submit"]');

    // Should redirect back and show updated title
    await expect(page).toHaveURL(/\/notes$/, { timeout: 5000 });
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // First create a note to delete
    await page.goto('/notes/new');
    const noteTitle = `Delete Test ${Date.now()}`;
    await page.fill('input[formcontrolname="title"]', noteTitle);
    await page.fill('textarea[formcontrolname="content"]', 'To be deleted');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/notes$/, { timeout: 5000 });

    // Click delete on the note
    const noteCard = page.locator(`mat-card:has-text("${noteTitle}")`);
    await noteCard.locator('button:has-text("Delete")').click();

    // Confirm deletion in dialog
    await page.click('button:has-text("Delete"):not([mat-button])');

    // Should show success toast
    await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 5000 });

    // Note should be gone
    await expect(page.locator(`text=${noteTitle}`)).not.toBeVisible();
  });

  test('should search notes', async ({ page }) => {
    await page.goto('/notes');

    // Type in search
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test search query');
    await searchInput.press('Enter');

    // Search should be applied (URL or UI indication)
    // The actual results depend on existing data
  });

  test('should paginate notes', async ({ page }) => {
    await page.goto('/notes');

    // Paginator should be visible if there are notes
    const paginator = page.locator('mat-paginator');
    // Only check if paginator exists - it may be hidden if few notes
    await expect(paginator).toBeVisible();
  });
});
