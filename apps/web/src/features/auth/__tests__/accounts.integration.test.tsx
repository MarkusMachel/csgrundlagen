import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AccountPage } from '@/pages/AccountPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { useAuthStore } from '@/stores/useAuthStore';
import { loginAsRegularUser, renderWithProviders } from '@/test-utils';

describe('sign-up (integration)', () => {
  it('creates an account, logs in and lands on home', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/" element={<p>home</p>} />
      </Routes>,
      { route: '/signup' },
    );
    await user.type(screen.getByLabelText('Name'), 'Linus');
    await user.type(screen.getByLabelText('Email'), 'linus@example.com');
    await user.type(screen.getByLabelText('Password'), 'long enough');
    await user.type(screen.getByLabelText('Confirm password'), 'long enough');
    await user.click(screen.getByRole('checkbox', { name: /privacy policy/i }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('home')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toMatchObject({
      email: 'linus@example.com',
      role: 'user',
    });
    expect(db.users.some((u) => u.email === 'linus@example.com')).toBe(true);
  });

  it('validates locally and reports a taken email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpPage />, { route: '/signup' });
    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Use 8 to 72 characters')).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    expect(screen.getByText(/accept the privacy policy/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'long enough');
    await user.clear(screen.getByLabelText('Confirm password'));
    await user.type(screen.getByLabelText('Confirm password'), 'long enough');
    await user.click(screen.getByRole('checkbox', { name: /privacy policy/i }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/already exists/);
  });
});

describe('password reset (integration)', () => {
  it('requests a link without revealing whether the account exists, then resets', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/If an account exists/);
    const token = Object.keys(db.resetTokens)[0];
    expect(db.resetTokens[token]).toBe('u2');
    unmount();

    renderWithProviders(<ResetPasswordPage />, { route: `/reset-password?token=${token}` });
    await user.type(screen.getByLabelText('New password'), 'brand new pw');
    await user.type(screen.getByLabelText('Confirm password'), 'brand new pw');
    await user.click(screen.getByRole('button', { name: 'Set password' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/password was changed/);
    expect(db.users.find((u) => u.id === 'u2')?.password).toBe('brand new pw');
    expect(db.resetTokens[token]).toBeUndefined(); // single use
  });

  it('rejects a used or unknown token', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=nope' });
    await user.type(screen.getByLabelText('New password'), 'brand new pw');
    await user.type(screen.getByLabelText('Confirm password'), 'brand new pw');
    await user.click(screen.getByRole('button', { name: 'Set password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/);
  });
});

describe('change password (integration)', () => {
  it('checks the current password, then changes it', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Current password'), 'wrong one');
    await user.type(screen.getByLabelText('New password'), 'brand new pw');
    await user.type(screen.getByLabelText('Confirm password'), 'brand new pw');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/current password is incorrect/);

    await user.clear(screen.getByLabelText('Current password'));
    await user.type(screen.getByLabelText('Current password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Password changed/);
    expect(db.users.find((u) => u.id === 'u2')?.password).toBe('brand new pw');
    expect(screen.getByLabelText('Current password')).toHaveValue(''); // form reset
  });
});
