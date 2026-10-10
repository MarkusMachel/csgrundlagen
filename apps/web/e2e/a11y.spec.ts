import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { answerConsent, login } from './helpers';

// WCAG 2.1 A and AA, the level most accessibility laws point to.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const PAGES = [
  { path: '/', ready: 'question-of-the-day' },
  { path: '/review' },
  { path: '/progress' },
  { path: '/weak-spots' },
  { path: '/bookmarks' },
  { path: '/build', ready: 'question-feed' },
  { path: '/my-tests' },
  { path: '/materials' },
  { path: '/account' },
  { path: '/admin' },
  { path: '/questions/q1' },
];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  // Readable failure: rule, impact, and where.
  return results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    count: v.nodes.length,
  }));
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${theme})`, () => {
    test.use({ colorScheme: theme });

    test('signed-out pages', async ({ page }) => {
      for (const path of ['/login', '/signup', '/forgot-password', '/privacy']) {
        await page.goto(path);
        if (path === '/login') {
          // the banner is part of the page until answered
          expect(await audit(page), `${path} (with consent banner)`).toEqual([]);
          await answerConsent(page);
        }
        await page.waitForLoadState('networkidle');
        expect(await audit(page), path).toEqual([]);
      }
    });

    test('dialogs, tabs and admin screens', async ({ page }) => {
      test.setTimeout(120_000);
      await login(page);
      const states: [string, () => Promise<void>][] = [
        [
          'privacy settings dialog',
          async () => {
            await page.getByRole('button', { name: 'Privacy settings' }).click();
            await page.getByRole('dialog').waitFor();
          },
        ],
        [
          'question tabs open',
          async () => {
            await page.goto('/questions/q1');
            await page.getByRole('button', { name: 'Commented Answer' }).click();
            await page.getByRole('tab', { name: 'Comments' }).click();
            await page
              .getByRole('button', { name: /^Report comment by/ })
              .first()
              .waitFor();
          },
        ],
        [
          'report dialog',
          async () => {
            await page.goto('/questions/q1');
            await page.getByRole('button', { name: 'Commented Answer' }).click();
            await page.getByRole('tab', { name: 'Comments' }).click();
            await page
              .getByRole('button', { name: /^Report comment by/ })
              .first()
              .click();
            await page.getByRole('dialog').waitFor();
          },
        ],
      ];
      for (const tab of ['Stats', 'Quality', 'Questions', 'Bug reports', 'Comments', 'Users']) {
        states.push([
          `admin: ${tab}`,
          async () => {
            await page.goto('/admin');
            await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
            await page.waitForLoadState('networkidle');
          },
        ]);
      }
      for (const [name, open] of states) {
        await page.goto('/');
        await page.getByTestId('question-of-the-day').waitFor();
        await open();
        expect(await audit(page), name).toEqual([]);
      }
    });

    test('signed-in pages', async ({ page }) => {
      test.setTimeout(120_000);
      await login(page);
      for (const { path, ready } of PAGES) {
        await page.goto(path);
        if (ready) await page.getByTestId(ready).first().waitFor();
        await page.waitForLoadState('networkidle');
        expect(await audit(page), path).toEqual([]);
      }
    });
  });
}
