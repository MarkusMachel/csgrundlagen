import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthModal } from '@/features/auth';
import { db } from '@/mocks/db';
import { HomePage } from '@/pages/HomePage';
import { useAuthPrompt } from '@/stores/useAuthPrompt';
import { useAuthStore } from '@/stores/useAuthStore';
import { loginAsRegularUser, renderWithProviders } from '@/test-utils';

function Location() {
  const l = useLocation();
  return <output data-testid="location">{l.pathname + l.search}</output>;
}

function renderHome(route = '/') {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/build" element={<p>builder</p>} />
      </Routes>
      <Location />
      <AuthModal />
    </>,
    { route },
  );
}

const location = () => screen.getByTestId('location').textContent;

describe('saved filters (integration)', () => {
  afterEach(() => useAuthPrompt.getState().cancel());

  it('puts filters in the URL and reads them back from it', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    renderHome('/?difficulty=hard');
    expect(await screen.findByRole('button', { name: 'hard' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'easy' }));
    expect(location()).toBe('/?difficulty=hard&difficulty=easy');
  });

  it('remembers the last filters for the next visit', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    const { unmount } = renderHome();
    await user.click(await screen.findByRole('button', { name: 'medium' }));
    unmount();
    renderHome();
    await waitFor(() => expect(location()).toBe('/?difficulty=medium'));
  });

  it('saves and applies a named filter, and starts a test from it', async () => {
    loginAsRegularUser();
    const user = userEvent.setup();
    renderHome('/?difficulty=hard');
    await user.click(await screen.findByRole('button', { name: 'Save these filters' }));
    await user.type(screen.getByRole('textbox', { name: 'Name for these filters' }), 'Hard ones');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const chip = await screen.findByRole('button', { name: 'Hard ones' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(db.savedFilters).toMatchObject([{ userId: 'u2', name: 'Hard ones' }]);

    // clicking the active one clears it, clicking again applies it
    await user.click(chip);
    expect(location()).toBe('/');
    await user.click(screen.getByRole('button', { name: 'Hard ones' }));
    expect(location()).toBe('/?difficulty=hard');

    // build a test from it: the builder opens with the same filters
    await user.click(screen.getByRole('link', { name: 'Build a test from Hard ones' }));
    expect(location()).toBe('/build?difficulty=hard');
  });

  it('shows the API error for a duplicate name, and deletes a filter', async () => {
    loginAsRegularUser();
    db.savedFilters.push({
      id: 'sf-x',
      userId: 'u2',
      name: 'Taken',
      filters: {
        search: '',
        tags: [],
        difficulties: ['easy'],
        status: '',
        sort: 'oldest',
        seed: '',
      },
      createdAt: new Date().toISOString(),
    });
    const user = userEvent.setup();
    renderHome('/?difficulty=hard');
    await user.click(await screen.findByRole('button', { name: 'Save these filters' }));
    await user.type(screen.getByRole('textbox', { name: 'Name for these filters' }), 'taken');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'you already have a filter with this name',
    );

    await user.click(screen.getByRole('button', { name: 'Delete saved filter Taken' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Taken' })).not.toBeInTheDocument(),
    );
    expect(db.savedFilters).toEqual([]);
  });

  it('signed out, saving asks to log in and then saves', async () => {
    useAuthStore.setState({ user: null, status: 'anonymous' });
    const user = userEvent.setup();
    renderHome('/?difficulty=hard');
    await user.click(await screen.findByRole('button', { name: 'Save these filters' }));
    await user.type(screen.getByRole('textbox', { name: 'Name for these filters' }), 'Mine');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = await screen.findByRole('dialog', { name: /log in to continue/i });
    await user.type(within(dialog).getByLabelText('Email'), 'ada@example.com');
    await user.type(within(dialog).getByLabelText('Password'), 'password');
    await user.click(within(dialog).getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('button', { name: 'Mine' })).toBeInTheDocument();
  });
});
