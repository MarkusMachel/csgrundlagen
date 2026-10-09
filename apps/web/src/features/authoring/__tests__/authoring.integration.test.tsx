import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AdminPage } from '@/pages/AdminPage';
import { ApiError } from '@/shared/api/client';
import { loginAsDemo, loginAsRegularUser, renderWithProviders } from '@/test-utils';

import { useAdminStats, useCreateQuestion } from '../hooks/useAuthoring';

describe('admin content authoring (integration)', () => {
  it('non-admins are redirected away from the admin page', async () => {
    loginAsRegularUser();
    renderWithProviders(
      <>
        <AdminPage />
        <div data-testid="home-fallback" />
      </>,
      { route: '/admin' },
    );
    // AdminPage returns <Navigate to="/">, so its own content never renders
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /Content authoring/i })).not.toBeInTheDocument(),
    );
  });

  it('the mock API rejects a non-admin creating a question with 403', async () => {
    loginAsRegularUser();
    let error: unknown;
    function Probe() {
      const create = useCreateQuestion();
      return (
        <button
          type="button"
          onClick={() =>
            create
              .mutateAsync({
                type: 'true-false',
                prompt: 'x',
                tags: ['t'],
                explanation: 'e',
                correctAnswer: true,
              })
              .catch((e) => {
                error = e;
              })
          }
        >
          go
        </button>
      );
    }
    const user = userEvent.setup();
    renderWithProviders(<Probe />);
    await user.click(screen.getByRole('button', { name: 'go' }));
    await waitFor(() => expect(error).toBeInstanceOf(Error));
    expect((error as ApiError).status).toBe(403);
    // nothing was added
    expect(db.questions.some((s) => s.question.prompt === 'x')).toBe(false);
  });

  it('an admin creates a multiple-choice question and it lands in the pool', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />, { route: '/admin' });
    await user.click(screen.getByRole('tab', { name: /New question/ }));

    await user.type(screen.getByLabelText('Prompt'), 'What does TCP guarantee?');
    const optionInputs = screen.getAllByPlaceholderText('"answer text"');
    await user.type(optionInputs[0], 'Nothing');
    await user.type(optionInputs[1], 'Ordered, reliable delivery');
    // mark option B correct
    await user.click(screen.getAllByLabelText('Mark as the correct answer')[1]);
    await user.type(screen.getByLabelText('Explanation (commented answer)'), 'TCP is reliable.');
    // tag
    const tagInput = screen.getByPlaceholderText('Type a tag and press Enter');
    await user.type(tagInput, 'Networking{Enter}');

    await user.click(screen.getByRole('button', { name: /Create question/ }));

    expect(await screen.findByText('Question created.')).toBeInTheDocument();
    const created = db.questions.find((s) => s.question.prompt === 'What does TCP guarantee?');
    expect(created).toBeDefined();
    expect(created?.question.type).toBe('multiple-choice');
    if (created?.question.type === 'multiple-choice') {
      expect(created.question.correctOptionId).toBe('B');
      expect(created.question.options).toHaveLength(2);
    }
    expect(created?.question.tags).toContain('Networking');
  });

  it('an admin creates material and links it to an existing question, wiring both directions', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />, { route: '/admin' });

    await user.click(screen.getByRole('tab', { name: /New material/ }));

    await user.type(screen.getByLabelText('Title'), 'TCP deep dive');
    await user.type(screen.getByLabelText('URL'), 'https://example.com/tcp');
    await user.type(screen.getByPlaceholderText('Type a tag and press Enter'), 'Networking{Enter}');

    // link to seed question q1
    const linkBox = screen.getByRole('listbox', { name: /Link to questions/ });
    const q1Option = within(linkBox).getByText(/end-to-end reliable delivery/i);
    await user.click(q1Option);

    await user.click(screen.getByRole('button', { name: /Create material/ }));

    expect(await screen.findByText('Material created.')).toBeInTheDocument();
    const created = db.materials.find((m) => m.title === 'TCP deep dive');
    expect(created?.relatedQuestionIds).toContain('q1');
    // the reverse lookup (question -> its materials) now includes it
    const forQ1 = db.materials.filter((m) => m.relatedQuestionIds?.includes('q1'));
    expect(forQ1.some((m) => m.title === 'TCP deep dive')).toBe(true);
  });

  it('linking a new question to an existing material attaches the question id to that material', async () => {
    loginAsDemo();
    const targetMaterial = db.materials[0];
    let created: unknown;
    function Probe() {
      const create = useCreateQuestion();
      return (
        <button
          type="button"
          onClick={() =>
            create
              .mutateAsync({
                type: 'true-false',
                prompt: 'Linked question',
                tags: ['Networking'],
                explanation: 'e',
                correctAnswer: true,
                relatedMaterialIds: [targetMaterial.id],
              })
              .then((q) => {
                created = q;
              })
          }
        >
          go
        </button>
      );
    }
    const user = userEvent.setup();
    renderWithProviders(<Probe />);
    await user.click(screen.getByRole('button', { name: 'go' }));
    await waitFor(() => expect(created).toBeDefined());

    const newId = (created as { id: string }).id;
    const updated = db.materials.find((m) => m.id === targetMaterial.id);
    expect(updated?.relatedQuestionIds).toContain(newId);
  });
});

