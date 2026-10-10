import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { HomePage } from '@/pages/HomePage';
import { WeakSpotsPage } from '@/pages/WeakSpotsPage';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { QuestionCard } from '../components/QuestionCard';
import { QuestionFeed } from '../components/QuestionFeed';
import type { Question } from '../types';

const q1: Question = {
  id: 'q1',
  type: 'multiple-choice',
  prompt: 'Which OSI layer is responsible for end-to-end reliable delivery of data?',
  tags: ['Networking', 'OSI Model'],
  explanation:
    'The transport layer (layer 4) provides end-to-end delivery. TCP adds reliability with acknowledgements and retransmission; the network layer only routes packets hop by hop.',
  options: [
    { id: 'A', label: 'Network layer' },
    { id: 'B', label: 'Transport layer' },
    { id: 'C', label: 'Session layer' },
    { id: 'D', label: 'Data link layer' },
  ],
  correctOptionId: 'B',
};

describe('answering in the feed (integration)', () => {
  it('submits an answer, reveals feedback and the explanation', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={q1} mode="feed" />);

    await user.click(screen.getByRole('radio', { name: /Transport layer/ }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));

    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Correct!');

    // expand the tabs — explanation should now be revealed
    await user.click(screen.getByRole('button', { name: 'Commented Answer' }));
    await user.click(await screen.findByRole('tab', { name: 'Commented Answer' }));
    expect(await screen.findByText(/transport layer \(layer 4\)/i)).toBeInTheDocument();

    // and the per-user stat was recorded server-side
    const stat = db.userQuestionStats.find((s) => s.userId === 'u1' && s.questionId === 'q1');
    expect(stat?.lastAnswerCorrect).toBe(true);
  });

  it('updates the answer distribution after submitting', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const before = db.answerCounts.q1.B;
    renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('radio', { name: /Transport layer/ }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    await screen.findByTestId('answer-feedback');
    expect(db.answerCounts.q1.B).toBe(before + 1);
  });
});

describe('Home page (integration)', () => {
  it('shows a Question of the Day card above the paginated feed', async () => {
    loginAsDemo();
    renderWithProviders(<HomePage />);
    const qotd = await screen.findByTestId('question-of-the-day');
    expect(qotd).toHaveTextContent('Question of the Day');
    await waitFor(() => expect(screen.getByTestId('question-feed')).toBeInTheDocument());
    // QotD is rendered with the same answerable Question Component
    expect(qotd.querySelector('[data-testid^="question-card-"]')).not.toBeNull();
  });
});

describe('feed filters (integration)', () => {
  it('narrows by status and difficulty, and clears back to everything', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionFeed mode="feed" />);
    const allText = (await screen.findByText(/^\d+ questions$/)).textContent;

    // the demo user's seeded history has two questions with a wrong answer (q5, q12)
    await user.click(screen.getByRole('button', { name: /^Status/ }));
    await user.click(screen.getByRole('option', { name: 'Got wrong' }));
    expect(await screen.findByText('2 questions')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText(allText!)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'easy' }));
    expect(screen.getByRole('button', { name: 'easy' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => {
      const cards = screen.getAllByTestId(/^question-card-/);
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => expect(card).toHaveTextContent('difficulty: easy'));
    });
  });
});

describe('bookmarks (integration)', () => {
  it('bookmarking in the feed makes the question appear on the Bookmarks page', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('button', { name: 'Bookmark this question' }));
    await waitFor(() => expect(db.bookmarks).toHaveLength(1));
    unmount();

    renderWithProviders(<BookmarksPage />);
    expect(await screen.findByText(q1.prompt)).toBeInTheDocument();
  });

  it('un-bookmarking removes it again', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('button', { name: 'Bookmark this question' }));
    await waitFor(() => expect(db.bookmarks).toHaveLength(1));
    await user.click(await screen.findByRole('button', { name: 'Remove bookmark' }));
    await waitFor(() => expect(db.bookmarks).toHaveLength(0));
  });
});

describe('comments (integration)', () => {
  it('posts a comment and shows it without a reload', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('button', { name: 'Commented Answer' }));
    await user.click(await screen.findByRole('tab', { name: 'Comments' }));

    // seeded comments load first
    expect(await screen.findByText(/Please Do Not Throw Sausage/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Add a comment…'), 'TCP retransmits!');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(await screen.findByText('TCP retransmits!')).toBeInTheDocument();
  });
});

describe('private notes (integration)', () => {
  it('saves on blur and persists across a remount, scoped to the author', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('button', { name: 'Commented Answer' }));
    await user.click(await screen.findByRole('tab', { name: 'My Notes' }));

    const textarea = await screen.findByLabelText('Private note');
    await user.type(textarea, 'remember: layer 4 = transport');
    await user.tab(); // blur triggers save
    await waitFor(() => expect(db.notes).toHaveLength(1));
    expect(db.notes[0]).toMatchObject({ userId: 'u1', questionId: 'q1' });
    unmount();

    renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('button', { name: 'Commented Answer' }));
    await user.click(await screen.findByRole('tab', { name: 'My Notes' }));
    expect(await screen.findByDisplayValue('remember: layer 4 = transport')).toBeInTheDocument();
  });
});

describe('bug reports (integration)', () => {
  it('files a report, confirms, and resets the form', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('button', { name: 'Commented Answer' }));
    await user.click(await screen.findByRole('tab', { name: 'Notify Bug' }));

    const field = await screen.findByPlaceholderText(/Describe what's wrong/);
    await user.type(field, 'Option D is ambiguous');
    await user.click(screen.getByRole('button', { name: 'Report bug' }));

    expect(await screen.findByText('Thanks! Your report was filed.')).toBeInTheDocument();
    expect(field).toHaveValue('');
    expect(db.bugReports).toHaveLength(1);
    expect(db.bugReports[0]).toMatchObject({ questionId: 'q1', status: 'open' });
  });
});

describe('weak spots (integration)', () => {
  it('a question answered wrong shows up in the Weak Spots queue', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<QuestionCard question={q1} mode="feed" />);
    await user.click(screen.getByRole('radio', { name: /Network layer/ })); // wrong
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    await screen.findByTestId('answer-feedback');
    unmount();

    renderWithProviders(<WeakSpotsPage />);
    expect(await screen.findByText(q1.prompt)).toBeInTheDocument();
  });
});
