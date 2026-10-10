import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { BuildTestPage } from '@/pages/BuildTestPage';
import { MyTestsPage } from '@/pages/MyTestsPage';
import { TakeTestPage } from '@/pages/TakeTestPage';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { useTestAttemptStore } from '../hooks/useTestAttempt';
import { useTestBuilderStore } from '../hooks/useTestBuilder';

function seedTest(questionIds: string[], overrides: Partial<(typeof db.tests)[number]> = {}) {
  const test = {
    id: 'seeded-test',
    ownerId: 'u1',
    name: 'Networking basics',
    questionIds,
    timed: false,
    shuffleQuestions: false,
    shuffleOptions: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  db.tests.push(test);
  return test;
}

function renderTakeTest(testId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/tests/:id/take" element={<TakeTestPage />} />
    </Routes>,
    { route: `/tests/${testId}/take` },
  );
}

beforeEach(() => {
  useTestBuilderStore.setState({ selectedQuestionIds: [] });
  useTestAttemptStore.getState().reset();
});

describe('building a test (integration)', () => {
  it('picks questions, names the test, saves it, and it appears in My Tests', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<BuildTestPage />);

    await screen.findByTestId('question-feed');
    const checkboxes = screen.getAllByRole('checkbox', { name: 'Add to test' });
    for (const box of checkboxes.slice(0, 3)) {
      await user.click(box);
    }
    const tray = screen.getByTestId('test-builder-tray');
    expect(within(tray).getByText(/Selected questions \(3\)/)).toBeInTheDocument();

    await user.type(within(tray).getByLabelText(/Test name/), 'My first test');
    await user.click(within(tray).getByLabelText('Timed'));
    await user.click(within(tray).getByRole('button', { name: 'Save Test' }));

    await waitFor(() => expect(db.tests).toHaveLength(1));
    expect(db.tests[0]).toMatchObject({
      name: 'My first test',
      timed: true,
      durationMinutes: 15,
    });
    expect(db.tests[0].questionIds).toHaveLength(3);
    unmount();

    renderWithProviders(<MyTestsPage />);
    expect(await screen.findByText('My first test')).toBeInTheDocument();
    expect(screen.getByText('3 questions')).toBeInTheDocument();
    expect(screen.getByText(/Timed · 15 min/)).toBeInTheDocument();
  });
});

describe('taking a test in Exam mode (integration)', () => {
  it('hides aids until submit, then shows results with retry-incorrect', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    seedTest(['q1', 'q2']); // q1: MC correct B; q2: TF correct false
    renderTakeTest('seeded-test');

    await user.click(await screen.findByRole('button', { name: /Exam/ }));
    await user.click(screen.getByRole('button', { name: 'Start' }));

    // exam: no scissors, no per-question submit
    await screen.findByTestId('question-card-q1');
    expect(screen.queryByRole('button', { name: /Strike out/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit answer' })).not.toBeInTheDocument();

    // answer q1 correctly, q2 wrong
    const cardQ1 = screen.getByTestId('question-card-q1');
    await user.click(within(cardQ1).getByRole('radio', { name: /Transport layer/ }));
    const cardQ2 = screen.getByTestId('question-card-q2');
    await user.click(within(cardQ2).getByRole('radio', { name: 'True' }));

    await user.click(screen.getByTestId('submit-test'));

    const results = await screen.findByTestId('results-screen');
    expect(results).toHaveTextContent('You scored 1 of 2');
    // review cards reveal correctness now
    expect(db.attempts).toHaveLength(1);
    expect(db.attempts[0]).toMatchObject({ mode: 'exam', score: 1 });

    // Retry Incorrect Only starts a fresh attempt scoped to the wrong question
    await user.click(screen.getByRole('button', { name: 'Retry Incorrect Only' }));
    await screen.findByTestId('question-card-q2');
    expect(screen.queryByTestId('question-card-q1')).not.toBeInTheDocument();
  });
});

describe('taking a test in Practice mode (integration)', () => {
  it('keeps scissors and tabs available during the attempt', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    seedTest(['q1']);
    renderTakeTest('seeded-test');

    await user.click(await screen.findByRole('button', { name: /Practice/ }));
    await user.click(screen.getByRole('button', { name: 'Start' }));

    await screen.findByTestId('question-card-q1');
    expect(screen.getByRole('button', { name: 'Strike out option A' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Commented Answer' }));
    expect(await screen.findByRole('tab', { name: 'Commented Answer' })).toBeInTheDocument();
  });
});

describe('attempt history (integration)', () => {
  it('lists past attempts with score and mode', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const test = seedTest(['q1', 'q2']);
    db.attempts.push({
      id: 'att-1',
      testId: test.id,
      userId: 'u1',
      mode: 'exam',
      answers: { q1: 'B', q2: true },
      score: 1,
      startedAt: '2026-09-05T10:00:00.000Z',
      submittedAt: '2026-09-05T10:20:00.000Z',
    });

    renderWithProviders(<MyTestsPage />);
    await user.click(await screen.findByRole('button', { name: /Attempt history/ }));
    const table = await screen.findByTestId('attempt-history');
    expect(within(table).getByText('Exam')).toBeInTheDocument();
    expect(within(table).getByText('1')).toBeInTheDocument();
  });
});

describe('resuming an unfinished test (integration)', () => {
  it('saves answers as you go; leaving and coming back resumes them, and submitting clears the draft', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    seedTest(['q1', 'q2']);
    const first = renderTakeTest('seeded-test');

    await user.click(await screen.findByRole('button', { name: /Exam/ }));
    await user.click(screen.getByRole('button', { name: 'Start' }));
    const cardQ1 = await screen.findByTestId('question-card-q1');
    await user.click(within(cardQ1).getByRole('radio', { name: /Transport layer/ }));
    await waitFor(() => expect(db.drafts['seeded-test:u1']?.answers).toEqual({ q1: 'B' }));

    // close the tab: the in-memory attempt is gone
    first.unmount();
    useTestAttemptStore.getState().reset();

    renderWithProviders(<MyTestsPage />);
    expect(
      await screen.findByRole('button', { name: 'Resume (1/2 answered)' }),
    ).toBeInTheDocument();

    renderTakeTest('seeded-test');
    expect(await screen.findByText('You have an unfinished attempt')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const resumed = await screen.findByTestId('question-card-q1');
    expect(within(resumed).getByRole('radio', { name: /Transport layer/ })).toBeChecked();

    await user.click(screen.getByTestId('submit-test'));
    await screen.findByTestId('results-screen');
    expect(db.drafts['seeded-test:u1']).toBeUndefined();
  });

  it('"start over" discards the draft', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    seedTest(['q1']);
    db.drafts['seeded-test:u1'] = {
      mode: 'practice',
      answers: { q1: 'A' },
      shuffleSeed: 7,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    renderTakeTest('seeded-test');
    await user.click(await screen.findByRole('button', { name: 'Discard and start over' }));
    expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(db.drafts['seeded-test:u1']).toBeUndefined();
  });
});