describe('admin stats (integration)', () => {
  it('shows the Stats tab by default with headline totals and charts', async () => {
    loginAsDemo();
    renderWithProviders(<AdminPage />, { route: '/admin' });

    const panel = await screen.findByTestId('admin-stats-tab');
    // headline tiles reflect the seed data counts
    expect(within(panel).getByText('Questions')).toBeInTheDocument();
    expect(within(panel).getByText(String(db.questions.length))).toBeInTheDocument();
    expect(within(panel).getByText('Material items')).toBeInTheDocument();
    expect(within(panel).getByText(String(db.materials.length))).toBeInTheDocument();

    // charts render with their categorical breakdowns (bar label + legend, hence "all")
    expect(within(panel).getByText('Questions by type')).toBeInTheDocument();
    expect(within(panel).getAllByText('Multiple choice').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('True / False').length).toBeGreaterThan(0);
    expect(within(panel).getByText('Top tags by answers submitted')).toBeInTheDocument();
  });

  it('orders the difficulty chart easy → medium → hard, not alphabetically', async () => {
    loginAsDemo();
    renderWithProviders(<AdminPage />, { route: '/admin' });

    const panel = await screen.findByTestId('admin-stats-tab');
    const chart = within(panel).getByText('Questions by difficulty').closest('.chart-card');
    expect(chart).not.toBeNull();
    const labels = within(chart as HTMLElement)
      .getAllByText(/^(easy|medium|hard)$/)
      .map((el) => el.textContent);
    // bar-row labels only (legend duplicates the same text after)
    expect(labels.slice(0, 3)).toEqual(['easy', 'medium', 'hard']);
  });

  it('reflects a newly created question in the totals after switching back to Stats', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />, { route: '/admin' });

    const before = db.questions.length;
    await user.click(screen.getByRole('tab', { name: /New question/ }));
    await user.click(screen.getByLabelText('True / False'));
    await user.type(screen.getByLabelText('Prompt'), 'Stats refresh check');
    await user.type(
      screen.getByLabelText('Explanation (commented answer)'),
      'Just checking the count.',
    );
    await user.type(screen.getByPlaceholderText('Type a tag and press Enter'), 'Stats{Enter}');
    await user.click(screen.getByRole('button', { name: /Create question/ }));
    await screen.findByText('Question created.');
    expect(db.questions.length).toBe(before + 1);

    await user.click(screen.getByRole('tab', { name: 'Stats' }));
    const panel = await screen.findByTestId('admin-stats-tab');
    expect(within(panel).getByText(String(before + 1))).toBeInTheDocument();
  });

  it('a non-admin gets a 403 from the stats endpoint', async () => {
    loginAsRegularUser();
    let status: number | undefined;
    function Probe() {
      const stats = useAdminStats();
      return (
        <span data-testid="probe-status">
          {stats.isError ? (status = (stats.error as ApiError).status) : 'loading'}
        </span>
      );
    }
    renderWithProviders(<Probe />);
    await waitFor(() => expect(status).toBe(403));
  });
});
