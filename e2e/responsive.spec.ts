import { test, expect } from '@playwright/test';

/**
 * Responsive sweep: the SPA must work from a 360 px phone up to desktop (Phase 8). The key failure
 * mode is horizontal overflow (a wide control or the chart SVG forcing a sideways scroll), so we
 * assert the document never overflows its viewport and the core controls stay reachable.
 */
test.describe('responsive layout', () => {
  test('no horizontal overflow at 360 px, core controls visible', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /indoor environmental quality map/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /quantity/i })).toBeVisible();
    await expect(page.getByRole('application', { name: /interactive map/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    // No element pushes the page wider than the viewport (allow 1 px rounding slack).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the building dialog and its charts fit within 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    await page.getByRole('table').getByRole('button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('img').first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
