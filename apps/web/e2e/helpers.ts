import { expect, type Page } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();
}

/** The all-questions feed section on Home (excludes the QotD card). */
export function feed(page: Page) {
  return page.getByTestId('question-feed');
}
