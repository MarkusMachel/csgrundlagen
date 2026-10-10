import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { QuestionCard, type Question } from '@/features/questions';
import { db } from '@/mocks/db';
import { useAuthPrompt } from '@/stores/useAuthPrompt';
import { useAuthStore } from '@/stores/useAuthStore';
import { renderWithProviders } from '@/test-utils';

import { AuthModal, RequireSignIn } from '..';

const question: Question = {
  id: 'q1',
  type: 'multiple-choice',
  prompt: 'Which OSI layer is responsible for end-to-end reliable delivery of data?',
  tags: ['Networking'],
  explanation: 'The transport layer.',
  options: [
    { id: 'A', label: 'Network layer' },
    { id: 'B', label: 'Transport layer' },
  ],
  correctOptionId: 'B',
};

async function answer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /Transport layer/ }));
  await user.click(screen.getByRole('button', { name: 'Submit answer' }));
}

describe('signed-out browsing', () => {
  beforeEach(() => useAuthStore.setState({ user: null, status: 'anonymous' }));
  afterEach(() => useAuthPrompt.getState().cancel());

  it('asks to sign in when answering, then submits the answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <QuestionCard question={question} mode="feed" />
        <AuthModal />
      </>,
    );
    await answer(user);

    const dialog = await screen.findByRole('dialog', { name: /log in to continue/i });
    expect(screen.queryByTestId('answer-feedback')).not.toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Email'), 'ada@example.com');
    await user.type(within(dialog).getByLabelText('Password'), 'password');
    await user.click(within(dialog).getByRole('button', { name: 'Log in' }));

    // the answer went through as soon as they were signed in
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Correct!');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useAuthStore.getState().user?.id).toBe('u2');
    expect(db.userQuestionStats.some((s) => s.userId === 'u2' && s.questionId === 'q1')).toBe(true);
  });

  it('closing the prompt leaves the question unanswered', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <QuestionCard question={question} mode="feed" />
        <AuthModal />
      </>,
    );
    await answer(user);
    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByTestId('answer-feedback')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit answer' })).toBeEnabled();
  });

  it('can switch to creating an account in the prompt', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <QuestionCard question={question} mode="feed" />
        <AuthModal />
      </>,
    );
    await answer(user);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Create an account' }));

    expect(await screen.findByRole('dialog', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('personal pages explain themselves and open the prompt', async () => {
    renderWithProviders(
      <>
        <Routes>
          <Route
            path="/progress"
            element={
              <RequireSignIn>
                <p>my progress</p>
              </RequireSignIn>
            }
          />
        </Routes>
        <AuthModal />
      </>,
      { route: '/progress' },
    );
    expect(await screen.findByText(/this page is yours once you log in/i)).toBeInTheDocument();
    expect(screen.queryByText('my progress')).not.toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: /log in to continue/i })).toBeInTheDocument();

    // signing in elsewhere shows the page in place
    useAuthStore.setState({
      user: { id: 'u2', name: 'Ada', email: 'ada@example.com', locale: 'en', role: 'user' },
      status: 'authenticated',
    });
    expect(await screen.findByText('my progress')).toBeInTheDocument();
  });
});
