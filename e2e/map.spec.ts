import { test, expect } from '@playwright/test';

/**
 * F18 public map — end-to-end user journey in a real browser (against the deterministic MSW mock).
 * The WebGL marker layer has no DOM nodes, so the click-through is driven via the accessible table
 * (the keyboard-operable equivalent), which is also the WCAG path. We still assert the map canvas
 * mounts.
 */
test.describe('public map', () => {
  test('renders the map shell, filter and accessible building table', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /indoor environmental quality map/i })).toBeVisible();
    // The MapLibre map mounts (canvas present) inside the labelled application region.
    await expect(page.getByRole('application', { name: /interactive map/i })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();

    // The quantity filter populates from /v1/properties.
    const filter = page.getByRole('combobox', { name: /quantity/i });
    await expect(filter).toBeEnabled();

    // The accessible table fills in from the snapshot (deterministic mock data).
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    await expect(table.getByRole('button').first()).toBeVisible();
  });

  test('clicking a building opens the dialog with trend + distribution charts', async ({ page }) => {
    await page.goto('/');

    const firstBuilding = page.getByRole('table').getByRole('button').first();
    await firstBuilding.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Trend line + boxplot are each exposed as a labelled `img`; the numeric summary backs them.
    await expect(dialog.getByRole('img').first()).toBeVisible();
    await expect(dialog.getByText(/summary/i)).toBeVisible();

    // Switching the look-back range re-fetches and keeps the charts.
    await dialog.getByText(/last week/i).click();
    await expect(dialog.getByRole('img').first()).toBeVisible();

    // Regression: the y-axis title must be a rotated (vertical) label on the left, not collapsed
    // onto the plot origin where it overprinted the top tick. A rotated label is taller than wide.
    const axisTitle = dialog.getByText(/^value \(/i);
    const box = await axisTitle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(box!.width);
  });

  test('is keyboard-operable: a building row opens its dialog with the keyboard', async ({ page }) => {
    await page.goto('/');

    const firstBuilding = page.getByRole('table').getByRole('button').first();
    await firstBuilding.focus();
    await expect(firstBuilding).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('PER: choosing °F converts the displayed temperature values (display-only)', async ({ page }) => {
    await page.goto('/');

    // Switch to a quantity that has a display-unit alternative.
    await page.getByRole('combobox', { name: /quantity/i }).selectOption({ label: 'Temperature' });

    const table = page.getByRole('table');
    await expect(table).toContainText('°C');

    // The display-unit chooser appears for convertible units; pick °F.
    await expect(page.getByText('Display unit')).toBeVisible();
    await page.getByText('°F', { exact: true }).click();

    // Values are now shown in °F (canonical data unchanged underneath).
    await expect(table).toContainText('°F');
  });
});
