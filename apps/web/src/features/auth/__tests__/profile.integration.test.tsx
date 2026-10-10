import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AccountPage } from '@/pages/AccountPage';
import { ConfirmEmailPage } from '@/pages/ConfirmEmailPage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { loginAsRegularUser, renderWithProviders } from '@/test-utils';

describe('profile (integration)', () => {
  it('saves name and language to the account', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />, { route: '/account' });

    const save = screen.getByRole('button', { name: 'Save profile' });
    expect(save).toBeDisabled(); // nothing changed yet
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Ada King');
    await user.click(screen.getByRole('button', { name: /^Language/ }));
    await user.click(screen.getByRole('option', { name: 'Deutsch' }));
    await user.click(save);

    await waitFor(() =>
      expect(db.users.find((u) => u.id === 'u2')).toMatchObject({ name: 'Ada King', locale: 'de' }),
    );
    expect(useAuthStore.getState().user?.name).toBe('Ada King');
    expect(useUIStore.getState().locale).toBe('de');
    useUIStore.setState({ locale: 'en' });
  });

  it('changes the email only after the confirmation link', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />, { route: '/account' });

    await user.type(screen.getByLabelText('New email address'), 'ada@new.example');
    await user.type(screen.getByLabelText('Your password, to confirm'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Send confirmation link' }));
    expect(await screen.findByText('password is incorrect')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Your password, to confirm'));
    await user.type(screen.getByLabelText('Your password, to confirm'), 'password');
    await user.click(screen.getByRole('button', { name: 'Send confirmation link' }));
    expect(await screen.findByText(/We sent a link to ada@new\.example/)).toBeInTheDocument();
    expect(db.users.find((u) => u.id === 'u2')!.email).toBe('ada@example.com');

    const token = Object.keys(db.emailTokens)[0];
    renderWithProviders(<ConfirmEmailPage />, { route: `/confirm-email?token=${token}` });
    expect(await screen.findByText(/your account now uses ada@new\.example/)).toBeInTheDocument();
    expect(db.users.find((u) => u.id === 'u2')!.email).toBe('ada@new.example');
    expect(useAuthStore.getState().user?.email).toBe('ada@new.example');
  });
});
