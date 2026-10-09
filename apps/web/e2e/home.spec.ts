import { expect, test } from '@playwright/test';

import { feed, login } from './helpers';

test('login → browse → answer a multiple-choice and a true/false question', async ({ page }) => {
  await login(page);

  // multiple choice (q1, correct answer B = "Transport layer")
  const mcCard = feed(page).getByTestId('question-card-q1');
  await mcCard.getByRole('radio', { name: /Transport layer/ }).check();
  await mcCard.getByRole('button', { name: 'Submit answer' }).click();
  await expect(mcCard.getByTestId('answer-feedback')).toHaveText(/Correct!/);

  // explanation is revealed after submitting
  await mcCard.getByRole('button', { name: 'Commented Answer' }).click();
  await mcCard.getByRole('tab', { name: 'Commented Answer' }).click();
  await expect(mcCard.getByText(/transport layer \(layer 4\)/i)).toBeVisible();

  // true/false (q2, correct answer False)
  const tfCard = feed(page).getByTestId('question-card-q2');
  await tfCard.getByRole('radio', { name: 'False' }).check();
  await tfCard.getByRole('button', { name: 'Submit answer' }).click();
  await expect(tfCard.getByTestId('answer-feedback')).toHaveText(/Correct!/);

  // streak shows up in the status bar after correct answers
  await expect(page.getByTestId('streak')).toHaveText(/2/);
});

test('bookmark a question and revisit it from the Bookmarks page', async ({ page }) => {
  await login(page);

  const card = feed(page).getByTestId('question-card-q3');
  await card.getByRole('button', { name: 'Bookmark this question' }).click();
  await expect(card.getByRole('button', { name: 'Remove bookmark' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Bookmarks' }).click();
  const bookmarked = page.getByTestId('question-card-q3');
  await expect(bookmarked).toBeVisible();

  // still answerable from here
  await bookmarked.getByRole('radio', { name: /Domain names to IP addresses/ }).check();
  await bookmarked.getByRole('button', { name: 'Submit answer' }).click();
  await expect(bookmarked.getByTestId('answer-feedback')).toBeVisible();
});

test('global search finds a question and navigates to it', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: 'Open search' }).click();
  await page.getByRole('searchbox', { name: 'Search questions, material, tests…' }).fill('quicksort');
  const results = page.getByTestId('search-results');
  await expect(results.getByText('Questions')).toBeVisible();
  await results.getByText(/worst-case time complexity of quicksort/).click();

  await expect(page.getByTestId('question-card-q26')).toBeVisible();
});

test('switching locale changes UI strings', async ({ page }) => {
  await login(page);

  await page.getByTestId('locale-switcher').click();
  await page.getByRole('menuitem', { name: 'Deutsch' }).click();

  // nav file tabs keep their code-style names but their accessible labels localize
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Meine Tests' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Schwachstellen' })).toBeVisible();
  await expect(page.getByText('Frage des Tages')).toBeVisible();
});

test('dark mode toggles and persists across a reload', async ({ page }) => {
  await login(page);

  await page.getByTestId('theme-toggle').click();
  const readMode = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('cft.ui');
      return raw ? (JSON.parse(raw) as { state: { themeMode: string } }).state.themeMode : null;
    });
  expect(await readMode()).toBe('dark');
  // --bg dark token #0e0e10 (console black)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 14, 16)');

  await page.reload();
  await expect(page.getByTestId('question-of-the-day')).toBeVisible();
  expect(await readMode()).toBe('dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 14, 16)');
});
