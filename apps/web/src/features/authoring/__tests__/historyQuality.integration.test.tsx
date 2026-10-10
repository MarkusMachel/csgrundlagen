import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AdminPage } from '@/pages/AdminPage';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

const q1 = () => db.questions.find((s) => s.question.id === 'q1')!.question;

describe('question history (integration)', () => {
  it('records edits and restores an earlier version', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);
    await user.click(screen.getByRole('tab', { name: 'Questions' }));
    const original = q1().prompt;
    await user.type(screen.getByRole('searchbox'), 'end-to-end reliable');

    const row = (await screen.findByText(original.split('\n')[0])).closest('li')!;
    await user.click(within(row).getByRole('button', { name: /Edit/ }));
    const prompt = await screen.findByLabelText(/^Prompt/);
    await user.clear(prompt);
    await user.type(prompt, 'A reworded prompt');
    await user.click(screen.getByRole('button', { name: /Save changes/ }));
    await waitFor(() => expect(q1().prompt).toBe('A reworded prompt'));

    // back on the list: open it again and look at the history
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'reworded');
    const edited = (await screen.findByText('A reworded prompt')).closest('li')!;
    await user.click(within(edited).getByRole('button', { name: /Edit/ }));
    await user.click(await screen.findByRole('button', { name: /History/ }));
    const history = await screen.findByRole('list', { name: 'History' });
    expect(within(history).getByText(/Before history began/)).toBeInTheDocument();
    expect(within(history).getByText(/changed prompt/)).toBeInTheDocument();

    await user.click(within(history).getByRole('button', { name: 'Restore' }));
    await user.click(within(history).getByRole('button', { name: 'Restore this version?' }));
    await waitFor(() => expect(q1().prompt).toBe(original));
    // back in the form, showing the restored text
    expect(await screen.findByLabelText(/^Prompt/)).toHaveValue(original);
  });
});

describe('question quality report (integration)', () => {
  it('flags a probably wrong answer key first, with the option picks', async () => {
    loginAsDemo();
    const q = q1();
    if (q.type !== 'multiple-choice') throw new Error('q1 should be multiple choice');
    const wrong = q.options.find((o) => o.id !== q.correctOptionId)!;
    db.answerCounts.q1 = Object.fromEntries(q.options.map((o) => [o.id, 2]));
    db.answerCounts.q1[q.correctOptionId] = 10;
    db.answerCounts.q1[wrong.id] = 30;

    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);
    await user.click(screen.getByRole('tab', { name: 'Quality' }));

    const first = (await screen.findAllByRole('listitem')).find((li) =>
      li.querySelector('.admin-list__title'),
    )!;
    expect(first).toHaveTextContent(q.prompt.split('\n')[0]);
    expect(within(first).getByText('Wrong key?')).toBeInTheDocument();
    expect(within(first).getByRole('list', { name: /How often each option/ })).toHaveTextContent(
      '%',
    );

    await user.click(screen.getByRole('button', { name: /^Wrong key\? ·/ }));
    expect(screen.getByText(/check the answer key/)).toBeInTheDocument();
  });
});
