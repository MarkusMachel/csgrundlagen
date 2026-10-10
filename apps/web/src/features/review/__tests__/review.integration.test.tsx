import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { ProgressPage } from '@/pages/ProgressPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { loginAsDemo, loginAsRegularUser, renderWithProviders } from '@/test-utils';

/** Picks the correct option of whatever card is showing, then submits. */
async function answerCorrectly(user: ReturnType<typeof userEvent.setup>, questionId: string) {
  const q = db.questions.find((s) => s.question.id === questionId)!.question;
  if (q.type === 'multiple-choice') {
    const label = q.options.find((o) => o.id === q.correctOptionId)!.label;
    await user.click(screen.getByRole('radio', { name: label }));
  } else if (q.type === 'true-false') {
    await user.click(screen.getByRole('radio', { name: q.correctAnswer ? 'True' : 'False' }));
  } else {
    throw new Error(`answerCorrectly doesn't handle ${q.type} questions`);
  }
  await user.click(screen.getByRole('button', { name: 'Submit answer' }));
}

describe('review session (integration)', () => {
  it('works through due questions one at a time and reschedules them', async () => {
    loginAsDemo(); // seeded: q5 and q12 are due, q22 is scheduled for later
    const user = userEvent.setup();
    renderWithProviders(<ReviewPage />);

    expect(await screen.findByText('Question 1 of 2')).toBeInTheDocument();
    await answerCorrectly(user, 'q5');
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent(/next review tomorrow/);
    expect(Date.parse(db.reviews['u1:q5'].dueAt)).toBeGreaterThan(Date.now() + 23 * 3600_000);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Question 2 of 2')).toBeInTheDocument();
    await answerCorrectly(user, 'q12');
    await user.click(await screen.findByRole('button', { name: 'Finish' }));

    expect(await screen.findByText('Session complete')).toBeInTheDocument();
    expect(screen.getByText(/2 of 2 correct/)).toBeInTheDocument();
  });

  it('offers new questions when nothing is due', async () => {
    loginAsRegularUser(); // no history at all
    const user = userEvent.setup();
    renderWithProviders(<ReviewPage />);
    expect(await screen.findByText('Nothing to review right now')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Learn 10 new questions' }));
    expect(await screen.findByText('Question 1 of 10')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });
});

describe('progress page (integration)', () => {
  it('shows coverage, accuracy, due reviews and per-topic progress', async () => {
    loginAsDemo();
    renderWithProviders(<ProgressPage />);
    expect(await screen.findByText(`3 / ${db.questions.length}`)).toBeInTheDocument(); // q5, q12, q22 seen
    expect(screen.getByText('33%')).toBeInTheDocument(); // 1 of 3 logged answers correct
    expect(screen.getByRole('link', { name: 'Start reviewing' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(2));
    expect(screen.getByRole('columnheader', { name: 'Topic' })).toBeInTheDocument();
  });
});
