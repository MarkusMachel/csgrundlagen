import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { login } from './helpers';

/** Drags a palette item onto the board at (x, y) from the board's top-left. */
async function drop(page: Page, kind: string, x: number, y: number) {
  const board = page.locator('.design-canvas');
  await page
    .getByRole('button', { name: `Add ${kind}` })
    .dragTo(board, { targetPosition: { x, y } });
}

/** Draws an arrow from one component's right edge to another's left edge. */
async function arrow(page: Page, from: Locator, to: Locator) {
  const source = from.locator('.react-flow__handle.source');
  const target = to.locator('.react-flow__handle.target');
  // both ends must be on screen: bring the whole board into view
  await page.locator('.design-canvas').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const a = (await source.boundingBox())!;
  const b = (await target.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
}

test('draw a design with the mouse, check it, compare with the reference', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'System design' }).click();
  await page.getByRole('link', { name: /rate limiting for a public API/ }).click();

  await drop(page, 'Client', 80, 200);
  await drop(page, 'API gateway', 300, 200);
  await drop(page, 'Service', 520, 120);
  await drop(page, 'Service', 520, 300);
  const nodes = page.locator('.react-flow__node');
  await expect(nodes).toHaveCount(4);

  // lay it out and let the view settle, so the edges stay put while drawing
  await page.getByRole('button', { name: 'Tidy up' }).click();
  await page.waitForTimeout(500);
  const node = (name: string, n = 0) => nodes.filter({ hasText: name }).nth(n);
  await arrow(page, node('Client'), node('API gateway'));
  await arrow(page, node('API gateway'), node('Service', 0));
  await arrow(page, node('API gateway'), node('Service', 1));
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);

  await page.getByRole('button', { name: 'Check my design' }).click();
  const results = page.getByTestId('design-results');
  // everything but the shared counter store
  await expect(results.getByRole('status')).toHaveText('3 of 4 required checks pass.');
  await expect(
    results.locator('li', { hasText: 'The limiter keeps its counters in a shared cache' }),
  ).toContainText('Missing');

  // the checked board (results, marked arrows) passes the accessibility audit
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(audit.violations.map((v) => v.id)).toEqual([]);

  // add the cache from the keyboard-friendly list instead
  await page.getByRole('button', { name: 'Add Cache' }).click();
  await page.getByLabel('From', { exact: true }).selectOption({ label: 'API gateway' });
  await page.getByLabel('To', { exact: true }).selectOption({ label: 'Cache' });
  await page.getByRole('button', { name: 'Add arrow' }).click();
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByText('Every requirement is covered. Nice work!')).toBeVisible();

  await page.getByRole('button', { name: 'Reference design' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
});
