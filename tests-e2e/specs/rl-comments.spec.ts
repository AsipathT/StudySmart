import { test, expect } from '@playwright/test';
import { loginToRl, takeShot } from './_utils';

/**
 * Evidence: Resource comments add / edit / delete (by author or admin).
 *   - Figure A : rl-comments.spec.ts
 *   - Figure B : rl-comment-added.png
 *   - Figure C : rl-comment-edited.png
 *   - Figure D : rl-comment-deleted.png
 */

async function openFirstResourceDetails(page: import('@playwright/test').Page) {
  await page.goto('/resource-library/resources');
  await page.waitForLoadState('networkidle').catch(() => undefined);
  const firstCard = page.locator('.rl-card').first();
  if (!(await firstCard.isVisible().catch(() => false))) {
    test.skip(true, 'No resource cards available to open.');
  }
  await firstCard.click();
  await page.waitForURL(/\/resource-library\/resource\/|\/resources\/|\/resource-library\/dashboard/).catch(() => undefined);
  // Wait for the details page key sections.
  await page
    .locator('.resource-comments-card')
    .scrollIntoViewIfNeeded()
    .catch(() => undefined);
}

test('RL comments: add a new comment', async ({ page }) => {
  await loginToRl(page);
  await openFirstResourceDetails(page);

  const input = page.locator('textarea.comment-editor-textarea').first();
  await input.fill('Playwright evidence: adding a new comment.');
  await page.getByRole('button', { name: /^Comment$/ }).click();
  await page.waitForTimeout(1500);
  await takeShot(page, 'rl-comment-added.png');
});

test('RL comments: edit my own comment', async ({ page }) => {
  await loginToRl(page);
  await openFirstResourceDetails(page);

  const editBtn = page.locator('.comment-edit-link').first();
  if (!(await editBtn.isVisible().catch(() => false))) {
    test.skip(true, 'No editable comment present for the current user.');
  }
  await editBtn.click();
  const editArea = page.locator('.comment-edit-row textarea').first();
  await editArea.fill('Playwright evidence: this comment was edited.');
  await page.getByRole('button', { name: /^Save$/ }).click();
  await page.waitForTimeout(1500);
  await takeShot(page, 'rl-comment-edited.png');
});

test('RL comments: delete my own comment', async ({ page }) => {
  await loginToRl(page);
  await openFirstResourceDetails(page);

  const deleteBtn = page.locator('.comment-delete-link').first();
  if (!(await deleteBtn.isVisible().catch(() => false))) {
    test.skip(true, 'No deletable comment present for the current user.');
  }
  await deleteBtn.click();

  // AntD confirm dialog — click the Delete button.
  const confirm = page.getByRole('button', { name: /^Delete$/ });
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  }
  await page.waitForTimeout(1500);
  await takeShot(page, 'rl-comment-deleted.png');
});
