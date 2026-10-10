import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PRIVACY_POLICY_VERSION } from '@/features/privacy/consent';
import { db } from '@/mocks/db';
import { HomePage } from '@/pages/HomePage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

function loginAsNewUser() {
  const user = {
    id: 'u-new',
    name: 'New Person',
    email: 'new@example.com',
    locale: 'en' as const,
    role: 'user' as const,
  };
  db.users.push({ ...user, password: 'password', privacyVersion: PRIVACY_POLICY_VERSION });
  db.sessions.push({
    id: 's-u-new',
    userId: 'u-new',
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400_000).toISOString(),
  });
  document.cookie = 'cft_session=mock-token.u-new; path=/';
  useAuthStore.setState({ user, status: 'authenticated' });
}

describe('getting started panel', () => {
  it('greets a new user and filters the feed by a picked topic', async () => {
    loginAsNewUser();
    useUIStore.setState({ welcomeHidden: false });
    const user = userEvent.setup();
    renderWithProviders(<HomePage />);

    const panel = await screen.findByTestId('welcome-panel');
    const before = (await screen.findByText(/^\d+ questions$/)).textContent;
    const topic = within(panel)
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('·'))!;
    const tag = topic.textContent!.split('·')[0].trim();
    await user.click(topic);

    await waitFor(() => expect(screen.getByText(/^\d+ questions?$/).textContent).not.toBe(before));
    expect(
      screen.getByRole('button', { name: new RegExp(`^${tag}`), pressed: true }),
    ).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: 'Hide for now' }));
    expect(screen.queryByTestId('welcome-panel')).not.toBeInTheDocument();
  });

  it('stays away for users who have answered before', async () => {
    loginAsDemo();
    useUIStore.setState({ welcomeHidden: false });
    renderWithProviders(<HomePage />);
    await screen.findByText(/^\d+ questions$/);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId('welcome-panel')).not.toBeInTheDocument();
  });
});
