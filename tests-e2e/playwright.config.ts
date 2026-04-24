import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Resource Library E2E evidence pack.
 *
 * The backend is expected to be running on http://localhost:5000 and
 * the React frontend on http://localhost:3000 before tests are executed.
 * Each spec captures screenshots into `screenshots/` so they can be
 * pasted directly into the "Evidence for use of a testing tool" section.
 */
export default defineConfig({
  testDir: './specs',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1440, height: 900 },
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
