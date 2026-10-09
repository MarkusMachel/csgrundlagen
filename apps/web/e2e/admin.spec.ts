import { expect, test } from '@playwright/test';

import { login } from './helpers';

test('admin creates a question and links material, then sees them surface in the app', async ({
  page,
}) => {
  await login(page); // demo@example.com is the seed admin

  // the admin.cs file tab is visible for admins; Stats is the default tab
  await page.getByRole('navigation').getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: /Content authoring/i })).toBeVisible();
  await expect(page.getByTestId('admin-stats-tab')).toBeVisible();

  // --- create a multiple-choice question ---
  await page.getByRole('tab', { name: /New question/ }).click();
  await page.getByLabel('Prompt').fill('E2E: which layer does IP live at?');
  const optionInputs = page.getByPlaceholder('"answer text"');
  await optionInputs.nth(0).fill('Layer 2');
  await optionInputs.nth(1).fill('Layer 3');
  await page.getByLabel('Mark as the correct answer').nth(1).check();
  await page.getByLabel('Explanation (commented answer)').fill('IP is the network layer.');
  await page.getByPlaceholder('Type a tag and press Enter').fill('E2E');
  await page.getByPlaceholder('Type a tag and press Enter').press('Enter');
  await page.getByRole('button', { name: /Create question/ }).click();
  await expect(page.getByText('Question created.')).toBeVisible();

  // --- create material linked to that question ---
  await page.getByRole('tab', { name: /New material/ }).click();
  await page.getByLabel('Title').fill('E2E IP primer');
  await page.getByLabel('URL').fill('https://example.com/ip');
  await page.getByPlaceholder('Type a tag and press Enter').fill('E2E');
  await page.getByPlaceholder('Type a tag and press Enter').press('Enter');
  await page
    .getByRole('listbox', { name: /Link to questions/ })
    .getByText('E2E: which layer does IP live at?')
    .click();
  await page.getByRole('button', { name: /Create material/ }).click();
  await expect(page.getByText('Material created.')).toBeVisible();

  // --- the new material shows on the Curated Material page ---
  await page.getByRole('navigation').getByRole('link', { name: 'Curated Material' }).click();
  await expect(page.getByRole('heading', { name: 'E2E IP primer' })).toBeVisible();

  // --- the new question is findable via search, and its Material tab shows the link ---
  await page.getByRole('button', { name: 'Open search' }).click();
  await page
    .getByRole('searchbox', { name: 'Search questions, material, tests…' })
    .fill('which layer does IP');
  await page
    .getByTestId('search-results')
    .getByText('E2E: which layer does IP live at?')
    .click();

  const card = page.getByTestId(/question-card-/).first();
  await card.getByRole('button', { name: 'Commented Answer' }).click();
  await card.getByRole('tab', { name: 'Material' }).click();
  await expect(card.getByText('E2E IP primer')).toBeVisible();

  // --- Stats reflects the newly created content ---
  await page.getByRole('navigation').getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('tab', { name: 'Stats' }).click();
  const statsPanel = page.getByTestId('admin-stats-tab');
  await expect(statsPanel.getByText('Questions by type')).toBeVisible();
  await expect(statsPanel.getByText('Top tags by answers submitted')).toBeVisible();
});

test('a non-admin has no admin.cs tab and cannot reach /admin', async ({ page }) => {
  // sign in as a regular user
  await page.goto('/login');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();

  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Admin' }),
  ).toHaveCount(0);

  await page.goto('/admin');
  // redirected home
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Content authoring/i })).toHaveCount(0);
});
