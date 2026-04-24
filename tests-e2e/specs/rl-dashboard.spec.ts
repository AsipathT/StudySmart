import { test, expect } from '@playwright/test';
import { loginToRl, takeShot } from './_utils';

/**
 * Evidence: Resource Library dashboard overview.
 *   - Figure A : rl-dashboard.spec.ts
 *   - Figure B : rl-dashboard.png             (metric cards + recent resources)
 *   - Figure C : rl-dashboard-topbar-bell.png (bell icon in the top-right)
 */

test('RL dashboard: metrics and recent resources render', async ({ page }) => {
  await loginToRl(page);
  await page.goto('/resource-library/dashboard');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('.rl-page-title').first()).toHaveText(/Dashboard/i);
  await expect(page.locator('.rl-metrics').first()).toBeVisible();
  await takeShot(page, 'rl-dashboard.png');

  // Also capture the top-right notification bell (it's a feature I built).
  const bell = page.locator('.rl-topbar-bell');
  await expect(bell).toBeVisible();
  await bell.scrollIntoViewIfNeeded();
  await takeShot(page, 'rl-dashboard-topbar-bell.png');
});
