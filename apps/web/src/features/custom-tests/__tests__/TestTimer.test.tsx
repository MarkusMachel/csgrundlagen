import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@/i18n/config';

import { TestTimer } from '../components/TestTimer';

describe('TestTimer', () => {
  it('a resumed attempt continues from the time actually left', () => {
    const nineMinutesAgo = new Date(Date.now() - 9 * 60_000).toISOString();
    render(<TestTimer durationMinutes={10} startedAt={nineMinutesAgo} onExpire={() => {}} />);
    expect(screen.getByRole('timer')).toHaveTextContent(/(1:00|0:59)$/);
  });

  it('a fresh attempt starts at the full duration', () => {
    render(<TestTimer durationMinutes={10} onExpire={() => {}} />);
    expect(screen.getByRole('timer')).toHaveTextContent(/10:00$/);
  });
});
