import { expect, type Page } from '@playwright/test';

/** Answers the first-visit privacy banner, as a visitor would. */
export async function answerConsent(
  page: Page,
  choice: 'Accept all' | 'Essential only' = 'Accept all',
) {
  const banner = page.getByRole('region', { name: 'Privacy choices' });
  await banner.getByRole('button', { name: choice }).click();
  await expect(banner).toHaveCount(0);
}

export async function login(page: Page) {
  await page.goto('/login');
  await answerConsent(page);
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();
}

/** The all-questions feed section on Home (excludes the QotD card). */
export function feed(page: Page) {
  return page.getByTestId('question-feed');
}
