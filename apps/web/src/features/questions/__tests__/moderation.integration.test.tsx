import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { db } from '@/mocks/db';
import { AdminPage } from '@/pages/AdminPage';
import { loginAsDemo, loginAsRegularUser, renderWithProviders } from '@/test-utils';

import { CommentsTab } from '../components/ExpandableTabs/CommentsTab';

const comment = (text: RegExp) => screen.getByText(text).closest('.comment-item') as HTMLElement;

describe('comment moderation (integration)', () => {
  it('a reader reports a comment once, with a reason', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<CommentsTab questionId="q1" />);
    const c1 = await screen.findByText(/Please Do Not Throw Sausage Pizza Away/);

    await user.click(
      within(comment(/Sausage Pizza/)).getByRole('button', {
        name: 'Report comment by Ada Lovelace',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: /Report comment/ });
    await user.click(within(dialog).getByRole('radio', { name: 'Offensive or abusive' }));
    await user.type(within(dialog).getByLabelText(/Anything else/), 'rude');
    await user.click(within(dialog).getByRole('button', { name: 'Send report' }));

    expect(await within(comment(/Sausage Pizza/)).findByText('Reported')).toBeInTheDocument();
    expect(db.commentReports).toEqual([
      expect.objectContaining({ commentId: 'c1', userId: 'u1', reason: 'offensive', note: 'rude' }),
    ]);
    expect(c1).toBeInTheDocument();
  });

  it('authors delete their own comments after a second click; others can only report', async () => {
    loginAsRegularUser(); // Ada wrote c1
    const user = userEvent.setup();
    renderWithProviders(<CommentsTab questionId="q1" />);
    await screen.findByText(/Sausage Pizza/);
    const mine = comment(/Sausage Pizza/);
    expect(within(mine).queryByRole('button', { name: /Report/ })).not.toBeInTheDocument();

    await user.click(within(mine).getByRole('button', { name: 'Delete comment by Ada Lovelace' }));
    await user.click(within(mine).getByRole('button', { name: 'Delete?' }));
    await waitFor(() => expect(screen.queryByText(/Sausage Pizza/)).not.toBeInTheDocument());
    expect(db.comments.some((c) => c.id === 'c1')).toBe(false);
  });

  it('admins work through the reported queue: hide, find it under Hidden, unhide', async () => {
    db.commentReports.push({
      commentId: 'c1',
      userId: 'u3',
      reason: 'spam',
      createdAt: new Date().toISOString(),
    });
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);
    const tab = screen.getByRole('tab', { name: /Comments/ });
    expect(await within(tab).findByText('1')).toBeInTheDocument(); // badge
    await user.click(tab);

    expect(await screen.findByText(/reported by Grace Hopper/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(await screen.findByText('No open reports. All clear.')).toBeInTheDocument();
    expect(db.comments.find((c) => c.id === 'c1')!.hiddenAt).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Hidden' }));
    expect(await screen.findByText(/Sausage Pizza/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Unhide' }));
    expect(await screen.findByText('No hidden comments.')).toBeInTheDocument();
  });
});
