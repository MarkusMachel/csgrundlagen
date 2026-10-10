import { describe, expect, it } from 'vitest';

import { emptyFilters } from '../components/QuestionFilters';
import { filtersFromParams, filtersQuery, filtersToParams, sameFilters } from '../filterUrl';

describe('filters in the URL', () => {
  it('round-trips every filter', () => {
    const f = {
      search: 'tcp handshake',
      tags: ['Networking', 'Go'],
      difficulties: ['hard' as const],
      status: 'wrong' as const,
      sort: 'random' as const,
      seed: 'x1',
    };
    expect(filtersFromParams(filtersToParams(f))).toEqual(f);
  });

  it('writes nothing for the defaults, and reads no filters from a clean URL', () => {
    expect(filtersQuery(emptyFilters)).toBe('');
    expect(filtersFromParams(new URLSearchParams(''))).toBeNull();
    expect(filtersFromParams(new URLSearchParams('page=2'))).toBeNull();
  });

  it('ignores nonsense values and keeps unrelated params', () => {
    expect(
      filtersFromParams(new URLSearchParams('status=nope&sort=up&difficulty=insane&tag=Go')),
    ).toEqual({
      ...emptyFilters,
      tags: ['Go'],
    });
    expect(
      filtersToParams(
        { ...emptyFilters, tags: ['Go'] },
        new URLSearchParams('ref=mail'),
      ).toString(),
    ).toBe('ref=mail&tag=Go');
  });

  it('compares filters regardless of tag order', () => {
    expect(
      sameFilters({ ...emptyFilters, tags: ['a', 'b'] }, { ...emptyFilters, tags: ['b', 'a'] }),
    ).toBe(true);
    expect(sameFilters({ ...emptyFilters, tags: ['a'] }, emptyFilters)).toBe(false);
  });
});
