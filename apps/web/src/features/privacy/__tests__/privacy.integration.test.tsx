import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AccountPage } from '@/pages/AccountPage';
import { useAuthStore } from '@/stores/useAuthStore';
import { loginAsDemo, loginAsRegularUser, renderWithProviders } from '@/test-utils';

import { ConsentLayer } from '../components/ConsentLayer';
import { PolicyUpdateModal } from '../components/PolicyUpdateModal';
import { PrivacySettingsButton } from '../components/PrivacySettingsButton';
import { CONSENT_KEY, useConsentStore } from '../consent';
import { usePrivacySync } from '../hooks/usePrivacy';

const stored = () =>
  JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null') as {
    preferences: boolean;
    deviceDetails: boolean;
  } | null;

function Harness() {
  usePrivacySync();
  return (
    <>
      <ConsentLayer />
      <PrivacySettingsButton />
    </>
  );
}

describe('consent (integration)', () => {
  it('asks once; "Essential only" is as easy as "Accept all"; the choice reaches the server', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const banner = screen.getByRole('region', { name: 'Privacy choices' });
    await user.click(within(banner).getByRole('button', { name: 'Essential only' }));
    expect(screen.queryByRole('region', { name: 'Privacy choices' })).not.toBeInTheDocument();
    expect(stored()).toMatchObject({ preferences: false, deviceDetails: false });
    await waitFor(() =>
      expect(db.consents.at(-1)).toMatchObject({ userId: 'u1', deviceDetails: false }),
    );

    // change of mind: allow device details from the settings dialog
    await user.click(screen.getByRole('button', { name: 'Privacy settings' }));
    const dialog = screen.getByRole('dialog', { name: /Privacy settings/ });
    expect(within(dialog).getByRole('switch', { name: /Essential/ })).toBeDisabled();
    await user.click(within(dialog).getByRole('switch', { name: /Device details/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save my choices' }));
    expect(stored()).toMatchObject({ preferences: false, deviceDetails: true });

    // with consent, the browser's self-report is stored on this session
    await waitFor(() =>
      expect(db.sessions.find((s) => s.id === 's-u1')?.clientInfo?.timezone).toBeTruthy(),
    );
    expect(db.consents.filter((c) => c.userId === 'u1')).toHaveLength(2);
  });

  it('withdrawing device-details consent deletes what was collected', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    useConsentStore.getState().decide({ preferences: true, deviceDetails: true });
    renderWithProviders(<Harness />);
    await waitFor(() => expect(db.consents).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: 'Privacy settings' }));
    await user.click(screen.getByRole('button', { name: 'Essential only' }));
    await waitFor(() => expect(db.consents).toHaveLength(2));
    expect(db.sessions.filter((s) => s.userId === 'u1').every((s) => !s.clientInfo)).toBe(true);
  });
});

describe('privacy policy update (integration)', () => {
  it('asks a user who has not read the current policy, once', async () => {
    loginAsRegularUser();
    db.users.find((u) => u.id === 'u2')!.privacyVersion = undefined;
    useAuthStore.setState((s) => ({ user: s.user && { ...s.user, privacyVersion: undefined } }));
    const user = userEvent.setup();
    renderWithProviders(<PolicyUpdateModal />);

    const dialog = screen.getByRole('dialog', { name: /Our privacy policy/ });
    await user.click(within(dialog).getByRole('button', { name: 'Read it here' }));
    expect(within(dialog).getByText('Your rights')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'I’ve read it' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(db.users.find((u) => u.id === 'u2')!.privacyVersion).toBeTruthy();
  });
});

describe('your data (integration)', () => {
  it('deletes the account after the password and the confirmation word', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />, { route: '/account' });

    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    const dialog = screen.getByRole('dialog', { name: /Delete your account/ });
    const confirm = within(dialog).getByRole('button', { name: 'Delete for good' });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Password'), 'wrong');
    await user.type(within(dialog).getByLabelText(/Type DELETE/), 'DELETE');
    await user.click(confirm);
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('password is incorrect');

    await user.clear(within(dialog).getByLabelText('Password'));
    await user.type(within(dialog).getByLabelText('Password'), 'password');
    await user.click(confirm);
    await waitFor(() => expect(db.users.some((u) => u.id === 'u2')).toBe(false));
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('downloads everything stored about the user', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const urls: Blob[] = [];
    URL.createObjectURL = (b: Blob) => {
      urls.push(b);
      return 'blob:export';
    };
    URL.revokeObjectURL = () => {};
    renderWithProviders(<AccountPage />, { route: '/account' });
    await user.click(screen.getByRole('button', { name: 'Download my data' }));
    await waitFor(() => expect(urls).toHaveLength(1));
    const data = JSON.parse(
      await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(urls[0]);
      }),
    ) as {
      profile: { email: string };
      sessions: unknown[];
    };
    expect(data.profile.email).toBe('demo@example.com');
    expect(data.sessions.length).toBeGreaterThan(0);
  });
});
