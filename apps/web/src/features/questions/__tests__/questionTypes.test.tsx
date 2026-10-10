import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { db } from '@/mocks/db';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { QuestionCard } from '../components/QuestionCard';
import type { Question } from '../types';

// jsdom has no Web Workers; the real runner is checked in the browser.
vi.mock('@/shared/runner/runCode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/runner/runCode')>()),
  runCode: vi.fn(async () => ({ output: 'A\nB\npromise\ntimeout\n' })),
}));

const seeded = (id: string) => db.questions.find((s) => s.question.id === id)!.question as Question;

describe('pick all that apply', () => {
  it('needs every correct option ticked', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={seeded('q-ms1')} mode="feed" />);
    expect(screen.getByText(/pick all that apply/)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Submit answer' });
    expect(submit).toBeDisabled(); // nothing ticked yet

    await user.click(screen.getByRole('checkbox', { name: '0' }));
    await user.click(screen.getByRole('checkbox', { name: '""' }));
    await user.click(submit);
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Not quite'); // NaN missing
  });

  it('is correct with the full set, in any order', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={seeded('q-ms1')} mode="feed" />);
    for (const name of ['NaN', '0', '""']) await user.click(screen.getByRole('checkbox', { name }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Correct!');
  });
});

describe('ordering', () => {
  it('starts shuffled, moves with buttons, and grades the order', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const q = seeded('q-ord1');
    renderWithProviders(<QuestionCard question={q} mode="feed" />);
    const list = screen.getByRole('list');
    const texts = () =>
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent ?? '');
    expect(texts().join()).not.toBe('steps[0] = "Client sends SYN"'); // not pre-solved

    // Bubble each item to its place: a few "move up" clicks per item.
    const order = [
      'Client sends SYN',
      'Server replies SYN-ACK',
      'Client sends ACK',
      'Data is exchanged',
    ];
    for (let target = 0; target < order.length; target++) {
      for (let i = 0; i < order.length; i++) {
        const at = texts().findIndex((t) => t.includes(`"${order[target]}"`));
        if (at <= target) break;
        await user.click(screen.getByRole('button', { name: `Move “${order[target]}” up` }));
      }
    }
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Correct!');
  });
});

describe('predict the output', () => {
  it('locks Run until the prediction is in, then runs the code', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={seeded('q-out1')} mode="feed" />);
    expect(screen.getByText(/Run unlocks after you answer/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/what does this print/), 'A\nB\ntimeout\npromise');
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Not quite');
    expect(screen.getByText(/expected output/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Run' }));
    const terminal = await screen.findByText(/promise\s+timeout/);
    expect(terminal).toBeInTheDocument();
  });
});
