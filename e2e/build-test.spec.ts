import { expect, test } from '@playwright/test';

import { login } from './helpers';

test('build a timed 5-question test and see it in My Tests', async ({ page }) => {
  await login(page);

  await page.getByRole('navigation').getByRole('link', { name: 'Build a Test' }).click();
  await expect(page.getByRole('heading', { name: 'Build a Test' })).toBeVisible();

  const checkboxes = page.getByRole('checkbox', { name: 'Add to test' });
  for (let i = 0; i < 5; i++) {
    await checkboxes.nth(i).check();
  }
  const tray = page.getByTestId('test-builder-tray');
  await expect(tray.getByText('Selected questions (5)')).toBeVisible();

  await tray.getByLabel('Test name').fill('OSI Deep Dive');
  await tray.getByLabel('Timed', { exact: true }).check();
  await tray.getByLabel('Duration (minutes)').fill('10');
  await tray.getByLabel('Shuffle questions').check();
  await tray.getByRole('button', { name: 'Save Test' }).click();

  // navigates to My Tests with the saved metadata
  await expect(page.getByRole('heading', { name: 'My Tests' })).toBeVisible();
  await expect(page.getByText('OSI Deep Dive')).toBeVisible();
  await expect(page.getByText('5 questions')).toBeVisible();
  await expect(page.getByText('Timed · 10 min')).toBeVisible();
});
