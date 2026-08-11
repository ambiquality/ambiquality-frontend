import { test, expect } from '@playwright/test';

/**
 * Primary navigation active state (issue #27): the current route must be visually emphasised in
 * the header nav and exposed to assistive tech via `aria-current="page"`. `NavLink` sets the
 * attribute automatically; Chakra's `_currentPage` style supplies the brand underline.
 */
test.describe('primary navigation active state', () => {
  test('marks the current route with aria-current and a brand underline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'Map' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Browse' })).not.toHaveAttribute('aria-current');

    // Active link is visually emphasised: a 2px brand-colored bottom border (theme `brand.fg`).
    const activeBorder = await nav
      .getByRole('link', { name: 'Map' })
      .evaluate((el) => getComputedStyle(el).borderBottomWidth);
    expect(activeBorder).toBe('2px');

    const inactiveBorder = await nav
      .getByRole('link', { name: 'Browse' })
      .evaluate((el) => getComputedStyle(el).borderBottomWidth);
    // Inactive links keep the transparent placeholder border (no layout shift) — same width.
    expect(inactiveBorder).toBe('2px');
  });

  test('moves the active state when navigating between pages', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /about ambiquality/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Map' })).not.toHaveAttribute('aria-current');
  });
});
