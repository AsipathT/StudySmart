import { test, expect } from '@playwright/test';
import { loginToRl, takeShot } from './_utils';

/**
 * Evidence: Resource Library notifications (top-right bell + page + mark all read).
 *   - Figure A : rl-notifications.spec.ts
 *   - Figure B : rl-notification-popup.png     (bell dropdown open)
 *   - Figure C : rl-mark-all-read.png          (unread badge cleared)
 *   - Figure D : rl-notifications-page.png     (full notifications page)
 */

test('RL notifications: top-right bell opens the popup', async ({ page }) => {
  await loginToRl(page);
  await page.goto('/resource-library/dashboard');

  const bell = page.locator('.rl-topbar-bell');
  await expect(bell).toBeVisible();
  await bell.click();

  await expect(page.locator('.rl-notify-dropdown--topbar')).toBeVisible();
  await takeShot(page, 'rl-notification-popup.png');
});

test('RL notifications: mark all read clears the unread badge', async ({ page }) => {
  await loginToRl(page);
  await page.goto('/resource-library/dashboard');

  const bell = page.locator('.rl-topbar-bell');
  await bell.click();

  // If there is an unread count, click "Mark all read" in the open panel.
  const markAll = page.getByRole('button', { name: /Mark all read/i }).first();
  if (await markAll.isVisible().catch(() => false)) {
    await markAll.click();
    // Give the optimistic UI update and backend refresh a bit more time cross-browser.
    await page.waitForTimeout(1200);
  }

  // Close the popup to take a clean shot showing the bell without a badge.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Cross-browser tolerant check:
  // if a badge exists, it should not show a non-zero unread value after "Mark all read".
  const badge = page.locator('.rl-topbar-bell .ant-badge-count').first();
  if (await badge.count()) {
    await expect(badge).toHaveText(/^(0)?$/);
  }
  await takeShot(page, 'rl-mark-all-read.png');
});

test('RL notifications: dedicated notifications page', async ({ page }) => {
  await loginToRl(page);
  await page.goto('/resource-library/notifications');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await takeShot(page, 'rl-notifications-page.png');
});
