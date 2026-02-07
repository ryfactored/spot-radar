import { test, expect } from '@playwright/test';

const TOAST_TYPES = ['success', 'error', 'info'] as const;

test.describe('Toast Colors', () => {
  for (const type of TOAST_TYPES) {
    test(`${type} toast should use the themed background color`, async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Read the expected color from the CSS custom property on <html>
      const expectedBg = await page.evaluate((t) => {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(`--app-toast-${t}-bg`)
          .trim();
      }, type);

      // The CSS custom property must be defined
      expect(expectedBg).toBeTruthy();

      // Inject a DOM structure matching Angular Material's snackbar output.
      // panelClass is applied to the overlay pane wrapper; the surface is a descendant.
      await page.evaluate((toastType) => {
        let overlayContainer = document.querySelector('.cdk-overlay-container');
        if (!overlayContainer) {
          overlayContainer = document.createElement('div');
          overlayContainer.className = 'cdk-overlay-container';
          document.body.appendChild(overlayContainer);
        }

        const pane = document.createElement('div');
        pane.className = `cdk-overlay-pane toast-${toastType}`;
        pane.innerHTML = `
          <mat-snack-bar-container class="mat-mdc-snack-bar-container mdc-snackbar">
            <div class="mdc-snackbar__surface">
              <div class="mat-mdc-snack-bar-label mdc-snackbar__label" role="status">
                Test ${toastType} message
              </div>
            </div>
          </mat-snack-bar-container>
        `;
        overlayContainer.appendChild(pane);
      }, type);

      const surface = page.locator(`.toast-${type} .mdc-snackbar__surface`);
      await expect(surface).toBeAttached();

      // Verify the rendered background-color matches the CSS custom property value
      const actualBg = await surface.evaluate((el) => {
        const rgb = getComputedStyle(el).backgroundColor;
        // Convert rgb() to hex for reliable comparison
        const match = rgb.match(/\d+/g);
        if (!match) return '';
        return (
          '#' +
          match
            .slice(0, 3)
            .map((n) => parseInt(n).toString(16).padStart(2, '0'))
            .join('')
        );
      });

      expect(actualBg).toBe(expectedBg);
    });
  }

  test('all three toast types should have distinct colors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const colors: string[] = [];

    for (const type of TOAST_TYPES) {
      const color = await page.evaluate((t) => {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(`--app-toast-${t}-bg`)
          .trim();
      }, type);

      expect(color).toBeTruthy();
      colors.push(color);
    }

    // All three colors must be different from each other
    expect(new Set(colors).size).toBe(3);
  });

  test('toast text color should be white', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      let overlayContainer = document.querySelector('.cdk-overlay-container');
      if (!overlayContainer) {
        overlayContainer = document.createElement('div');
        overlayContainer.className = 'cdk-overlay-container';
        document.body.appendChild(overlayContainer);
      }

      const pane = document.createElement('div');
      pane.className = 'cdk-overlay-pane toast-error';
      pane.innerHTML = `
        <mat-snack-bar-container class="mat-mdc-snack-bar-container mdc-snackbar">
          <div class="mdc-snackbar__surface">
            <div class="mat-mdc-snack-bar-label mdc-snackbar__label" role="status">
              Error message
            </div>
          </div>
        </mat-snack-bar-container>
      `;
      overlayContainer.appendChild(pane);
    });

    const surface = page.locator('.toast-error .mdc-snackbar__surface');
    await expect(surface).toBeAttached();

    const textColor = await surface.evaluate((el) => getComputedStyle(el).color);
    expect(textColor).toBe('rgb(255, 255, 255)');
  });
});
