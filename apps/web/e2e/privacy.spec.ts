import { expect, test } from '@playwright/test';

import { answerConsent } from './helpers';

test('"Essential only" keeps the theme for this page load only, and is asked once', async ({
  page,
}) => {
  await page.goto('/login');
  await answerConsent(page, 'Essential only');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();

  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 14, 16)');
  expect(await page.evaluate(() => localStorage.getItem('cft.ui'))).toBeNull();

  await page.reload();
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Privacy choices' })).toHaveCount(0);

  // the policy is one click away, and choices can be changed from every page
  await page.getByRole('link', { name: 'privacy' }).click();
  await expect(page.getByRole('heading', { name: /Privacy policy/ })).toBeVisible();
  await page.getByRole('button', { name: 'Privacy settings' }).click();
  await expect(page.getByRole('dialog', { name: /Privacy settings/ })).toBeVisible();
});
