import { test, expect } from '@playwright/test';

/**
 * Scroll restoration (issue #28): navigating between routes must start the new page at the top
 * (`<ScrollRestoration />` in `RootLayout`), while back/forward (POP) restores the previous scroll
 * position. `/about` is a static page (tall enough to scroll without a backend); the footer's
 * internal Privacy link is the navigation target — unlike the (non-sticky) header nav, it stays in
 * view after scrolling, so Playwright's click doesn't re-scroll before navigating.
 */
test.describe('scroll restoration', () => {
  test('new route starts at the top, back restores the previous position', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /about ambiquality/i })).toBeVisible();

    // Deterministically create a scrollable offset: bring the footer Privacy link into view.
    const privacyLink = page.locator('footer a[href="/privacy"]');
    await privacyLink.scrollIntoViewIfNeeded();
    const scrolledTo = await page.evaluate(() => window.scrollY);
    expect(scrolledTo).toBeGreaterThan(0);

    // Navigate via the in-view footer link — the new route must open at the top.
    await privacyLink.click();
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    // Going back (POP) must restore the previous scroll offset.
    await page.goBack();
    await expect(page.getByRole('heading', { name: /about ambiquality/i })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('the skip-to-content link still jumps to the main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('table')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /skip/i })).toBeFocused();
    await page.keyboard.press('Enter');

    // Native fragment navigation must land on the main-content anchor.
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#main-content');
  });
});
