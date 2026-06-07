import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Browser-based WCAG 2.1 A/AA accessibility audit. Unlike the jsdom axe pass in
 * `src/features/public-map/a11y.test.tsx`, this runs in a real layout engine, so it **includes
 * `color-contrast`** — the rule that couldn't be evaluated under jsdom. This is the gate that
 * confirms the deferred contrast check.
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('public map accessibility (real browser)', () => {
  test('the map page has no WCAG 2.1 A/AA violations (including contrast)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      // The WebGL basemap canvas has no semantics to audit; the region wrapping it is labelled.
      .exclude('canvas')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('the open building dialog has no WCAG 2.1 A/AA violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('table').getByRole('button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('img').first()).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude('canvas').analyze();

    expect(results.violations).toEqual([]);
  });
});
