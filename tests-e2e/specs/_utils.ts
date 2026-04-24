import { Page, expect } from '@playwright/test';

/**
 * Shared helpers for Resource Library Playwright specs.
 *
 * Credentials mirror the DEMO strip in ResourceLibraryLoginPage.jsx. The
 * backend seeds these accounts, so these values are safe to hard-code for
 * evidence screenshots.
 */
export const RL_ADMIN = {
  email: 'resourceadmin@gmail.com',
  password: 'RAdmin123',
};

export const RL_STUDENT = {
  email: 'kasun@gmail.com',
  password: 'kasun123',
};

/** Navigate to the Resource Library sign-in screen. */
export async function gotoRlLogin(page: Page) {
  await page.addInitScript(() => {
    // The RL login page is normally reachable via a sidebar click which
    // sets a short-lived "intent" token. In tests we land directly, so
    // pre-set the intent so the guard does not redirect us to /login.
    try {
      const payload = JSON.stringify({ t: Date.now(), source: 'playwright' });
      window.sessionStorage.setItem('rl.loginIntent', payload);
    } catch {
      /* ignore */
    }
  });
  await page.goto('/resource-library');
}

/** Fill the Ant Design login form using stable placeholders. */
export async function fillLoginForm(
  page: Page,
  email: string,
  password: string
) {
  await page.getByPlaceholder('your.email@sliit.lk').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
}

/** Click the submit button ("Sign In →"). */
export async function submitLogin(page: Page) {
  await page.getByRole('button', { name: /Sign In/i }).click();
}

/** Full happy-path login for the given account, lands on the RL dashboard. */
export async function loginToRl(
  page: Page,
  who: { email: string; password: string } = RL_ADMIN
) {
  await gotoRlLogin(page);
  await fillLoginForm(page, who.email, who.password);
  await submitLogin(page);
  await expect(page).toHaveURL(/\/resource-library\/dashboard/, { timeout: 20_000 });
  // Allow dashboard tiles + badges to settle before screenshots.
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

/** Convenience: save a full-page screenshot under the evidence folder. */
export async function takeShot(page: Page, file: string) {
  await page.screenshot({
    path: `screenshots/${file}`,
    fullPage: true,
  });
}
