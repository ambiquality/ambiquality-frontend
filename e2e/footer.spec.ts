import { test, expect } from '@playwright/test';

/**
 * Footer structure (issues #25 + #26): resource links are grouped into labelled columns for
 * scannability, and the Ingestion API reference + "sending measurements" guide are reachable
 * from every page (previously only surfaced behind auth on the sensor detail page). Headings
 * are exposed to screen readers; the grid collapses gracefully at 360 px.
 */
test.describe('site footer', () => {
  test('groups resource links into labelled sections with reachable ingestion docs', async ({
    page,
  }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /about ambiquality/i })).toBeVisible();

    const footer = page.getByRole('navigation', { name: 'Site footer' });
    await expect(footer).toBeVisible();

    // Grouped, labelled columns.
    await expect(footer.getByRole('heading', { name: 'Explore' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Open data' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Developers' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Contact' })).toBeVisible();

    // The ingestion docs are site-wide now (issue #25): ingestion Scalar + wiki guide.
    const ingestionRef = footer.getByRole('link', { name: 'Ingestion API reference' });
    await expect(ingestionRef).toHaveAttribute('href', /\/ingestion\/scalar$/);
    const sendingGuide = footer.getByRole('link', { name: 'Sending measurements guide' });
    await expect(sendingGuide).toHaveAttribute('href', /sending-measurements\.html$/);

    // Internal routes still work (Explore group).
    await footer.getByRole('link', { name: 'About' }).first().click();
    await expect(page.getByRole('heading', { name: /about ambiquality/i })).toBeVisible();
  });

  test('collapses to a single column at 360 px without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /about ambiquality/i })).toBeVisible();

    const footer = page.getByRole('navigation', { name: 'Site footer' });
    await footer.scrollIntoViewIfNeeded();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
