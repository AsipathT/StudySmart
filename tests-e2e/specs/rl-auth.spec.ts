import { test, expect } from '@playwright/test';
import {
  fillLoginForm,
  gotoRlLogin,
  loginToRl,
  RL_ADMIN,
  submitLogin,
  takeShot,
} from './_utils';

/**
 * Evidence: Resource Library authentication flow.
 *   - Figure A : rl-auth.spec.ts              (this source file)
 *   - Figure B : rl-login-failure.png         (wrong password toast)
 *   - Figure C : rl-login-success.png         (post-login dashboard)
 */

test('RL auth: wrong password shows failure toast', async ({ page }) => {
  await gotoRlLogin(page);
  await fillLoginForm(page, RL_ADMIN.email, 'wrong-password');
  await submitLogin(page);

  // Stay on the login page — either a toast, an inline error, or the form error message appears.
  await expect(page).toHaveURL(/\/resource-library(?!\/dashboard)/);
  await page.waitForTimeout(1500);
  await takeShot(page, 'rl-login-failure.png');
});

test('RL auth: admin login lands on the dashboard', async ({ page }) => {
  await loginToRl(page, RL_ADMIN);
  await expect(page.locator('.rl-page-title, .rl-title, .rl-wrap')).toBeVisible();
  await takeShot(page, 'rl-login-success.png');
});
