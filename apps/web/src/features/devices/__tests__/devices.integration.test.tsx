import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPage } from '@/pages/AdminPage';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

describe('signed-in devices (integration)', () => {
  it('lists my devices with parsed browser details and signs one out', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    const laptop = (await screen.findByText('Chrome 129 on macOS 10.15')).closest('li')!;
    expect(within(laptop).getByText('This device')).toBeInTheDocument();
    expect(within(laptop).getByText('Europe/Berlin')).toBeInTheDocument();
    const phone = screen.getByText('Safari 18.0 on iOS 18.0').closest('li')!;
    expect(within(phone).getByText(/IP 198\.51\.100\.40/)).toBeInTheDocument();

    await user.click(within(phone).getByRole('button', { name: 'Sign out' }));
    await waitFor(() =>
      expect(screen.queryByText('Safari 18.0 on iOS 18.0')).not.toBeInTheDocument(),
    );
    expect(db.sessions.some((s) => s.id === 's-u1-phone')).toBe(false);
    expect(screen.queryByRole('button', { name: /other device/ })).not.toBeInTheDocument();
  });
});

describe('admin users tab (integration)', () => {
  it('shows every user, their devices and sign-in history, and signs them out', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);
    await user.click(screen.getByRole('tab', { name: 'Users' }));

    const ada = (await screen.findByText('ada@example.com')).closest('tr')!;
    expect(within(ada).getByText('1 session')).toBeInTheDocument();
    const demo = screen.getByText('demo@example.com').closest('tr')!;
    expect(within(demo).getByText('2 sessions')).toBeInTheDocument();
    expect(within(demo).getByText('1 failed')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'grace');
    expect(screen.queryByText('ada@example.com')).not.toBeInTheDocument();
    await user.clear(screen.getByRole('searchbox'));

    await user.click(screen.getByRole('button', { name: 'View Ada Lovelace' }));
    expect(await screen.findAllByText('Firefox 131 on Windows 10/11')).toHaveLength(2); // device + history
    expect(screen.getByText('Created account')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
    expect(await screen.findByText('Not signed in anywhere.')).toBeInTheDocument();
    expect(db.sessions.some((s) => s.userId === 'u2')).toBe(false);
  });
});

describe('admin account management (integration)', () => {
  it('promotes, blocks, unblocks and deletes an account, never yourself', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);
    await user.click(screen.getByRole('tab', { name: 'Users' }));

    // own account: no management controls
    await user.click(await screen.findByRole('button', { name: 'View Demo User' }));
    expect(await screen.findByText('Demo User')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Block' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All users' }));

    await user.click(await screen.findByRole('button', { name: 'View Ada Lovelace' }));
    await user.click(await screen.findByRole('button', { name: 'Make admin' }));
    await waitFor(() => expect(db.users.find((u) => u.id === 'u2')!.role).toBe('admin'));
    expect(await screen.findByRole('button', { name: 'Make member' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Block' }));
    expect(await screen.findByText(/Blocked since/)).toBeInTheDocument();
    expect(db.sessions.some((s) => s.userId === 'u2')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Unblock' }));
    await waitFor(() => expect(screen.queryByText(/Blocked since/)).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Delete Ada Lovelace' }));
    await user.click(screen.getByRole('button', { name: /Delete for good/ }));
    await waitFor(() => expect(db.users.some((u) => u.id === 'u2')).toBe(false));
    expect(await screen.findByText('demo@example.com')).toBeInTheDocument(); // back on the list
  });
});
