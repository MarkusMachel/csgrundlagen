import { expect, test } from '@playwright/test';

import { answerConsent, feed } from './helpers';

test('browse signed out, log in from the prompt and the answer goes through', async ({ page }) => {
  await page.goto('/');
  await answerConsent(page);

  // the feed is open to everyone
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();
  const card = feed(page).getByTestId('question-card-q1');
  await card.getByRole('radio', { name: /Transport layer/ }).check();
  await card.getByRole('button', { name: 'Submit answer' }).click();

  // answering needs an account: the prompt opens, and logging in finishes the answer
  const dialog = page.getByRole('dialog', { name: 'Log in to continue' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Email').fill('demo@example.com');
  await dialog.getByLabel('Password').fill('password');
  await dialog.getByRole('button', { name: 'Log in' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(card.getByTestId('answer-feedback')).toHaveText(/Correct!/);
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
});

test('personal pages ask to log in, and show up after logging in', async ({ page }) => {
  await page.goto('/');
  await answerConsent(page);
  await page.getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByText('This page is yours once you log in')).toBeVisible();
  const dialog = page.getByRole('dialog', { name: 'Log in to continue' });
  await dialog.getByLabel('Email').fill('demo@example.com');
  await dialog.getByLabel('Password').fill('password');
  await dialog.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('This page is yours once you log in')).toHaveCount(0);
  await expect(page).toHaveURL(/\/progress$/);
});
