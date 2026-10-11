import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';

import { AuthModal } from '@/features/auth';
import type { DesignQuestion } from '@/features/questions';
import { db } from '@/mocks/db';
import { useAuthPrompt } from '@/stores/useAuthPrompt';
import { useAuthStore } from '@/stores/useAuthStore';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { DesignChallenge } from '..';

// React Flow measures with ResizeObserver, which jsdom doesn't have.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const shortener = () =>
  db.questions.find((s) => s.question.id === 'q-sd-1')!.question as DesignQuestion;

async function build(user: ReturnType<typeof userEvent.setup>, kinds: string[]) {
  for (const k of kinds) await user.click(screen.getByRole('button', { name: `Add ${k}` }));
}
async function arrow(user: ReturnType<typeof userEvent.setup>, from: string, to: string) {
  const pick = (label: string, name: string) =>
    user.selectOptions(
      screen.getByLabelText(label),
      within(screen.getByLabelText(label)).getByRole('option', { name }),
    );
  await pick('From', from);
  await pick('To', to);
  await user.click(screen.getByRole('button', { name: 'Add arrow' }));
}

describe('system design challenge (integration)', () => {
  it('checks a design and explains what is missing, then passes once fixed', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<DesignChallenge question={shortener()} />);

    await build(user, ['Client', 'Load balancer', 'Service', 'Service', 'NoSQL database']);
    await arrow(user, 'Client', 'Load balancer');
    await arrow(user, 'Load balancer', 'Service (service-1)');
    await arrow(user, 'Load balancer', 'Service (service-2)');
    await arrow(user, 'Service (service-1)', 'NoSQL database');
    await user.click(screen.getByRole('button', { name: 'Check my design' }));

    const results = await screen.findByTestId('design-results');
    expect(within(results).getByRole('status')).toHaveTextContent('4 of 5 required checks pass.');
    const cacheRule = within(results)
      .getByText('The service checks a cache before the database')
      .closest('li')!;
    expect(cacheRule).toHaveTextContent('Missing');
    expect(within(cacheRule).getByRole('link', { name: 'Cache-Aside pattern' })).toHaveAttribute(
      'href',
      'https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside',
    );
    // the answer was recorded like any other
    expect(db.answerLog.some((a) => a.questionId === 'q-sd-1' && a.correct === false)).toBe(true);

    // editing makes the result stale; adding the cache fixes it
    await build(user, ['Cache']);
    expect(screen.queryByTestId('design-results')).not.toBeInTheDocument();
    expect(screen.getByText('Changed since the last check.')).toBeInTheDocument();
    await arrow(user, 'Service (service-1)', 'Cache');
    await user.click(screen.getByRole('button', { name: 'Check again' }));
    expect(await screen.findByText('Every requirement is covered. Nice work!')).toBeInTheDocument();
    expect(db.answerLog.some((a) => a.questionId === 'q-sd-1' && a.correct)).toBe(true);

    // the reference design can be compared now
    await user.click(screen.getByRole('button', { name: 'Reference design' }));
    expect(screen.getByText(/A load balancer in front of two or more/)).toBeInTheDocument();
  });

  it('builds with real products found by searching the palette', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<DesignChallenge question={shortener()} />);
    const search = screen.getByRole('searchbox', { name: 'Search components…' });
    // searching by kind finds every vendor's product of that kind
    await user.type(search, 'cache');
    expect(screen.getByRole('button', { name: 'Add Redis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add ElastiCache' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Apache Kafka' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Redis' }));
    await user.clear(search);
    await user.type(search, 'Kubernetes');
    await user.click(screen.getByRole('button', { name: 'Add Kubernetes' }));
    await arrow(user, 'Kubernetes', 'Redis');
    await user.click(screen.getByRole('button', { name: 'Check my design' }));

    // Redis counts as the cache the rule asks for
    const results = await screen.findByTestId('design-results');
    const cacheRule = within(results)
      .getByText('The service checks a cache before the database')
      .closest('li')!;
    expect(cacheRule).toHaveTextContent('Passed');
  });

  it('keeps the board in this browser between visits', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<DesignChallenge question={shortener()} />);
    await build(user, ['Client', 'Cache']);
    await user.type(screen.getByRole('textbox', { name: 'Name for Cache' }), 'Redis');
    unmount();
    renderWithProviders(<DesignChallenge question={shortener()} />);
    expect(screen.getByRole('textbox', { name: 'Name for Client' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Redis')).toBeInTheDocument();
  });

  it('signed out, checking asks to log in and then checks the same design', async () => {
    useAuthStore.setState({ user: null, status: 'anonymous' });
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DesignChallenge question={shortener()} />
        <AuthModal />
      </>,
    );
    await build(user, ['Client', 'Service']);
    await user.click(screen.getByRole('button', { name: 'Check my design' }));
    const dialog = await screen.findByRole('dialog', { name: /log in to continue/i });
    await user.type(within(dialog).getByLabelText('Email'), 'ada@example.com');
    await user.type(within(dialog).getByLabelText('Password'), 'password');
    await user.click(within(dialog).getByRole('button', { name: 'Log in' }));
    expect(await screen.findByTestId('design-results')).toBeInTheDocument();
    useAuthPrompt.getState().cancel();
  });
});
