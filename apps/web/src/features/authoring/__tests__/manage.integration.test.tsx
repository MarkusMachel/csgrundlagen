import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AdminPage } from '@/pages/AdminPage';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

const firstPrompt = () => db.questions[0].question.prompt;

describe('admin content management (integration)', () => {
  it('edits a question in place', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />, { route: '/admin' });
    await user.click(screen.getByRole('tab', { name: 'Questions' }));

    const target = db.questions[0].question;
    await user.type(screen.getByRole('searchbox'), target.prompt.slice(0, 25));
    await user.click(await screen.findByRole('button', { name: `Edit ${target.prompt}` }));

    const prompt = await screen.findByLabelText('Prompt');
    expect(prompt).toHaveValue(target.prompt);
    await user.clear(prompt);
    await user.type(prompt, 'An edited prompt?');
    await user.click(screen.getByRole('button', { name: /Save changes/ }));

    await waitFor(() => expect(firstPrompt()).toBe('An edited prompt?'));
    expect(db.questions[0].question.id).toBe(target.id); // same question, not a new one
    // back to the list once saved
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('deletes a question only after confirming', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />, { route: '/admin' });
    await user.click(screen.getByRole('tab', { name: 'Questions' }));
    const target = db.questions[0].question;
    const before = db.questions.length;
    await user.type(screen.getByRole('searchbox'), target.prompt.slice(0, 25));

    await user.click(await screen.findByRole('button', { name: `Delete ${target.prompt}` }));
    expect(db.questions).toHaveLength(before); // first click only asks
    await user.click(screen.getByRole('button', { name: 'Delete for good?' }));
    await waitFor(() => expect(db.questions).toHaveLength(before - 1));
    expect(db.questions.some((s) => s.question.id === target.id)).toBe(false);
  });

  it('works through the bug-report queue', async () => {
    loginAsDemo();
    db.bugReports.push({
      id: 'b1',
      questionId: db.questions[0].question.id,
      userId: 'u2',
      message: 'Option C has a typo',
      createdAt: new Date().toISOString(),
      status: 'open',
    });
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />, { route: '/admin' });

    const tab = await screen.findByRole('tab', { name: /Bug reports/ });
    await waitFor(() => expect(within(tab).getByText('1')).toBeInTheDocument()); // open-count badge
    await user.click(tab);
    expect(await screen.findByText('“Option C has a typo”')).toBeInTheDocument();
    expect(screen.getByText(/reported by Ada Lovelace/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(db.bugReports[0].status).toBe('closed'));
    expect(await screen.findByText('No reports here.')).toBeInTheDocument(); // gone from "Open"

    await user.click(screen.getByRole('button', { name: 'Closed' }));
    await user.click(await screen.findByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(db.bugReports[0].status).toBe('open'));
  });
});
