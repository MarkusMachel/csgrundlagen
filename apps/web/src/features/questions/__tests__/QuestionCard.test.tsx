import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { QuestionCard } from '../components/QuestionCard';
import type { Question } from '../types';

const mcq: Question = {
  id: 'q1',
  type: 'multiple-choice',
  prompt: 'Which OSI layer is responsible for end-to-end reliable delivery of data?',
  tags: ['Networking'],
  explanation: 'The transport layer.',
  options: [
    { id: 'A', label: 'Network layer' },
    { id: 'B', label: 'Transport layer' },
    { id: 'C', label: 'Session layer' },
    { id: 'D', label: 'Data link layer' },
    { id: 'E', label: 'Physical layer' },
  ],
  correctOptionId: 'B',
};

const twoOption: Question = {
  ...mcq,
  id: 'q1b',
  options: mcq.options.slice(0, 2),
};

describe('QuestionCard', () => {
  it('renders options as array entries, indexed for 5 and for 2 options', () => {
    loginAsDemo();
    const { unmount } = renderWithProviders(<QuestionCard question={mcq} mode="feed" />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    [0, 1, 2, 3, 4].forEach((i) => {
      expect(screen.getByText(`options[${i}]`)).toBeInTheDocument();
    });
    unmount();

    renderWithProviders(<QuestionCard question={twoOption} mode="feed" />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.queryByText('options[2]')).not.toBeInTheDocument();
  });

  it('enforces single-select among options', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={mcq} mode="feed" />);
    await user.click(screen.getByRole('radio', { name: 'Network layer' }));
    await user.click(screen.getByRole('radio', { name: 'Transport layer' }));
    expect(screen.getByRole('radio', { name: 'Transport layer' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Network layer' })).not.toBeChecked();
  });

  it('scissors strike-through does not clear the selected answer', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={mcq} mode="feed" />);
    await user.click(screen.getByRole('radio', { name: 'Transport layer' }));
    await user.click(screen.getByRole('button', { name: 'Strike out option B' }));
    expect(screen.getByRole('radio', { name: 'Transport layer' })).toBeChecked();
    // and it toggles back
    await user.click(screen.getByRole('button', { name: 'Restore option B' }));
    expect(screen.getByRole('button', { name: 'Strike out option B' })).toBeInTheDocument();
  });

  it('shows a submit button in feed mode but not in test mode', () => {
    loginAsDemo();
    const { unmount } = renderWithProviders(<QuestionCard question={mcq} mode="feed" />);
    expect(screen.getByRole('button', { name: 'Submit answer' })).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <QuestionCard question={mcq} mode="test" testMode="practice" onChange={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Submit answer' })).not.toBeInTheDocument();
  });

  it('hides scissors and revealing tabs in exam mode, keeps notes available', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(
      <QuestionCard question={mcq} mode="test" testMode="exam" onChange={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /Strike out/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Commented Answer', expanded: false }));
    expect(screen.queryByRole('tab', { name: 'Commented Answer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Stats' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Comments' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My Notes' })).toBeInTheDocument();
  });

  it('shows scissors and all tabs in practice test mode', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(
      <QuestionCard question={mcq} mode="test" testMode="practice" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Strike out option A' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Commented Answer', expanded: false }));
    expect(screen.getByRole('tab', { name: 'Commented Answer' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Stats' })).toBeInTheDocument();
  });

  it('shows the bookmark toggle in feed mode but not in test/review modes', () => {
    loginAsDemo();
    const { unmount } = renderWithProviders(<QuestionCard question={mcq} mode="feed" />);
    expect(screen.getByRole('button', { name: 'Bookmark this question' })).toBeInTheDocument();
    unmount();

    renderWithProviders(<QuestionCard question={mcq} mode="review" reviewGivenAnswer="A" />);
    expect(
      screen.queryByRole('button', { name: 'Bookmark this question' }),
    ).not.toBeInTheDocument();
  });

  it('review mode disables inputs and reveals correctness', () => {
    loginAsDemo();
    renderWithProviders(<QuestionCard question={mcq} mode="review" reviewGivenAnswer="A" />);
    const card = screen.getByTestId('question-card-q1');
    within(card)
      .getAllByRole('radio')
      .forEach((radio) => expect(radio).toBeDisabled());
  });
});
