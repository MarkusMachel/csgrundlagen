import { expect, test } from '@playwright/test';

import { feed, login } from './helpers';

// Runs in the "mobile" Playwright project (Pixel 5 viewport).
test('mobile: file-tab navigation and answering stay usable', async ({ page }) => {
  await login(page);

  // the file-tab strip is the nav; it scrolls horizontally and stays tappable
  const nav = page.getByRole('navigation');
  const bookmarksTab = nav.getByRole('link', { name: 'Bookmarks' });
  await bookmarksTab.scrollIntoViewIfNeeded();
  await expect(bookmarksTab).toBeVisible();
  await bookmarksTab.click();
  await expect(page.getByText('Nothing bookmarked yet')).toBeVisible();

  await nav.getByRole('link', { name: 'Home' }).click();

  // the layout stays usable: answer a question end to end
  const card = feed(page).getByTestId('question-card-q1');
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('radio', { name: /Transport layer/ }).check();
  await card.getByRole('button', { name: 'Submit answer' }).click();
  await expect(card.getByTestId('answer-feedback')).toHaveText(/Correct!/);

  // no horizontal overflow of the page itself at the mobile viewport
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
});
