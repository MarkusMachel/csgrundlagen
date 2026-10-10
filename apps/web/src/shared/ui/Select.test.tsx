import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Select } from './Select';

const options = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'random', label: 'Random' },
];

function Harness({ searchable = false }: { searchable?: boolean }) {
  const [value, setValue] = useState('oldest');
  return (
    <>
      <span id="lbl">Sort</span>
      <Select
        labelledBy="lbl"
        value={value}
        onChange={setValue}
        options={options}
        searchable={searchable}
        searchPlaceholder="Filter"
      />
    </>
  );
}

describe('Select', () => {
  it('names the trigger after its label and value, and picks with the mouse', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Sort Oldest first' });
    await user.click(trigger);
    expect(screen.getByRole('option', { name: 'Oldest first' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('option', { name: 'Random' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort Random' })).toHaveFocus();
  });

  it('supports arrow keys, Enter, Escape and type-ahead', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole('button').focus();

    await user.keyboard('{ArrowDown}'); // opens on the selected option
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByRole('button', { name: 'Sort Newest first' })).toBeInTheDocument();

    await user.keyboard('{ArrowDown}r{Enter}'); // type-ahead jumps to "Random"
    expect(screen.getByRole('button', { name: 'Sort Random' })).toBeInTheDocument();

    await user.keyboard('{ArrowDown}{Home}{Escape}'); // Escape closes without picking
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort Random' })).toHaveFocus();
  });

  it('filters options when searchable', async () => {
    const user = userEvent.setup();
    render(<Harness searchable />);
    await user.click(screen.getByRole('button'));
    await user.type(screen.getByRole('combobox', { name: 'Filter' }), 'new');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Newest first']);
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Sort Newest first' })).toBeInTheDocument();
  });
});
