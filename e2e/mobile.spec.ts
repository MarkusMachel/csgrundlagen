import { expect, test } from '@playwright/test';

import { feed, login } from './helpers';

// Runs in the "mobile" Playwright project (Pixel 5 viewport).
test('mobile: browse and answer with the overlay drawer navigation', async ({ page }) => {
  await login(page);

  // sidebar is hidden behind a hamburger and opens as an overlay drawer
  await expect(page.getByTestId('mobile-drawer')).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByTestId('mobile-drawer');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('Weak Spots')).toBeVisible();
  // navigating closes the drawer
  await drawer.getByRole('link', { name: 'Home' }).click();
  await expect(page.getByTestId('mobile-drawer')).toBeHidden();

  // the layout stays usable: answer a question end to end
  const card = feed(page).getByTestId('question-card-q1');
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('radio', { name: /Transport layer/ }).check();
  await card.getByRole('button', { name: 'Submit answer' }).click();
  await expect(card.getByTestId('answer-feedback')).toHaveText(/Correct!/);

  // no horizontal overflow at the mobile viewport
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
