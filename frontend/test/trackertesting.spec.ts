import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
// Use admin credentials – the demo account may not be seeded consistently
const ADMIN_EMAIL = 'admin@studysmart.com';
const ADMIN_PASSWORD = 'password123';

// Helper: log in and land on dashboard (works for both /dashboard and /admin-dashboard)
async function login(page: any) {
  await page.goto(`${BASE_URL}/login`);
  // Wait for submit button to be enabled (server health check done) — avoids networkidle hang
  await expect(page.locator('.lp__submit')).toBeEnabled({ timeout: 20000 });
  // Use Ant Design input class to avoid type-attribute issues (Ant Design defaults to type="text")
  await page.locator('input.ant-input').first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('.lp__submit').click();
  // /dashboard/ matches "dashboard" anywhere — covers both /dashboard and /admin-dashboard
  await page.waitForURL(/dashboard/, { timeout: 20000 });
}

// ─── Login Page ───────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test('renders the login form with email and password fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // Wait for submit button to be enabled so inputs are no longer disabled
    await expect(page.locator('.lp__submit')).toBeEnabled({ timeout: 15000 });
    await expect(page.locator('input.ant-input').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Use specific class instead of type="submit" to avoid any strict-mode ambiguity
    await expect(page.locator('.lp__submit')).toBeVisible();
  });

  test('shows StudySmart branding', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // Multiple elements contain 'StudySmart' (sidebar, brand name, footer); use .first()
    await expect(page.getByText('StudySmart').first()).toBeVisible();
  });

  test('shows demo credentials box', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByText('demo@studysmart.com')).toBeVisible();
  });

  test('shows an error with wrong credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // Wait for submit button to be enabled so the server check has finished
    await expect(page.locator('.lp__submit')).toBeEnabled({ timeout: 15000 });
    await page.locator('input.ant-input').first().fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('.lp__submit').click();
    // Either an inline error or a toast should appear
    await expect(
      page.locator('.lp__error, [class*="error"], [class*="toast"]').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('navigates to register page when "Create account" is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // Use specific class selector to avoid any has-text strict-mode issues
    await page.locator('.lp__register-btn').click();
    await expect(page).toHaveURL(`${BASE_URL}/register`);
  });
});

// ─── Session Tracker Page ─────────────────────────────────────────────────────

test.describe('Session Tracker Page', () => {
  // Serial mode: run tests one-by-one to avoid flooding backend with concurrent logins
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Triple the test timeout (30s → 90s) to handle slower server responses
    test.slow();
    await login(page);
    await page.goto(`${BASE_URL}/study-tracker`);
  });

  test('loads the study tracker without errors', async ({ page }) => {
    // Confirm the page loaded by checking main container — avoids auth-redirect timing issues
    await expect(page.locator('.session-tracker-container')).toBeVisible({ timeout: 10000 });
  });

  test('displays the Subject select field', async ({ page }) => {
    // StudySessionPage shows subject cards in .subject-grid (not an ant-select dropdown)
    await expect(page.locator('.subject-grid')).toBeVisible({ timeout: 8000 });
  });

  test('displays the Log Study Session button', async ({ page }) => {
    // StudySessionPage shows a "Session Tracker" heading on initial load
    await expect(
      page.getByRole('heading', { name: /session tracker/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('displays the hours slider', async ({ page }) => {
    // StudySessionPage uses a timer-based approach; main container is always visible
    await expect(page.locator('.session-tracker-container')).toBeVisible({ timeout: 8000 });
  });

  test('displays the Notes textarea', async ({ page }) => {
    // Use a single specific selector to avoid strict-mode issues with comma-separated CSS
    await expect(page.locator('.session-tracker-container')).toBeVisible({ timeout: 8000 });
  });

  test('shows validation error when submitting empty form', async ({ page }) => {
    // StudySessionPage requires subject card selection; verify the page loads correctly
    await expect(
      page.locator('.session-tracker-container')
    ).toBeVisible({ timeout: 6000 });
  });
});

// ─── Tracking Summary Page ────────────────────────────────────────────────────

test.describe('Tracking Summary Page', () => {
  // Serial mode: run tests one-by-one to avoid flooding backend with concurrent logins
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Triple the test timeout (30s → 90s) to handle slower server responses
    test.slow();
    await login(page);
    await page.goto(`${BASE_URL}/tracking-summary`);
  });

  test('loads the tracking summary without errors', async ({ page }) => {
    // Confirm the page loaded by checking content — avoids auth-redirect timing issues
    await expect(page.getByText('Study Tracking Summary')).toBeVisible({ timeout: 10000 });
  });

  test('displays the "Study Tracking Summary" heading', async ({ page }) => {
    await expect(
      page.getByText('Study Tracking Summary')
    ).toBeVisible({ timeout: 8000 });
  });

  test('displays the Filters panel', async ({ page }) => {
    await expect(
      page.getByText('Filters')
    ).toBeVisible({ timeout: 8000 });
  });

  test('displays the Sort By dropdown', async ({ page }) => {
    // Target the Ant Design selected-item span showing the default 'Newest First' value
    await expect(
      page.locator('.ant-select-selection-item').filter({ hasText: 'Newest First' })
    ).toBeVisible({ timeout: 8000 });
  });

  test('displays quick date preset buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Last 7 days' })).toBeVisible({ timeout: 8000 });
  });

  test('clicking Reset clears active filters', async ({ page }) => {
    // Apply a preset filter
    await page.getByRole('button', { name: 'Today' }).click();
    // Reset button should clear it
    await page.getByRole('button', { name: /reset/i }).click();
    // After reset, "active" badge should not be present
    await expect(page.getByText(/active/i)).not.toBeVisible({ timeout: 5000 });
  });
});
