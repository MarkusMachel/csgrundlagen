import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { GlobalSearch } from '../components/GlobalSearch';

describe('global search (integration)', () => {
  it('shows grouped results and navigates to a question on click', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/" element={<GlobalSearch />} />
        <Route path="/questions/:id" element={<div data-testid="question-route" />} />
      </Routes>,
    );

    await user.type(screen.getByRole('searchbox'), 'OSI');
    const results = await screen.findByTestId('search-results');
    expect(within(results).getByText('Questions')).toBeInTheDocument();
    expect(within(results).getByText('Materials')).toBeInTheDocument();

    await user.click(
      within(results).getByText(/How many layers does the OSI reference model define/),
    );
    expect(await screen.findByTestId('question-route')).toBeInTheDocument();
  });

  it('shows a no-results message for a nonsense query', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<GlobalSearch />);
    await user.type(screen.getByRole('searchbox'), 'zzzzqqq');
    expect(await screen.findByText(/No results for "zzzzqqq"/)).toBeInTheDocument();
  });
});
