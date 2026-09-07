import { expect, test, type Page } from '@playwright/test';

import { login } from './helpers';

async function buildTwoQuestionTest(page: Page, name: string) {
  await page.getByRole('navigation').getByRole('link', { name: 'Build a Test' }).click();
  const checkboxes = page.getByRole('checkbox', { name: 'Add to test' });
  await checkboxes.nth(0).check(); // q1 (MC, correct B)
  await checkboxes.nth(1).check(); // q2 (TF, correct False)
  const tray = page.getByTestId('test-builder-tray');
  await tray.getByLabel('Test name').fill(name);
  await tray.getByRole('button', { name: 'Save Test' }).click();
  await expect(page.getByRole('heading', { name: 'My Tests' })).toBeVisible();
}

test('take a test in Exam mode: aids hidden until submit, then score + review', async ({
  page,
}) => {
  await login(page);
  await buildTwoQuestionTest(page, 'Exam Run');

  await page.getByRole('button', { name: 'Take Test' }).click();
  await page.getByRole('button', { name: /^Exam/ }).click();
  await page.getByRole('button', { name: 'Start' }).click();

  const q1 = page.getByTestId('question-card-q1');
  await expect(q1).toBeVisible();

  // exam mode: no scissors, no per-question submit buttons
  await expect(page.getByRole('button', { name: /Strike out/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Submit answer' })).toHaveCount(0);

  // revealing tabs hidden pre-submit
  await q1.getByRole('button', { name: 'Commented Answer' }).click();
  await expect(q1.getByRole('tab', { name: 'My Notes' })).toBeVisible();
  await expect(q1.getByRole('tab', { name: 'Commented Answer' })).toHaveCount(0);
  await expect(q1.getByRole('tab', { name: 'Stats' })).toHaveCount(0);

  // answer: q1 correct, q2 wrong
  await q1.getByRole('radio', { name: /Transport layer/ }).check();
  const q2 = page.getByTestId('question-card-q2');
  await q2.getByRole('radio', { name: 'True' }).check();

  await page.getByTestId('submit-test').click();

  const results = page.getByTestId('results-screen');
  await expect(results.getByText('You scored 1 of 2')).toBeVisible();

  // review reveals the explanation tabs now
  const review1 = results.getByTestId('question-card-q1');
  await review1.getByRole('button', { name: 'Commented Answer' }).click();
  await expect(review1.getByRole('tab', { name: 'Commented Answer' })).toBeVisible();

  // retry only the incorrect question
  await results.getByRole('button', { name: 'Retry Incorrect Only' }).click();
  await expect(page.getByTestId('question-card-q2')).toBeVisible();
  await expect(page.getByTestId('question-card-q1')).toHaveCount(0);
});
