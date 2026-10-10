import { expect, test } from '@playwright/test';

import { login } from './helpers';

test('saved filters, the back button and coming back later', async ({ page }) => {
  await login(page);
  const chip = (name: string) => page.getByRole('button', { name, exact: true });
  const save = async (name: string) => {
    await page.getByRole('button', { name: 'Save these filters' }).click();
    await page.getByRole('textbox', { name: 'Name for these filters' }).fill(name);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(chip(name)).toBeVisible();
  };

  await page.getByRole('button', { name: 'hard' }).click();
  await expect(page).toHaveURL(/\?difficulty=hard$/);
  await save('Hard');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'easy' }).click();
  await save('Easy');

  // applying a saved filter is a step the back button undoes
  await chip('Hard').click();
  await expect(page).toHaveURL(/\?difficulty=hard$/);
  await page.goBack();
  await expect(page).toHaveURL(/\?difficulty=easy$/);
  await expect(chip('Easy')).toHaveAttribute('aria-pressed', 'true');

  // coming back to Home later starts from the last filters used
  await page.getByRole('link', { name: 'Progress' }).click();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\?difficulty=easy$/);

  // a reload keeps the filters (they're in the URL); saved filters live on the
  // account, but the mock backend forgets them on reload, so not checked here
  await page.reload();
  await expect(page).toHaveURL(/\?difficulty=easy$/);
  await expect(page.getByRole('button', { name: 'easy' })).toHaveAttribute('aria-pressed', 'true');
});
